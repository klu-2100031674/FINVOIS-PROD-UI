import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Paperclip, Table2, Trash2, Upload } from 'lucide-react';
import api, { apiErrorMessage } from '../../api/apiClient';
import toast from 'react-hot-toast';

const UNLOCKED = new Set(['claimed', 'assigned', 'completed']);
const MAX_FILES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function KindIcon({ kind }) {
  if (kind === 'image') return <ImageIcon size={16} className="text-blue-600" />;
  if (kind === 'excel') return <Table2 size={16} className="text-emerald-600" />;
  return <FileText size={16} className="text-purple-600" />;
}

/**
 * @param {{
 *   requestId: string,
 *   apiBase: string,
 *   status: string,
 *   currentUserId?: string,
 *   isCustomer?: boolean,
 * }} props
 */
export default function RequestDocumentsPanel({
  requestId,
  apiBase,
  status,
  currentUserId,
  isCustomer = false,
}) {
  const [docs, setDocs] = useState([]);
  const [meta, setMeta] = useState({ collaborationUnlocked: false, canMutate: false, canUploadWhileOpen: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const unlocked = UNLOCKED.has(String(status || ''));
  const canUpload = Boolean(meta.canMutate || (isCustomer && meta.canUploadWhileOpen));
  const canDelete = Boolean(meta.canMutate);

  const load = useCallback(async () => {
    if (!requestId || !apiBase) return;
    try {
      setLoading(true);
      const res = await api.get(`${apiBase}/documents`);
      setDocs(res.data?.data || []);
      setMeta(res.data?.meta || {});
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load documents'));
    } finally {
      setLoading(false);
    }
  }, [apiBase, requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (!canUpload) {
      toast.error('Document uploads unlock after a customer-service agent claims or is assigned to this request.');
      return;
    }

    const remaining = Math.max(0, (meta.maxFiles || MAX_FILES) - docs.length);
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed for this request.`);
      return;
    }
    if (files.length > remaining) {
      toast.error(`You can upload ${remaining} more file(s) (max ${MAX_FILES} total).`);
      return;
    }

    const maxBytes = meta.maxFileBytes || MAX_FILE_BYTES;
    const tooBig = files.find((f) => f.size > maxBytes);
    if (tooBig) {
      toast.error(`"${tooBig.name}" exceeds 5 MB`);
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      setUploading(true);
      await api.post(`${apiBase}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(files.length === 1 ? 'Document uploaded' : `${files.length} documents uploaded`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (doc) => {
    if (!canDelete) {
      toast.error('Document edits unlock after a customer-service agent claims or is assigned to this request.');
      return;
    }
    const isOwn = String(doc.uploadedBy) === String(currentUserId);
    if (isCustomer && !isOwn) {
      toast.error('You can only delete documents you uploaded.');
      return;
    }
    if (!window.confirm(`Delete "${doc.fileName}"?`)) return;
    try {
      await api.delete(`${apiBase}/documents/${doc.id}`);
      toast.success('Document deleted');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Delete failed'));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Paperclip size={18} className="text-purple-700" />
          Documents
          <span className="text-xs font-medium text-gray-500">
            ({docs.length}/{MAX_FILES}, max 5 MB each)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,application/pdf,image/*,.csv"
            className="hidden"
            onChange={onUpload}
          />
          <button
            type="button"
            disabled={!canUpload || uploading}
            onClick={() => fileRef.current?.click()}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              canUpload && !uploading
                ? 'bg-purple-700 text-white hover:bg-purple-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {!unlocked && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          Documents and chat unlock after a customer-service agent claims or is assigned to this request.
          {isCustomer ? ' You can still attach files when submitting the form.' : ''}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => {
            const isOwn = String(doc.uploadedBy) === String(currentUserId);
            const showDelete = canDelete && (!isCustomer || isOwn);
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <KindIcon kind={doc.kind} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {doc.uploaderRole?.replace('_', ' ')}
                      {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline"
                    >
                      <Download size={12} /> Open
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={!showDelete}
                    onClick={() => onDelete(doc)}
                    className={`p-1.5 rounded ${
                      showDelete
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={showDelete ? 'Delete' : 'Delete locked'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
