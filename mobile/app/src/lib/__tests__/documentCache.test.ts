// In-memory stand-in for expo-file-system's File / Directory / Paths, with the static download call.
jest.mock('expo-file-system', () => {
  const files = new Map<string, Uint8Array>();
  const dirs = new Set<string>();
  const downloads: { url: string; destination: string; options: unknown }[] = [];
  const join = (parts: unknown[]) =>
    parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/').replace(/\/+/g, '/').replace('file:/', 'file:///');

  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return dirs.has(this.uri);
    }
    create() {
      dirs.add(this.uri);
    }
    delete() {
      dirs.delete(this.uri);
      for (const key of [...files.keys()]) if (key.startsWith(`${this.uri}/`)) files.delete(key);
    }
  }
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return files.has(this.uri);
    }
    delete() {
      files.delete(this.uri);
    }
    static downloadFileAsync = async (url: string, destination: File, options?: unknown) => {
      downloads.push({ url, destination: destination.uri, options });
      files.set(destination.uri, new Uint8Array([1]));
      return destination;
    };
  }
  return { Directory, File, Paths: { cache: new Directory('file:///cache') }, __files: files, __downloads: downloads };
});
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn(async () => undefined) }));

import * as Sharing from 'expo-sharing';
import { sessionStore } from '~/auth/sessionStore';
import {
  DocumentUnavailableError,
  documentErrorMessage,
  documentFileName,
  downloadDocument,
  isHttpsUrl,
  openDocument,
  registerDocumentCacheCleanup,
  removeDocument,
  sweepDocumentCache,
} from '../documentCache';

const fsMock = () => jest.requireMock('expo-file-system') as { __files: Map<string, Uint8Array>; __downloads: { url: string; destination: string; options: unknown }[] };
const stored = () => [...fsMock().__files.keys()];
const doc = { id: 'abc123', fileName: 'Aadhaar front.PDF', contentType: 'application/pdf', url: 'https://files.example.test/signed/aadhaar.pdf?sig=1' };

beforeEach(() => {
  sweepDocumentCache();
  fsMock().__downloads.length = 0;
  jest.clearAllMocks();
});

describe('document file names', () => {
  it('keeps only the id characters and a short extension, never the uploaded name', () => {
    expect(documentFileName('abc123', 'Aadhaar front.PDF')).toBe('abc123.pdf');
    expect(documentFileName('../../x/y', '../../etc/passwd')).toBe('xy');
    expect(documentFileName('', 'scan.jpeg')).toBe('document.jpeg');
    expect(documentFileName('a1', 'archive.toolongext')).toBe('a1');
  });
});

describe('document links', () => {
  it('accepts https links only', () => {
    expect(isHttpsUrl('https://files.example.test/a.pdf')).toBe(true);
    expect(isHttpsUrl('http://files.example.test/a.pdf')).toBe(false);
    expect(isHttpsUrl('temp/e2e/sample.pdf')).toBe(false);
    expect(isHttpsUrl('file:///etc/passwd')).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
  });

  it('refuses to download without a usable link and says so in plain words', async () => {
    await expect(downloadDocument({ ...doc, url: 'http://insecure.test/a.pdf' })).rejects.toBeInstanceOf(DocumentUnavailableError);
    await expect(downloadDocument({ ...doc, url: undefined })).rejects.toBeInstanceOf(DocumentUnavailableError);
    expect(fsMock().__downloads).toHaveLength(0);
    expect(documentErrorMessage(new DocumentUnavailableError(), 'a.pdf')).toBe("a.pdf isn't available to open right now.");
    expect(documentErrorMessage(new Error('socket hang up 10.0.0.1'), 'a.pdf')).toBe("Couldn't open a.pdf. Check your connection and try again.");
  });
});

describe('document cache (native)', () => {
  it('downloads into the documents folder of the app cache, with no Authorization header', async () => {
    const cached = await downloadDocument(doc);
    expect(cached.uri).toBe('file:///cache/documents/abc123.pdf');
    expect(stored()).toEqual([cached.uri]);
    const [call] = fsMock().__downloads;
    expect(call.url).toBe(doc.url);
    expect(JSON.stringify(call.options)).not.toMatch(/authorization|headers/i);
  });

  it('opens the cached copy in a viewer on the share sheet', async () => {
    await openDocument(doc);
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/documents/abc123.pdf', {
      mimeType: 'application/pdf',
      dialogTitle: 'Open document',
    });
  });

  it('keeps only the document that was opened last', async () => {
    await downloadDocument(doc);
    await downloadDocument({ ...doc, id: 'def456', fileName: 'bank.pdf' });
    expect(stored()).toEqual(['file:///cache/documents/def456.pdf']);
  });

  it('removes one file, or all of them', async () => {
    await downloadDocument(doc);
    removeDocument('abc123.pdf');
    expect(stored()).toEqual([]);
    await downloadDocument(doc);
    sweepDocumentCache();
    expect(stored()).toEqual([]);
  });

  it('wipes the cache when the session ends', async () => {
    const onSignOut = jest.spyOn(sessionStore, 'onSignOut');
    registerDocumentCacheCleanup();
    const hook = onSignOut.mock.calls[0][0];
    await downloadDocument(doc);
    void hook();
    expect(stored()).toEqual([]);
    onSignOut.mockRestore();
  });
});
