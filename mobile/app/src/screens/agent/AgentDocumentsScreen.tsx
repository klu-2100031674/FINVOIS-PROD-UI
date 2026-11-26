import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, File as FileIcon, FileSpreadsheet, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react-native';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_FILE_BYTES,
  agentKeys,
  deleteDocument,
  listDocuments,
  uploadDocuments,
  type RequestDocument,
} from '~/api/agentRequests';
import { documentErrorMessage, openDocument, sweepDocumentCache } from '~/lib/documentCache';
import { discardPicked, pickDocuments, uploadProblem } from '~/lib/documentPicker';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { ACCESS_DENIED_MESSAGE, isAccessDenied } from '~/utils/agentRequest';
import { apiErrorMessage } from '~/utils/errors';
import { formatDate } from '~/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AgentDocuments'>;

const KIND_ICON = { document: FileText, image: ImageIcon, excel: FileSpreadsheet } as const;

const formatSize = (bytes?: number) => {
  if (!bytes || bytes < 0) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const typeLabel = (doc: RequestDocument) => {
  const ext = /\.([A-Za-z0-9]{1,5})$/.exec(doc.fileName)?.[1]?.toUpperCase();
  return ext ?? (doc.kind === 'image' ? 'Image' : doc.kind === 'excel' ? 'Sheet' : 'File');
};

export default function AgentDocumentsScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [opening, setOpening] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<RequestDocument | null>(null);
  const qc = useQueryClient();

  // Applicant documents are sensitive: no screenshots or recordings while this screen is mounted.
  usePreventScreenCapture();

  // Cached copies are removed when the screen closes, and any left from an earlier visit are removed on arrival.
  useEffect(() => {
    sweepDocumentCache();
    return sweepDocumentCache;
  }, []);

  const docs = useQuery({
    queryKey: agentKeys.documents(requestId),
    queryFn: () => listDocuments(requestId),
    networkMode: 'always',
  });
  const denied = docs.isError && isAccessDenied(docs.error);
  const list = docs.data?.documents ?? [];
  const canMutate = docs.data?.canMutate ?? false;
  const maxFiles = docs.data?.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = docs.data?.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;

  // Stay pending until the list is fresh, so the new row or the removed one is on screen before the button is back.
  const refresh = () => qc.invalidateQueries({ queryKey: agentKeys.documents(requestId) });
  const upload = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const picked = await pickDocuments();
      if (!picked.length) return;
      try {
        const problem = uploadProblem(picked, list.length, maxFiles, maxBytes);
        if (problem) {
          setUploadError(problem);
          return;
        }
        await uploadDocuments(requestId, picked);
      } finally {
        discardPicked(picked);
      }
      await refresh();
    },
    onError: (err) => setUploadError(apiErrorMessage(err, "Couldn't upload the files. Try again.")),
  });
  const remove = useMutation({
    networkMode: 'always',
    mutationFn: async (doc: RequestDocument) => {
      await deleteDocument(requestId, doc.id);
      await refresh();
    },
    onError: (err) => setUploadError(apiErrorMessage(err, "Couldn't delete the file. Try again.")),
  });
  const busy = upload.isPending || remove.isPending;

  const open = async (doc: RequestDocument) => {
    setFailure(null);
    setOpening(doc.id);
    try {
      await openDocument(doc);
    } catch (err) {
      setFailure({ id: doc.id, message: documentErrorMessage(err, doc.fileName) });
      // The signed links expire, so a retry should start from a fresh list.
      void docs.refetch();
    } finally {
      setOpening(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Documents" onBack={() => navigation.goBack()} />

      {docs.isPending ? (
        <View testID="documents-loading" className="gap-3 px-5 pt-1">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </View>
      ) : denied ? (
        <View testID="access-denied" accessibilityRole="alert" className="items-center gap-2 px-6 py-16">
          <Text className="text-center font-manrope text-lg text-gray-900">{ACCESS_DENIED_MESSAGE}</Text>
        </View>
      ) : docs.isError && !docs.data ? (
        <ErrorState message={apiErrorMessage(docs.error, "Couldn't load the documents. Try again.")} onRetry={() => void docs.refetch()} />
      ) : (
        <FlatList
          testID="documents-list"
          data={list}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => {
            const Icon = KIND_ICON[item.kind ?? 'document'] ?? FileIcon;
            const meta = [typeLabel(item), formatSize(item.size), formatDate(item.createdAt)].filter(Boolean).join(' · ');
            return (
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    testID={`document-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.fileName}`}
                    disabled={opening !== null}
                    onPress={() => void open(item)}
                    className="min-w-0 flex-1 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                      <Icon size={20} color="#7c3aed" />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text testID={`document-name-${item.id}`} className="text-base font-medium text-gray-900" numberOfLines={1}>{item.fileName}</Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>{meta}</Text>
                    </View>
                    {opening === item.id ? <ActivityIndicator testID={`document-busy-${item.id}`} color="#7c3aed" /> : <ExternalLink size={18} color="#9ca3af" />}
                  </Pressable>
                  {canMutate ? (
                    <Pressable
                      testID={`document-delete-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${item.fileName}`}
                      disabled={busy}
                      hitSlop={4}
                      onPress={() => setToDelete(item)}
                      className="h-11 w-11 items-center justify-center rounded-full active:bg-red-50">
                      <Trash2 size={18} color={busy ? '#d1d5db' : '#b91c1c'} />
                    </Pressable>
                  ) : null}
                </View>
                {failure?.id === item.id ? (
                  <Text testID="document-error" accessibilityRole="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {failure.message}
                  </Text>
                ) : null}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 pt-1 grow"
          refreshControl={<RefreshControl refreshing={docs.isRefetching} onRefresh={() => void docs.refetch()} tintColor="#7c3aed" colors={['#7c3aed']} />}
          ListHeaderComponent={
            <View className={docs.isError || canMutate || uploadError ? 'mb-3 gap-3' : undefined}>
              {docs.isError ? (
                <Text testID="refresh-error" accessibilityRole="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiErrorMessage(docs.error, "Couldn't refresh the documents.")} Pull down to try again.
                </Text>
              ) : null}
              {canMutate ? (
                <View className="gap-1">
                  <Button
                    testID="upload-documents"
                    variant="outline"
                    disabled={busy || list.length >= maxFiles}
                    onPress={() => {
                      setUploadError(null);
                      upload.mutate();
                    }}
                    className="h-12 rounded-xl">
                    {upload.isPending ? (
                      <ActivityIndicator color="#7c3aed" />
                    ) : (
                      <>
                        <Upload size={18} color="#7c3aed" />
                        <Text className="text-gray-900">Upload documents</Text>
                      </>
                    )}
                  </Button>
                  <Text testID="upload-limits" className="text-xs text-gray-500">
                    PDF, Word, images, Excel or CSV. Up to {Math.round(maxBytes / (1024 * 1024))} MB each, {maxFiles} files per request.
                  </Text>
                </View>
              ) : null}
              {uploadError ? (
                <Text testID="upload-error" accessibilityRole="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState title="No documents yet" body="Documents the applicant or staff upload show up here." icon={FileText} />}
        />
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent testID="delete-document-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.fileName} will be removed from this request for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel testID="delete-document-cancel"><Text>Keep it</Text></AlertDialogCancel>
            <AlertDialogAction
              testID="delete-document-confirm"
              onPress={() => {
                if (!toDelete) return;
                setUploadError(null);
                remove.mutate(toDelete);
              }}>
              <Text>Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}
