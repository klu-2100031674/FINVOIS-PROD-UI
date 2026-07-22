import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, FileUp, Loader2, Trash2, Upload } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import registry from '../../data/schemeFormsRegistry.json';
import {
  deleteSchemeDocument,
  listSchemeDocuments,
  uploadSchemeDocument,
} from '../../api/schemeDocumentsAPI';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

const AdminSchemePdfPage = () => {
  const { schemeKey } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const scheme = useMemo(
    () => registry.forms.find((form) => form.id === schemeKey),
    [schemeKey]
  );

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!schemeKey) return;
    setLoading(true);
    try {
      const result = await listSchemeDocuments(schemeKey);
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [schemeKey]);

  useEffect(() => {
    if (!scheme) {
      navigate('/admin/schemes', { replace: true });
      return;
    }
    loadDocuments();
  }, [scheme, loadDocuments, navigate]);

  const handleUpload = async (file) => {
    if (!file || !schemeKey) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadSchemeDocument(schemeKey, file);
      toast.success(result.message || 'PDF uploaded successfully');
      await loadDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (filename) => {
    if (!schemeKey || !filename) return;
    const confirmed = window.confirm(`Delete "${filename}" from ${scheme.title}?`);
    if (!confirmed) return;

    setDeletingFilename(filename);
    try {
      await deleteSchemeDocument(schemeKey, filename);
      toast.success('Document deleted');
      await loadDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Delete failed');
    } finally {
      setDeletingFilename(null);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  if (!scheme) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/admin/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Schemes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{scheme.title} — Knowledge PDFs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload guideline PDFs for RAG AI chat. Uploading the same filename replaces the existing file and re-ingests it.
            </p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <FileUp className="w-10 h-10 text-purple-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">Drop a PDF here or choose a file</p>
          <p className="text-xs text-gray-500 mt-1">PDF only, up to 25 MB</p>
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60 text-sm font-semibold"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Choose PDF'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Uploaded documents</p>
              <p className="text-xs text-gray-500 mt-0.5">{documents.length} file(s)</p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading documents…
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No PDFs uploaded yet for {scheme.title}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b border-gray-100">
                    <th className="px-4 py-3 font-semibold">Filename</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Chunks</th>
                    <th className="px-4 py-3 font-semibold">Ingested</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.filename} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{doc.filename}</td>
                      <td className="px-4 py-3 text-gray-600">{formatBytes(doc.size_bytes)}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.chunks ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(doc.ingested_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={deletingFilename === doc.filename}
                          onClick={() => handleDelete(doc.filename)}
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 disabled:opacity-60 text-sm font-semibold"
                        >
                          {deletingFilename === doc.filename ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSchemePdfPage;
