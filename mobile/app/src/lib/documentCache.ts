import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { sessionStore } from '~/auth/sessionStore';

// Applicant documents (ID proofs, bank statements) are as sensitive as reports (docs/06 section 5): they live only in
// the app's cache folder and are removed when the Documents screen closes, on sign-out and when the next one opens.
// The API gives no authenticated download. The documents list carries a short-lived signed storage link per file, and
// that link is fetched without our Authorization header: it needs none, and the storage host must never see the token.
const FOLDER = 'documents';

export interface DocumentToOpen {
  id: string;
  fileName: string;
  contentType?: string;
  url?: string;
}

export interface CachedDocument {
  name: string;
  /** file:// URI on device, blob: URL on web (the web build is only a test harness). */
  uri: string;
}

/** The list had no usable link for this file (missing, or not https). */
export class DocumentUnavailableError extends Error {
  constructor() {
    super('Document unavailable');
    this.name = 'DocumentUnavailableError';
  }
}

/** Ids and names come from the server, so only [A-Za-z0-9] of the id and a short extension reach the file path. */
export function documentFileName(id: string, fileName: string): string {
  const base = id.replace(/[^A-Za-z0-9]/g, '') || 'document';
  const ext = /\.([A-Za-z0-9]{1,5})$/.exec(fileName)?.[1]?.toLowerCase();
  return ext ? `${base}.${ext}` : base;
}

export function isHttpsUrl(url?: string): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

const webUrls = new Map<string, string>();
const folder = () => new Directory(Paths.cache, FOLDER);

export function removeDocument(name: string): void {
  if (Platform.OS === 'web') {
    const url = webUrls.get(name);
    if (url) URL.revokeObjectURL(url);
    webUrls.delete(name);
    return;
  }
  try {
    const file = new File(folder(), name);
    if (file.exists) file.delete();
  } catch {
    // Already gone, or the folder was swept in between: nothing left to protect.
  }
}

/** Deletes every cached document. The Documents screen runs it on mount and unmount, and sign-out runs it too. */
export function sweepDocumentCache(): void {
  if (Platform.OS === 'web') {
    webUrls.forEach((url) => URL.revokeObjectURL(url));
    webUrls.clear();
    return;
  }
  try {
    const dir = folder();
    if (dir.exists) dir.delete();
  } catch {
    // Retried at the next mount or sign-out.
  }
}

export async function downloadDocument(doc: DocumentToOpen): Promise<CachedDocument> {
  if (!isHttpsUrl(doc.url)) throw new DocumentUnavailableError();
  const name = documentFileName(doc.id, doc.fileName);
  // Only one opened document at a time stays on disk.
  sweepDocumentCache();

  if (Platform.OS === 'web') {
    const res = await fetch(doc.url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const uri = URL.createObjectURL(await res.blob());
    webUrls.set(name, uri);
    return { name, uri };
  }

  const dir = folder();
  dir.create({ idempotent: true, intermediates: true });
  const file = await File.downloadFileAsync(doc.url, new File(dir, name), { idempotent: true });
  return { name, uri: file.uri };
}

/** Downloads the document into the cache and hands it to a viewer on the user's tap. */
export async function openDocument(doc: DocumentToOpen): Promise<void> {
  const cached = await downloadDocument(doc);
  if (Platform.OS === 'web') {
    window.open(cached.uri, '_blank', 'noopener');
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('No viewer available');
  // The share sheet is the system's way to open a file in a viewer. The file stays until the screen closes, because the
  // viewer may still be reading it when the sheet is dismissed.
  await Sharing.shareAsync(cached.uri, { mimeType: doc.contentType, dialogTitle: 'Open document' });
}

/** One short sentence for a failed open. Never raw exception text. */
export function documentErrorMessage(err: unknown, fileName: string): string {
  if (err instanceof DocumentUnavailableError) return `${fileName} isn't available to open right now.`;
  return `Couldn't open ${fileName}. Check your connection and try again.`;
}

/** Makes sign-out wipe the cache. The hook set holds each function once, so calling this again is harmless. */
export function registerDocumentCacheCleanup(): () => void {
  return sessionStore.onSignOut(sweepDocumentCache);
}

registerDocumentCacheCleanup();
