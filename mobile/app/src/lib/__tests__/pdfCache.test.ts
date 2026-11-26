import { sessionStore } from '~/auth/sessionStore';
import { pdfFileName, registerPdfCacheCleanup, removePdf, savePdf, sweepPdfCache } from '../pdfCache';

// jest.mock calls are hoisted above these imports by babel-jest.
// In-memory stand-in for expo-file-system's File / Directory / Paths (native path of pdfCache).
jest.mock('expo-file-system', () => {
  const files = new Map<string, Uint8Array>();
  const dirs = new Set<string>();
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
    create() {
      files.set(this.uri, new Uint8Array());
    }
    write(bytes: Uint8Array) {
      files.set(this.uri, bytes);
    }
    delete() {
      files.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { cache: new Directory('file:///cache') }, __files: files };
});

const stored = () => [...(jest.requireMock('expo-file-system').__files as Map<string, Uint8Array>).keys()];
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

afterEach(() => sweepPdfCache());

describe('pdf cache (native)', () => {
  it('writes into the reports folder of the app cache only', () => {
    const saved = savePdf('admin-report-abc.pdf', pdf);
    expect(saved.uri).toBe('file:///cache/reports/admin-report-abc.pdf');
    expect(stored()).toEqual([saved.uri]);
  });

  it('removes one file when the viewer closes', () => {
    savePdf('a.pdf', pdf);
    const b = savePdf('b.pdf', pdf);
    removePdf('a.pdf');
    expect(stored()).toEqual([b.uri]);
    expect(() => removePdf('a.pdf')).not.toThrow();
  });

  it('sweeps every cached report', () => {
    savePdf('a.pdf', pdf);
    savePdf('b.pdf', pdf);
    sweepPdfCache();
    expect(stored()).toEqual([]);
    expect(() => sweepPdfCache()).not.toThrow();
  });

  it('keeps ids from steering the file path', () => {
    expect(pdfFileName('admin-report', '65f0a1b2c3d4e5f6a7b8c9d0')).toBe('admin-report-65f0a1b2c3d4e5f6a7b8c9d0.pdf');
    expect(pdfFileName('request-report', '../../secrets/x')).toBe('request-report-secretsx.pdf');
  });

  it('is wiped when the session ends', () => {
    const onSignOut = jest.spyOn(sessionStore, 'onSignOut');
    registerPdfCacheCleanup();
    const hook = onSignOut.mock.calls[0][0];
    savePdf('a.pdf', pdf);
    void hook();
    expect(stored()).toEqual([]);
    onSignOut.mockRestore();
  });
});
