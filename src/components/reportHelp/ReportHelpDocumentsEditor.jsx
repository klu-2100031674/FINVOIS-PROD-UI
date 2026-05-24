import React, { useRef, useState } from 'react';
import {
  DocumentArrowDownIcon,
  TrashIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { reportHelpAPI } from '../../api/endpoints';
import { ACCEPTED_FILE_HINT } from '../../utils/reportHelpConstants';
import { ReportHelpCard } from './ReportHelpUi';

/**
 * View, remove, and add user-uploaded documents on an editable report-help request.
 */
export default function ReportHelpDocumentsEditor({
  requestId,
  documents = [],
  canEditDocuments = false,
  canAddDocuments = false,
  maxFiles = 10,
  onChanged,
  accent = 'purple',
}) {
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);
  const addInputRef = useRef(null);
  const changeInputRef = useRef(null);
  const changeTargetIdRef = useRef(null);

  const btn =
    accent === 'green'
      ? {
          link: 'text-emerald-600 hover:text-emerald-800',
          primary: 'bg-emerald-600 hover:bg-emerald-700',
          border: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700',
          drop: 'hover:border-emerald-400 hover:bg-emerald-50/40',
          icon: 'text-emerald-600 bg-emerald-100',
        }
      : {
          link: 'text-[#7e22ce] hover:text-[#6b21a8]',
          primary: 'bg-[#7e22ce] hover:bg-[#6b21a8]',
          border: 'border-purple-200 hover:bg-purple-50 text-[#7e22ce]',
          drop: 'hover:border-[#7e22ce] hover:bg-purple-50/40',
          icon: 'text-[#7e22ce] bg-purple-100',
        };

  const handleDelete = async (doc) => {
    const docId = String(doc._id || doc.id || '');
    if (!docId) {
      toast.error('Cannot remove this file — refresh the page and try again');
      return;
    }
    if (!window.confirm(`Remove "${doc.file_name}"?`)) return;

    setBusyId(docId);
    try {
      const res = await reportHelpAPI.deleteDocument(requestId, docId);
      toast.success('Document removed');
      onChanged?.(res?.data?.request);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to remove document');
    } finally {
      setBusyId(null);
    }
  };

  const openChangeFile = (docId) => {
    changeTargetIdRef.current = docId;
    changeInputRef.current?.click();
  };

  const handleChangeFile = async (e) => {
    const file = e.target.files?.[0];
    const docId = changeTargetIdRef.current;
    e.target.value = '';
    changeTargetIdRef.current = null;
    if (!file || !docId) return;

    setBusyId(docId);
    try {
      const res = await reportHelpAPI.replaceDocument(requestId, docId, file);
      toast.success('File updated');
      onChanged?.(res?.data?.request);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to change file');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;

    const remaining = maxFiles - documents.length;
    if (picked.length > remaining) {
      toast.error(`You can add at most ${remaining} more file(s)`);
      return;
    }

    const fd = new FormData();
    picked.forEach((f) => fd.append('files', f));

    setAdding(true);
    try {
      const res = await reportHelpAPI.uploadDocuments(requestId, fd);
      toast.success(picked.length === 1 ? 'Document added' : 'Documents added');
      onChanged?.(res?.data?.request);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add documents');
    } finally {
      setAdding(false);
    }
  };

  const showSection = canEditDocuments || canAddDocuments || documents.length > 0;
  if (!showSection) {
    return null;
  }

  const docIdStr = (doc) => String(doc._id || doc.id || '');

  return (
    <ReportHelpCard>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Your documents</h2>
        {canEditDocuments && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {documents.length} / {maxFiles} files
          </span>
        )}
      </div>

      {canEditDocuments && (
        <p className="text-sm text-gray-500 mb-5 mt-2 leading-relaxed">
          Each file can be replaced or removed, or you can add more. {ACCEPTED_FILE_HINT}
        </p>
      )}

      <input
        ref={changeInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,image/*,application/pdf"
        onChange={handleChangeFile}
      />
      <input
        ref={addInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,image/*,application/pdf"
        onChange={handleAddFiles}
      />

      {documents.length === 0 && canAddDocuments ? (
        <button
          type="button"
          disabled={adding}
          onClick={() => addInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-10 bg-gray-50/50 transition-all disabled:opacity-50 ${btn.drop}`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 ${btn.icon}`}>
            <CloudArrowUpIcon className="w-6 h-6" aria-hidden />
          </div>
          <span className="text-sm font-semibold text-gray-800">Add documents</span>
          <span className="text-xs text-gray-500 mt-1">PDF, images, Excel — up to {maxFiles} files</span>
        </button>
      ) : (
        <>
          <ul className="space-y-2">
            {documents.map((doc, i) => {
              const docId = docIdStr(doc);
              const isBusy = busyId === docId;
              const editable = canEditDocuments && doc.uploaded_by !== 'agent';

              return (
                <li
                  key={docId || i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm bg-gray-50/80 rounded-xl px-4 py-3.5 border border-gray-100"
                >
                  <span className="flex items-center gap-2 min-w-0 font-medium text-gray-800">
                    <DocumentIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                    <span className="truncate">
                      {doc.file_name}
                      {doc.batch === 'supplemental' && (
                        <span className="ml-2 text-xs font-normal text-blue-600">(supplemental)</span>
                      )}
                    </span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {doc.signed_url && (
                      <a
                        href={doc.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 ${btn.link}`}
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" aria-hidden />
                        View
                      </a>
                    )}
                    {editable && docId && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => openChangeFile(docId)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white disabled:opacity-50 ${btn.border}`}
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" aria-hidden />
                          {isBusy ? 'Updating…' : 'Change file'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete({ ...doc, _id: docId })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 disabled:opacity-50"
                        >
                          <TrashIcon className="w-3.5 h-3.5" aria-hidden />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {canAddDocuments && (
            <button
              type="button"
              disabled={adding}
              onClick={() => addInputRef.current?.click()}
              className={`mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 shadow-sm ${btn.primary}`}
            >
              <PlusIcon className="w-4 h-4" aria-hidden />
              {adding ? 'Uploading…' : 'Add more documents'}
            </button>
          )}
        </>
      )}
    </ReportHelpCard>
  );
}
