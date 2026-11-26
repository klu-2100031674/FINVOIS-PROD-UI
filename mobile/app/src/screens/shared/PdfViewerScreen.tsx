import { createElement, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FileText } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Text } from '~/components/ui/text';
import { ErrorState } from '~/components/ErrorState';
import { ScreenHeader } from '~/components/ScreenHeader';
import { pdfErrorMessage, usePdfDocument } from '~/hooks/useAdminReportsPdf';
import type { RootStackParamList } from '~/navigation/types';
import { usePreventScreenCapture } from '~/security/secureScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfViewer'>;

// Shared by the admin (source 'admin-report') and the agent (source 'request-report').
export default function PdfViewerScreen({ route, navigation }: Props) {
  const { source, id, title } = route.params;
  const pdf = usePdfDocument(source, id);
  const [shareError, setShareError] = useState<string | null>(null);

  // Android FLAG_SECURE / iOS capture block while a report is on screen.
  usePreventScreenCapture();

  const openNative = async (uri: string) => {
    setShareError(null);
    try {
      // The share sheet is the system's way to open a PDF in a viewer; it only appears on the user's tap.
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Open report' });
    } catch {
      setShareError("This device couldn't open the PDF. Install a PDF viewer and try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']} testID="pdf-viewer">
      <ScreenHeader title={title || 'Report PDF'} onBack={() => navigation.goBack()} />
      {pdf.isPending ? (
        <View className="flex-1 gap-3 px-5 pb-5" testID="pdf-loading">
          <Skeleton className="flex-1 rounded-2xl" />
          <Text className="text-center text-sm text-gray-500">Preparing the report</Text>
        </View>
      ) : pdf.isError ? (
        <ErrorState message={pdfErrorMessage(pdf.error)} onRetry={() => void pdf.refetch()} />
      ) : Platform.OS === 'web' ? (
        <View className="flex-1 px-3 pb-3">
          {createElement('iframe', {
            src: pdf.data.uri,
            title: title || 'Report PDF',
            'data-testid': 'pdf-frame',
            style: { border: 0, width: '100%', height: '100%', borderRadius: 16, background: '#f3f4f6' },
          })}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center gap-4 px-8" testID="pdf-ready">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
            <FileText size={30} color="#7c3aed" />
          </View>
          <Text className="font-manrope text-xl text-gray-900">Report is ready</Text>
          <Text className="text-center text-gray-600">
            Open it in a PDF viewer on this device. The file is removed when you close this screen.
          </Text>
          {shareError ? (
            <Text testID="pdf-share-error" className="text-center text-sm text-red-700">{shareError}</Text>
          ) : null}
          <Button testID="open-pdf" className="h-12 w-full rounded-xl" onPress={() => void openNative(pdf.data.uri)}>
            <Text>Open PDF</Text>
          </Button>
          <Button testID="close-pdf" variant="outline" className="h-12 w-full rounded-xl" onPress={() => navigation.goBack()}>
            <Text>Close</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
