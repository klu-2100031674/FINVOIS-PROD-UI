import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { UploadFile } from '~/api/agentRequests';

// The same file types the server and the web upload panel accept. Picking needs no storage permission (doc 07).
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

export type PickedFile = UploadFile & { size?: number };

export async function pickDocuments(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ACCEPTED_TYPES,
    multiple: true,
    copyToCacheDirectory: true,
    base64: false,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size, file: a.file }));
}

/** The sentence to show when these files can't be uploaded, checked here so a large file is not sent for nothing. */
export function uploadProblem(files: PickedFile[], existing: number, maxFiles: number, maxBytes: number): string | null {
  if (existing + files.length > maxFiles) {
    return `A request can hold ${maxFiles} files. ${existing} are already uploaded.`;
  }
  const big = files.find((f) => (f.size ?? 0) > maxBytes);
  return big ? `${big.name} is too large. Each file must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.` : null;
}

/** The picker copies each file into the app cache. Applicant documents must not stay there after the upload. */
export function discardPicked(files: PickedFile[]): void {
  if (Platform.OS === 'web') return;
  for (const f of files) {
    try {
      const file = new File(f.uri);
      if (file.exists) file.delete();
    } catch {
      // Already gone: nothing left to protect.
    }
  }
}

const ATTACHMENT_TYPES = [
  ...ACCEPTED_TYPES,
  'image/gif',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const toPicked = (result: DocumentPicker.DocumentPickerResult): PickedFile[] =>
  result.canceled
    ? []
    : result.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size, file: a.file }));

/** Files for an Email automation mail, the types the server's attachment route accepts. */
export async function pickEmailAttachments(): Promise<PickedFile[]> {
  return toPicked(await DocumentPicker.getDocumentAsync({ type: ATTACHMENT_TYPES, multiple: true, copyToCacheDirectory: true, base64: false }));
}

/** One workbook of email addresses. Removed from the cache with discardPicked once uploaded. */
export async function pickExcelFile(): Promise<PickedFile | null> {
  const picked = toPicked(
    await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      multiple: false,
      copyToCacheDirectory: true,
      base64: false,
    })
  );
  return picked[0] ?? null;
}
