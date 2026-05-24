import { getApiBaseUrl } from '../utils/env';
import { getTunnelRequestHeaders } from '../utils/tunnel';
import { isPublicAnonymousApiPath } from './publicApiPaths';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

function streamApiPath(apiPath) {
  const base = String(apiPath || '').replace(/\/$/, '');
  return base.endsWith('/stream') ? base : `${base}/stream`;
}

function parseSseBlock(block, handlers) {
  let event = 'message';
  const dataLines = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) return;
  let payload;
  try {
    payload = JSON.parse(dataLines.join('\n'));
  } catch (_) {
    return;
  }
  if (event === 'token' && payload?.content) {
    handlers.onToken?.(payload.content);
  } else if (event === 'status') {
    handlers.onStatus?.(payload?.phase);
  } else if (event === 'error') {
    const err = new Error(payload?.message || 'Stream failed');
    err.code = payload?.code;
    err.kbStatus = payload?.kbStatus;
    err.status = payload?.status;
    throw err;
  } else if (event === 'done') {
    handlers.onDone?.(payload);
  }
}

/**
 * POST + SSE stream for PMEGP / AP IDP AI chat.
 * @returns {Promise<void>}
 */
export async function postSchemeAiChatStream({
  apiPath,
  body,
  onToken,
  onStatus,
  onDone,
  signal,
}) {
  const path = streamApiPath(apiPath);
  const url = `${getApiBaseUrl()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...getTunnelRequestHeaders(url),
  };
  const isPublic = isPublicAnonymousApiPath(path);
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !isPublic) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    // Public scheme chat is cross-origin on finvois.com — omit cookies to avoid strict CORS.
    credentials: isPublic ? 'omit' : 'include',
    signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code;
    let kbStatus;
    try {
      const json = await res.json();
      message = json?.message || json?.error || message;
      code = json?.code;
      kbStatus = json?.kbStatus;
    } catch (_) {
      try {
        const text = await res.text();
        if (text) message = text.slice(0, 500);
      } catch (_) {
        /* ignore */
      }
    }
    const err = new Error(message);
    err.status = res.status;
    err.code = code;
    err.kbStatus = kbStatus;
    throw err;
  }

  if (!res.body) {
    throw new Error('Streaming response missing body');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      if (!part.trim() || part.trim().startsWith(':')) continue;
      parseSseBlock(part, { onToken, onStatus, onDone });
    }
  }

  if (buffer.trim() && !buffer.trim().startsWith(':')) {
    parseSseBlock(buffer, { onToken, onStatus, onDone });
  }
}

export { streamApiPath };
