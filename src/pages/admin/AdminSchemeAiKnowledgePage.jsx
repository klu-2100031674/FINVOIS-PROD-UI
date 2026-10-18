import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Square,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import SchemeAiChatMarkdown from '../../components/schemeFinder/SchemeAiChatMarkdown';
import {
  RAG_QUESTION_MAX_LENGTH,
  RAG_SCHEME_COLLECTIONS,
  RAG_SUPPORTED_EXTENSIONS,
  deleteRagCollection,
  getRagCollectionInfo,
  getRagErrorMessage,
  getRagHealth,
  getRagReadiness,
  queryRag,
  searchRagDocuments,
  streamRagQuery,
  uploadRagDocument,
} from '../../api/aiRagAPI';

/** Source file + page label from RAG chunk metadata (page is 0-based in PDF loaders). */
function formatSource(metadata = {}) {
  const name = metadata.source || 'Unknown document';
  const page = metadata.page_label || (Number.isInteger(metadata.page) ? metadata.page + 1 : null);
  return page ? `${name} · page ${page}` : name;
}

const StatusPill = ({ ok, loading, okLabel, badLabel }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking…
      </span>
    );
  }
  return ok ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
      <CheckCircle2 className="w-4 h-4" /> {okLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
      <XCircle className="w-4 h-4" /> {badLabel}
    </span>
  );
};

const SourceList = ({ items, showScore = false }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li key={item.metadata?._id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <p className="text-xs font-semibold text-gray-800 inline-flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">{formatSource(item.metadata)}</span>
          </p>
          {showScore && typeof item.relevance_score === 'number' && (
            <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded shrink-0">
              {Math.round(item.relevance_score * 100)}% match
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-6">{item.content}</p>
      </li>
    ))}
  </ul>
);

