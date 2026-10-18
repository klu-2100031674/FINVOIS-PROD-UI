import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, RefreshCw, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { adminGenieAPI, GENIE_DOCUMENT_EXTENSIONS, GENIE_MAX_DOCUMENT_MB } from '../../../api/genieAPI';
import { DocumentRowsSkeleton } from '../GenieSkeletons';

const POLL_MS = 4000;

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const StatusChip = ({ status, error }) => {
  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span
        title={error}
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200"
      >
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
      <CheckCircle2 className="h-3 w-3" /> Ready
    </span>
  );
};

/**
 * Upload knowledge documents for a scheme. Uploads return immediately; the server splits and
 * indexes them in the background, so this list polls while anything is still processing.
 */
export default function DocumentManager({ schemeId, schemeName }) {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [ragError, setRagError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const data = await adminGenieAPI.listDocuments(schemeId);
        setDocuments(data.documents || []);
        setRagError(data.ragError || null);
      } catch (err) {
        if (!quiet) toast.error(err.message);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [schemeId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const processing = documents.some((doc) => doc.status === 'processing');
  useEffect(() => {
    if (!processing) return undefined;
    const timer = window.setInterval(() => load({ quiet: true }), POLL_MS);
    return () => window.clearInterval(timer);
  }, [processing, load]);

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const invalid = files.find(
      (file) => !GENIE_DOCUMENT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
    if (invalid) {
      toast.error(`"${invalid.name}" is not a PDF, TXT or CSV file`);
      return;
    }
    const tooBig = files.find((file) => file.size > GENIE_MAX_DOCUMENT_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" is larger than ${GENIE_MAX_DOCUMENT_MB} MB`);
      return;
    }

    setUploadProgress(0);
    try {
      await adminGenieAPI.uploadDocuments(schemeId, files, (event) => {
        if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      toast.success(
        files.length === 1
          ? `${files[0].name} uploaded. Genie is reading it now.`
          : `${files.length} documents uploaded. Genie is reading them now.`
      );
      await load({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const [opening, setOpening] = useState(null);

  const view = async (filename) => {
    // Open the tab right away (inside the click) so pop-up blockers allow it, then point it at the file.
    const tab = window.open('', '_blank');
    setOpening(filename);
    try {
      const url = await adminGenieAPI.getDocumentLink(schemeId, filename);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      tab?.close();
      toast.error(err.message);
    } finally {
      setOpening(null);
    }
  };

  const remove = async (filename) => {
    if (!window.confirm(`Remove "${filename}" from ${schemeName}? Genie will stop using it.`)) return;
    setDeleting(filename);
    try {
      await adminGenieAPI.deleteDocument(schemeId, filename);
      toast.success('Document removed');
      await load({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const uploading = uploadProgress !== null;

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!uploading) upload(e.dataTransfer?.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragActive ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-purple-50/40'
        }`}
      >
        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-purple-600" />
        <p className="text-sm font-semibold text-gray-900">Drop scheme documents here</p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, TXT or CSV · up to {GENIE_MAX_DOCUMENT_MB} MB each · up to 10 at a time. Guidelines, notifications,
          FAQs and forms work best.
        </p>
        {uploading ? (
          <div className="mx-auto mt-4 max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-purple-100">
              <div className="h-full bg-purple-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-600">Uploading… {uploadProgress}%</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
          >
            <UploadCloud className="h-4 w-4" /> Choose files
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={GENIE_DOCUMENT_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {ragError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>The AI service could not be reached, so indexed documents may be missing from this list. ({ragError})</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">
            Documents <span className="font-normal text-gray-500">({documents.length})</span>
          </p>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        {loading ? (
          <DocumentRowsSkeleton />
        ) : documents.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No documents yet. Genie can only answer {schemeName} questions after you upload its documents.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <li key={doc.filename} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-purple-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(doc.sizeBytes)} · {doc.chunks ?? '—'} passages · {formatDate(doc.ingestedAt)}
                    </p>
                    {doc.status === 'failed' && doc.error && <p className="mt-0.5 text-xs text-red-600">{doc.error}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip status={doc.status} error={doc.error} />
                  {doc.hasOriginal ? (
                    <button
                      type="button"
                      onClick={() => view(doc.filename)}
                      disabled={opening === doc.filename}
                      className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                      aria-label={`View ${doc.filename}`}
                    >
                      {opening === doc.filename ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      View
                    </button>
                  ) : (
                    <span
                      className="text-xs text-gray-400"
                      title="This file was uploaded before originals were kept. Upload it again to be able to view it."
                    >
                      Original not stored
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(doc.filename)}
                    disabled={deleting === doc.filename || doc.status === 'processing'}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    aria-label={`Remove ${doc.filename}`}
                  >
                    {deleting === doc.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
