/**
 * User-facing errors for PMEGP / AP IDP AI chat (deployed environments).
 */
export function formatSchemeChatError(err, fallback = 'Failed to get AI response') {
  if (typeof err === 'string' && err.trim()) return err;

  const code = err?.code;
  const message = err?.message || err?.response?.data?.message;

  if (code === 'PMEGP_KB_NOT_READY' || code === 'AP_IDP_KB_NOT_READY') {
    const status = err?.kbStatus || 'not ready';
    if (status === 'processing') {
      return 'The scheme knowledge base is still being processed. Please try again in a few minutes.';
    }
    if (status === 'failed') {
      return message || 'The scheme PDF failed to process. Please ask an admin to re-upload the PDF.';
    }
    return 'The scheme knowledge base is not available yet. Please ask an admin to upload the official PDF.';
  }

  if (message?.includes('GROK_API_KEY') || message?.includes('XAI_API_KEY')) {
    return 'AI service is temporarily unavailable. Please try again later.';
  }

  return message || fallback;
}
