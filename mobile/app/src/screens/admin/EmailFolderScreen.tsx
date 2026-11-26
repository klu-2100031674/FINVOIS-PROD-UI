import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, FileSpreadsheet, Trash2, Upload } from 'lucide-react-native';
import { ConfirmDialog } from '~/components/email/ConfirmDialog';
import { Notice } from '~/components/email/Notice';
import { PageControls } from '~/components/email/PageControls';
import { EmptyState } from '~/components/EmptyState';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import {
  deleteEmailFolder,
  deleteFolderContact,
  emailKeys,
  listEmailFolders,
  listFolderContacts,
  uploadFolderExcel,
  type ColumnMapping,
  type EmailContact,
  type FolderUploadSummary,
  type ListParams,
} from '~/api/emailAutomation';
import { getSecure, setSecure } from '~/auth/storage';
import { discardPicked, pickExcelFile, type PickedFile } from '~/lib/documentPicker';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';
import { DEFAULT_MAPPING, MAX_EXCEL_BYTES, parseMapping } from '~/utils/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';

const PAGE_SIZE = 25;
const MAPPING_KEY = 'emailAutomationMapping';

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; hint: string }[] = [
  { key: 'email', label: 'Email column (required)', hint: 'For example, Email' },
  { key: 'bank', label: 'Bank name column (blank uses the file name)', hint: 'For example, Bank name' },
  { key: 'region', label: 'Region or branch column', hint: 'Type it exactly as in Excel' },
  { key: 'extra', label: 'Other columns to use in the email', hint: 'For example, Branch' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'EmailFolder'>;

export default function EmailFolderScreen({ navigation, route }: Props) {
  const { folderId } = route.params;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [showMapping, setShowMapping] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [summary, setSummary] = useState<FolderUploadSummary | null>(null);
  const [toRemove, setToRemove] = useState<EmailContact | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const qc = useQueryClient();

  usePreventScreenCapture();

  // The column names are remembered between uploads, as on the web.
  useEffect(() => {
    let alive = true;
    getSecure(MAPPING_KEY)
      .then((stored) => {
        if (alive) setMapping(parseMapping(stored));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // A picked workbook of addresses must not stay in the cache if the admin leaves without uploading it.
  useEffect(
    () => () => {
      setFile((current) => {
        if (current) discardPicked([current]);
        return null;
      });
    },
    []
  );

  const folders = useQuery({ queryKey: emailKeys.folders, queryFn: listEmailFolders });
  const folder = folders.data?.find((f) => f._id === folderId);
  const columns = (folder?.columns ?? []).filter((c) => c.key !== 'email');

  const params: ListParams = { page, limit: PAGE_SIZE, search: query };
  const contacts = useQuery({
    queryKey: emailKeys.contacts(folderId, params),
    queryFn: () => listFolderContacts(folderId, params),
    placeholderData: keepPreviousData,
  });

  const refreshFolder = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: emailKeys.contactsOf(folderId) }),
      qc.invalidateQueries({ queryKey: emailKeys.folders }),
    ]);

  const choose = async () => {
    setProblem(null);
    setSummary(null);
    try {
      const picked = await pickExcelFile();
      if (!picked) return;
      if ((picked.size ?? 0) > MAX_EXCEL_BYTES) {
        discardPicked([picked]);
        setProblem(`${picked.name} is too large. An Excel file must be 25 MB or smaller.`);
        return;
      }
      if (file) discardPicked([file]);
      setFile(picked);
    } catch {
      setProblem("Couldn't open that file. Try again.");
    }
  };

  const upload = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!file) return null;
      void setSecure(MAPPING_KEY, JSON.stringify(mapping)).catch(() => undefined);
      const result = await uploadFolderExcel(folderId, file, mapping);
      discardPicked([file]);
      setFile(null);
      setSummary(result);
      await refreshFolder();
      return result;
    },
    onError: (err) => setProblem(apiErrorMessage(err, "Couldn't read that file. Check it and try again.")),
  });
  const removeContact = useMutation({
    networkMode: 'always',
    mutationFn: async (c: EmailContact) => {
      await deleteFolderContact(folderId, c._id);
      await refreshFolder();
    },
    onError: (err) => setProblem(apiErrorMessage(err, "Couldn't remove the email. Try again.")),
  });
  const removeFolder = useMutation({
    networkMode: 'always',
    mutationFn: () => deleteEmailFolder(folderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: emailKeys.folders });
      navigation.goBack();
    },
    onError: (err) => setProblem(apiErrorMessage(err, "Couldn't delete the folder. Try again.")),
  });

  const list = contacts.data?.contacts ?? [];
  const mappingSummary = [mapping.email, mapping.bank, mapping.region, mapping.extra].map((s) => s.trim()).filter(Boolean).join(', ');

  const header = (
    <View className="gap-4 pb-3">
      <View className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <Text className="font-semibold text-gray-900">Add an Excel file</Text>
        <Text className="text-sm text-gray-500">Only valid emails are added. An email already in this folder is updated with the newer row.</Text>

        <Pressable
          testID="mapping-toggle"
          accessibilityRole="button"
          accessibilityState={{ expanded: showMapping }}
          onPress={() => setShowMapping(!showMapping)}
          className="min-h-11 flex-row items-center gap-2">
          <Text testID="mapping-summary" className="flex-1 text-sm text-gray-700" numberOfLines={2}>Columns read: {mappingSummary}</Text>
          {showMapping ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
        </Pressable>
        {showMapping
          ? MAPPING_FIELDS.map(({ key, label, hint }) => (
              <View key={key} className="gap-1">
                <Text className="text-xs font-medium text-gray-500">{label}</Text>
                <Input
                  testID={`mapping-${key}`}
                  value={mapping[key]}
                  onChangeText={(v) => setMapping((m) => ({ ...m, [key]: v }))}
                  placeholder={hint}
                  autoCorrect={false}
                  className="h-11 rounded-xl"
                />
              </View>
            ))
          : null}

        <Button testID="choose-excel" variant="outline" disabled={upload.isPending} onPress={() => void choose()} className="h-12 rounded-xl">
          <FileSpreadsheet size={18} color="#16a34a" />
          <Text testID="chosen-excel" className="shrink text-gray-900" numberOfLines={1}>{file ? file.name : 'Choose Excel file'}</Text>
        </Button>
        <Button
          testID="upload-excel"
          disabled={!file || !mapping.email.trim() || upload.isPending}
          onPress={() => {
            setProblem(null);
            upload.mutate();
          }}
          className="h-12 rounded-xl">
          {upload.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Upload size={18} color="#fff" />
              <Text>Add to folder</Text>
            </>
          )}
        </Button>
        {summary ? (
          <Notice tone="success" testID="upload-summary">
            {summary.file_name}: {summary.added} added, {summary.updated} updated, {summary.skipped} skipped (invalid, incomplete or repeated in the file).
          </Notice>
        ) : null}
      </View>
      {problem ? <Notice tone="error" testID="folder-problem">{problem}</Notice> : null}

      <View className="gap-2">
        <Text className="font-semibold text-gray-900">Emails in this folder</Text>
        <Input
          testID="contact-search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search email, bank, region"
          autoCapitalize="none"
          autoCorrect={false}
          className="h-11 rounded-xl"
        />
        {contacts.isError && contacts.data ? (
          <Notice tone="error" testID="contacts-refresh-error">{apiErrorMessage(contacts.error, "Couldn't refresh the emails.")} Pull down to try again.</Notice>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader
        title={folder?.name ?? 'Folder'}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            testID="delete-folder"
            accessibilityRole="button"
            accessibilityLabel="Delete this folder"
            disabled={removeFolder.isPending}
            onPress={() => {
              setProblem(null);
              setDeletingFolder(true);
            }}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-red-50">
            <Trash2 size={20} color="#b91c1c" />
          </Pressable>
        }
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <FlatList
          testID="folder-screen"
          data={contacts.isPending || (contacts.isError && !contacts.data) ? [] : list}
          keyExtractor={(c) => c._id}
          renderItem={({ item }) => (
            <View testID={`contact-${item._id}`} className="flex-row items-start gap-2 rounded-2xl border border-gray-200 bg-white p-3">
              <View className="min-w-0 flex-1 gap-0.5">
                <Text testID={`contact-email-${item._id}`} className="text-base font-medium text-gray-900" numberOfLines={1}>{item.email}</Text>
                {columns.map((c) =>
                  item.data?.[c.key] ? (
                    <Text key={c.key} className="text-sm text-gray-600" numberOfLines={1}>{c.label}: {item.data[c.key]}</Text>
                  ) : null
                )}
                {item.source ? <Text className="text-xs text-gray-500" numberOfLines={1}>{item.source}</Text> : null}
              </View>
              <Pressable
                testID={`contact-remove-${item._id}`}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.email}`}
                disabled={removeContact.isPending}
                onPress={() => {
                  setProblem(null);
                  setToRemove(item);
                }}
                className="h-11 w-11 items-center justify-center rounded-full active:bg-red-50">
                <Trash2 size={18} color={removeContact.isPending ? '#d1d5db' : '#b91c1c'} />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="px-5 pb-8 pt-1 grow"
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={contacts.isRefetching} onRefresh={() => void refreshFolder()} tintColor="#7c3aed" colors={['#7c3aed']} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            contacts.isPending ? (
              <View testID="contacts-loading" className="gap-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </View>
            ) : contacts.isError ? (
              <ErrorState message={apiErrorMessage(contacts.error, "Couldn't load the emails. Try again.")} onRetry={() => void contacts.refetch()} />
            ) : (
              <EmptyState title={query ? 'No matching emails' : 'No emails yet'} body={query ? 'Check the search.' : 'Upload an Excel file above.'} />
            )
          }
          ListFooterComponent={
            contacts.data ? (
              <View className="pt-3">
                <PageControls pagination={contacts.data.pagination} noun="email" onPage={setPage} testID="contacts" />
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={toRemove !== null}
        title="Remove this email?"
        body={`${toRemove?.email ?? ''} will be removed from ${folder?.name ?? 'this folder'}.`}
        confirm="Remove"
        onConfirm={() => toRemove && removeContact.mutate(toRemove)}
        onClose={() => setToRemove(null)}
        testID="remove-contact-dialog"
      />
      <ConfirmDialog
        open={deletingFolder}
        title="Delete this folder?"
        body={`${folder?.name ?? 'This folder'} and its ${folder?.count ?? 0} emails will be removed.`}
        confirm="Delete"
        onConfirm={() => removeFolder.mutate()}
        onClose={() => setDeletingFolder(false)}
        testID="delete-folder-dialog"
      />
    </SafeAreaView>
  );
}
