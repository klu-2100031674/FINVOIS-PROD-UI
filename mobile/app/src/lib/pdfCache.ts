import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { sessionStore } from '~/auth/sessionStore';

// Report PDFs are sensitive (docs/06 section 5): they live only in the app's cache folder, never in shared storage,
// and are removed when the viewer closes, on sign-out, and at app start.
const FOLDER = 'reports';

export interface CachedPdf {
  name: string;
  /** file:// URI on device, blob: URL on web (the web build is only a test harness). */
  uri: string;
}

/** Ids come from navigation params, which a deep link can influence, so only [A-Za-z0-9] reaches the file path. */
export function pdfFileName(source: string, id: string): string {
  return `${source.replace(/[^A-Za-z0-9-]/g, '')}-${id.replace(/[^A-Za-z0-9]/g, '')}.pdf`;
}

const webUrls = new Map<string, string>();
const folder = () => new Directory(Paths.cache, FOLDER);

export function savePdf(name: string, bytes: Uint8Array<ArrayBuffer>, type = 'application/pdf'): CachedPdf {
  if (Platform.OS === 'web') {
    removePdf(name);
    const uri = URL.createObjectURL(new Blob([bytes], { type }));
    webUrls.set(name, uri);
    return { name, uri };
  }
  const dir = folder();
  dir.create({ idempotent: true, intermediates: true });
  const file = new File(dir, name);
  file.create({ overwrite: true });
  file.write(bytes);
  return { name, uri: file.uri };
}

export function removePdf(name: string): void {
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

/** Deletes every cached report. Wire this at app start; the viewer calls it on mount and sign-out runs it too. */
export function sweepPdfCache(): void {
  if (Platform.OS === 'web') {
    webUrls.forEach((url) => URL.revokeObjectURL(url));
    webUrls.clear();
    return;
  }
  try {
    const dir = folder();
    if (dir.exists) dir.delete();
  } catch {
    // Retried at the next start, mount or sign-out.
  }
}

/** Makes sign-out wipe the cache. The hook set holds each function once, so calling this again is harmless. */
export function registerPdfCacheCleanup(): () => void {
  return sessionStore.onSignOut(sweepPdfCache);
}

registerPdfCacheCleanup();
