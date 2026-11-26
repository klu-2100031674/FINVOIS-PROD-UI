import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useMutation } from '@tanstack/react-query';
import { FileSpreadsheet } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { fetchExcelBytes, type PdfSource } from '~/api/adminReports';
import { pdfFileName, removePdf, savePdf } from '~/lib/pdfCache';
import { apiErrorMessage, apiErrorStatus } from '~/utils/errors';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface Props {
  source: PdfSource;
  id: string;
  /** Used as the saved file's name on the web test build. */
  title?: string;
}

// The workbook is treated like the report PDF (docs/06 section 5): it stays in the app cache, only reaches another app
// through the share sheet on the user's tap, and is removed when this screen closes and on sign-out.
export function ExcelDownloadButton({ source, id, title }: Props) {
  const saved = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (saved.current) removePdf(saved.current);
    },
    []
  );

  const download = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const bytes = await fetchExcelBytes(source, id);
      const name = pdfFileName(`${source}-excel`, id).replace(/\.pdf$/, '.xlsx');
      const file = savePdf(name, bytes, XLSX);
      saved.current = name;
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = file.uri;
        a.download = `${(title || 'report').replace(/[^\w.-]+/g, '_')}.xlsx`;
        a.click();
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: XLSX, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: 'Open workbook' });
    },
  });

  const message = download.isError
    ? apiErrorStatus(download.error) === 404
      ? "The Excel file isn't available yet."
      : apiErrorMessage(download.error, "The Excel file couldn't be opened. Try again.")
    : null;

  return (
    <View className="gap-2">
      <Button
        testID="download-excel"
        variant="outline"
        disabled={download.isPending}
        onPress={() => download.mutate()}
        className="h-12 rounded-xl">
        {download.isPending ? (
          <ActivityIndicator color="#16a34a" />
        ) : (
          <>
            <FileSpreadsheet size={18} color="#16a34a" />
            <Text className="text-gray-900">Download Excel</Text>
          </>
        )}
      </Button>
      {message ? <Text testID="excel-error" accessibilityRole="alert" className="text-center text-sm text-red-700">{message}</Text> : null}
    </View>
  );
}
