import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, RefreshCw, FileText, Replace, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { REPORT_HEAVY_TIMEOUT } from '../../api/apiClient';
import { formatDateTime } from '../../utils';

/**
 * Shared admin PDF upload + status panel (PMEGP, AP IDP, etc.).
 */
export default function AdminSchemePdfUploadPanel({
  title,
  description,
  statusPath,
  uploadPath,
}) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [doc, setDoc] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const pollRef = useRef(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await api.get(statusPath);
      setDoc(res?.data?.document || null);
      return res?.data?.document || null;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load knowledge status');
      return null;
    } finally {
      setStatusLoading(false);
    }
  }, [statusPath]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (doc?.status !== 'processing') return undefined;

    pollRef.current = setInterval(() => {
      loadStatus();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [doc?.status, loadStatus]);

  const uploadPdf = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(uploadPath, fd, {
        timeout: REPORT_HEAVY_TIMEOUT,
        validateStatus: (s) => (s >= 200 && s < 300) || s === 202,
      });
      setDoc(res?.data?.document || null);
      const processing = res?.data?.processing || res?.status === 202;
      toast.success(
        processing
          ? 'PDF uploaded. Replacing knowledge base — processing in background…'
          : 'PDF uploaded and processed successfully.',
      );
      setFile(null);
      setFileInputKey((k) => k + 1);
      if (processing) {
        await loadStatus();
      }
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Upload failed';
      toast.error(apiMsg);
      await loadStatus();
    } finally {
      setUploading(false);
    }
  };

  const status = doc?.status || 'missing';
  const badge =
    status === 'ready'
      ? 'bg-green-100 text-green-700'
      : status === 'processing'
        ? 'bg-amber-100 text-amber-800'
        : status === 'failed'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700';

  const hasExisting = status === 'ready' || status === 'failed' || status === 'processing';
  const lastUploadAt = doc?.updatedAt || doc?.createdAt || null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-700" />
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            {hasExisting && status !== 'missing' && (
              <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Uploading a new PDF will replace the current knowledge base. The previous PDF and
                chunks are removed when processing starts.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={loadStatus}
            disabled={statusLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
            Status: {status}
          </span>
          {doc?.originalFileName && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 max-w-xs truncate"
              title={doc.originalFileName}
            >
              File: {doc.originalFileName}
            </span>
          )}
          {doc?.stats?.chunkCount != null && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              Chunks: {doc.stats.chunkCount}
            </span>
          )}
          {doc?.stats?.pages != null && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              Pages: {doc.stats.pages}
            </span>
          )}
        </div>

        {status === 'processing' && (
          <p className="mt-4 text-sm text-amber-800">
            Processing in progress… This page refreshes automatically. Large PDFs may take several
            minutes.
          </p>
        )}

        {status === 'failed' && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {doc?.error || 'Processing failed.'}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Clock className="w-4 h-4 text-purple-700 shrink-0" />
            Last upload
          </div>
          {statusLoading ? (
            <p className="mt-2 text-sm text-gray-500">Loading…</p>
          ) : lastUploadAt ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-gray-500">Date &amp; time</dt>
                <dd className="font-semibold text-gray-900">{formatDateTime(lastUploadAt)}</dd>
              </div>
              {doc?.originalFileName && (
                <div>
                  <dt className="text-gray-500">File name</dt>
                  <dd className="font-semibold text-gray-900 break-all">{doc.originalFileName}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-gray-600">No PDF has been uploaded for this scheme yet.</p>
          )}
          {lastUploadAt && status === 'processing' && (
            <p className="mt-2 text-xs text-amber-800">
              Upload started at the time above; processing may still be in progress.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            {hasExisting ? 'Select replacement PDF' : 'Select PDF'}
          </label>
          <input
            key={fileInputKey}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
          {file && (
            <p className="mt-2 text-xs text-gray-600">
              Selected: <span className="font-mono">{file.name}</span> •{' '}
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={uploadPdf}
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {hasExisting ? <Replace className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {uploading
              ? 'Uploading…'
              : hasExisting
                ? 'Replace & Process'
                : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  );
}