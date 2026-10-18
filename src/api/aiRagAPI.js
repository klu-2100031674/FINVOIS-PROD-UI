import axios from 'axios';

/**
 * Scheme AI RAG service (Finvois-Rag, FastAPI).
 * Separate service from the main backend, so it uses its own axios instance:
 * no app Bearer token, no 401 → /auth redirect. Override with VITE_RAG_API_BASE_URL.
 */
const RAG_API_BASE_URL = (
  import.meta.env.VITE_RAG_API_BASE_URL ||
  'https://finvois.centralindia.cloudapp.azure.com/ai-rag'
).replace(/\/$/, '');

// Must match QueryRequest.question max_length in the RAG service.
export const RAG_QUESTION_MAX_LENGTH = 1000;
// Must match DocumentProcessor.SUPPORTED_EXTENSIONS in the RAG service.
export const RAG_SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.csv'];

/**
 * One Qdrant collection per scheme. Names match the API's default
 * (getSchemeCollection in src/services/ragClient.js), so chat reads what admins upload here.
 */
export const RAG_SCHEME_COLLECTIONS = [
  { key: 'pmegp', label: 'PMEGP' },
  { key: 'cmep', label: 'CMEP' },
  { key: 'ap-idp', label: 'AP IDP 4.0' },
];

const ragClient = axios.create({
  baseURL: RAG_API_BASE_URL,
  timeout: 120000,
});

/** Pulls a readable message from RAG errors ({detail}, FastAPI 422 list, or {error, message}). */
export function getRagErrorMessage(err, fallback = 'AI service request failed') {
  const data = err?.response?.data;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (Array.isArray(data?.detail)) {
    const msg = data.detail.map((item) => item?.msg).filter(Boolean).join('; ');
    if (msg) return msg;
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (!err?.response && err?.message) return 'AI service is unreachable. Please try again.';
  return fallback;
}

export async function getRagHealth() {
  const response = await ragClient.get('/health');
  return response.data; // { status, timestamp, version }
}

export async function getRagReadiness() {
  const response = await ragClient.get('/health/ready');
  return response.data; // { status, qdrant_connected, collection_info }
}

export async function getRagCollectionInfo(collectionName) {
  const response = await ragClient.get('/documents/info', {
    params: { collection_name: collectionName },
  });
  return response.data; // { collection_name, total_documents, status }
}

export async function uploadRagDocument(file, collectionName, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('collection_name', collectionName);
  const response = await ragClient.post('/documents/upload', formData, {
    timeout: 600000,
    onUploadProgress,
  });
  return response.data; // { message, filename, collection_name, chunks_created, document_ids }
}

/** Deletes every document in one scheme's collection (DELETE /documents/collections/{name}). */
export async function deleteRagCollection(collectionName) {
  const response = await ragClient.delete(
    `/documents/collections/${encodeURIComponent(collectionName)}`
  );
  return response.data; // { message }
}

export async function queryRag(question, { includeSources = true, collectionName } = {}) {
  const response = await ragClient.post('/query', {
    question,
    collection_name: collectionName,
    include_sources: includeSources,
    enable_evaluation: false,
  });
  return response.data; // { question, answer, sources, processing_time_ms, evaluation }
}

export async function searchRagDocuments(question, collectionName) {
  const response = await ragClient.post('/query/search', {
    question,
    collection_name: collectionName,
  });
  return response.data; // { query, collection, results: [{ content, metadata, relevance_score }], count }
}

/**
 * Streams a plain-text answer from POST /query/stream.
 * Uses fetch (axios cannot stream in the browser). Calls onChunk(text) per chunk.
 */
export async function streamRagQuery(question, onChunk, signal, collectionName) {
  let response;
  try {
    response = await fetch(`${RAG_API_BASE_URL}/query/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, collection_name: collectionName }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('AI service is unreachable. Please try again.');
  }

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(getRagErrorMessage({ response: { data } }, 'Failed to get an answer'));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