const AdminSchemeAiKnowledgePage = () => {
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  // Scheme whose collection is being managed / queried
  const [collectionName, setCollectionName] = useState(RAG_SCHEME_COLLECTIONS[0].key);
  const schemeLabel =
    RAG_SCHEME_COLLECTIONS.find((scheme) => scheme.key === collectionName)?.label || collectionName;

  // Service status
  const [statusLoading, setStatusLoading] = useState(true);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [collectionInfo, setCollectionInfo] = useState(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Ask / search
  const [mode, setMode] = useState('ask');
  const [question, setQuestion] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerSources, setAnswerSources] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [askError, setAskError] = useState('');

  const [clearing, setClearing] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    const [health, ready, info] = await Promise.allSettled([
      getRagHealth(),
      getRagReadiness(),
      getRagCollectionInfo(collectionName),
    ]);
    setIsHealthy(health.status === 'fulfilled' && health.value?.status === 'healthy');
    setIsReady(ready.status === 'fulfilled' && ready.value?.status === 'ready');
    setCollectionInfo(info.status === 'fulfilled' ? info.value : null);
    setStatusLoading(false);
  }, [collectionName]);

  useEffect(() => {
    loadStatus();
    return () => abortRef.current?.abort();
  }, [loadStatus]);

  const handleUpload = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!RAG_SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      toast.error('Only PDF, TXT or CSV files are allowed');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    try {
      const result = await uploadRagDocument(file, collectionName, (event) => {
        if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      setUploadResult(result);
      toast.success(result.message || 'Document uploaded successfully');
      await loadStatus();
    } catch (err) {
      toast.error(getRagErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !uploading) handleUpload(file);
  };

  const resetResults = () => {
    setAnswer('');
    setAnswerSources(null);
    setSearchResults(null);
    setAskError('');
  };

  const handleSchemeChange = (key) => {
    if (key === collectionName) return;
    abortRef.current?.abort();
    resetResults();
    setUploadResult(null);
    setCollectionName(key);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setAskError('Please enter a question.');
      return;
    }
    if (trimmed.length > RAG_QUESTION_MAX_LENGTH) {
      setAskError(`Question is too long (max ${RAG_QUESTION_MAX_LENGTH} characters).`);
      return;
    }

    resetResults();
    setAsking(true);
    try {
      if (mode === 'search') {
        setSearchResults(await searchRagDocuments(trimmed, collectionName));
      } else if (showSources) {
        const result = await queryRag(trimmed, { includeSources: true, collectionName });
        setAnswer(result.answer || '');
        setAnswerSources(result.sources || []);
      } else {
        abortRef.current = new AbortController();
        await streamRagQuery(
          trimmed,
          (chunk) => setAnswer((prev) => prev + chunk),
          abortRef.current.signal,
          collectionName
        );
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setAskError(err?.response ? getRagErrorMessage(err) : err.message || 'Something went wrong');
      }
    } finally {
      abortRef.current = null;
      setAsking(false);
    }
  };

  const handleClearCollection = async () => {
    const confirmed = window.confirm(
      `Delete ALL ${schemeLabel} documents from the scheme AI knowledge base? The ${schemeLabel} AI will not be able to answer until documents are uploaded again. This cannot be undone.`
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      const result = await deleteRagCollection(collectionName);
      toast.success(result.message || 'Knowledge base cleared');
      setUploadResult(null);
      await loadStatus();
    } catch (err) {
      toast.error(getRagErrorMessage(err, 'Failed to clear knowledge base'));
    } finally {
      setClearing(false);
    }
  };

  const totalChunks = collectionInfo?.total_documents ?? 0;
  const isEmpty = !statusLoading && collectionInfo && totalChunks === 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/admin/schemes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schemes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage the documents the scheme AI answers from, and test its answers.
          </p>
          <div className="mt-4 inline-flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg" role="group" aria-label="Scheme">
            {RAG_SCHEME_COLLECTIONS.map((scheme) => (
              <button
                key={scheme.key}
                type="button"
                aria-pressed={collectionName === scheme.key}
                disabled={uploading || clearing}
                onClick={() => handleSchemeChange(scheme.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition disabled:opacity-60 ${
                  collectionName === scheme.key
                    ? 'bg-white text-purple-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {scheme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-800">Service status</p>
            <button
              type="button"
              onClick={loadStatus}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <div className="px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">AI service</p>
              <StatusPill ok={isHealthy} loading={statusLoading} okLabel="Online" badLabel="Offline" />
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Knowledge base</p>
              <StatusPill ok={isReady} loading={statusLoading} okLabel="Ready" badLabel="Not ready" />
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Indexed passages ({schemeLabel})</p>
              {statusLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {collectionInfo ? totalChunks.toLocaleString() : '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload */}
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
          <p className="text-sm font-medium text-gray-900">Drop a document here or choose a file</p>
          <p className="text-xs text-gray-500 mt-1">PDF, TXT or CSV</p>

          {uploading ? (
            <div className="mt-4 max-w-sm mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2 inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Processing document…'}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={RAG_SUPPORTED_EXTENSIONS.join(',')}
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 text-sm font-semibold"
              >
                <Upload className="w-4 h-4" />
                Choose file
              </button>
            </div>
          )}

          {uploadResult && !uploading && (
            <div className="mt-4 max-w-md mx-auto text-left bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-green-800 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {uploadResult.filename}
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Added {uploadResult.chunks_created} passage(s) to the {schemeLabel} knowledge base.
              </p>
            </div>
          )}
        </div>

        {/* Ask / search */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 pt-3 border-b border-gray-100 bg-gray-50 flex gap-4">
            {[
              { key: 'ask', label: 'Ask AI', icon: MessageSquare },
              { key: 'search', label: 'Search documents', icon: Search },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                disabled={asking}
                onClick={() => {
                  setMode(key);
                  resetResults();
                }}
                className={`inline-flex items-center gap-1.5 pb-2.5 text-sm font-semibold border-b-2 transition disabled:opacity-60 ${
                  mode === key
                    ? 'border-purple-700 text-purple-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (askError) setAskError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!asking) e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={3}
              maxLength={RAG_QUESTION_MAX_LENGTH}
              placeholder={
                mode === 'ask'
                  ? 'e.g. What is the subsidy for PMEGP in rural areas?'
                  : 'e.g. PMEGP eligibility criteria'
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {mode === 'ask' ? (
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showSources}
                    disabled={asking}
                    onChange={(e) => setShowSources(e.target.checked)}
                    className="rounded border-gray-300 text-purple-700 focus:ring-purple-300"
                  />
                  Show source passages
                </label>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {question.length}/{RAG_QUESTION_MAX_LENGTH}
                </span>
                {asking && mode === 'ask' && !showSources ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={asking || !question.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60 text-sm font-semibold"
                  >
                    {asking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : mode === 'ask' ? (
                      <Send className="w-4 h-4" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {mode === 'ask' ? 'Ask' : 'Search'}
                  </button>
                )}
              </div>
            </div>
            {askError && <p className="text-sm text-red-600">{askError}</p>}
            {isEmpty && (
              <p className="text-xs text-amber-700">
                The {schemeLabel} knowledge base is empty — upload documents first for useful answers.
              </p>
            )}
          </form>

          {/* Results */}
          {mode === 'ask' && (answer || (asking && !answer)) && (
            <div className="border-t border-gray-100 p-4 space-y-4">
              {answer ? (
                <SchemeAiChatMarkdown text={answer} />
              ) : (
                <p className="text-sm text-gray-500 inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                </p>
              )}
              {answerSources && answerSources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Sources
                  </p>
                  <SourceList items={answerSources} />
                </div>
              )}
            </div>
          )}

          {mode === 'search' && searchResults && (
            <div className="border-t border-gray-100 p-4">
              {searchResults.count === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No matching passages found.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">{searchResults.count} matching passage(s)</p>
                  <SourceList items={searchResults.results} showScore />
                </>
              )}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Clear {schemeLabel} knowledge base
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Removes every uploaded {schemeLabel} document from the scheme AI. Other schemes are not affected. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCollection}
            disabled={clearing || statusLoading || isEmpty}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-60 text-sm font-semibold"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear all
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSchemeAiKnowledgePage;
