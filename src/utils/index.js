/**
 * Utility Functions
 * Common helper functions for the application
 */

export { default as WizardPlugin } from './wizardPlugin';
export * from './templateMetadata';
export * from './formDataMapper';
import { getApiBaseUrl } from './env';

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Download file from URL (no auth; only works for public URLs or same-origin)
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token';

/**
 * Path for the authenticated user report download API (avoids server-built URLs with a wrong public host).
 */
export const getUserReportDownloadPath = (reportId, kind) => {
  const id = String(reportId || '').trim();
  if (!id) return null;
  const base = getApiBaseUrl();
  return kind === 'pdf'
    ? `${base}/reports/${id}/download-pdf`
    : `${base}/reports/${id}/download-excel`;
};

/**
 * Download PDF or clean Excel for the current user’s report (Bearer + same-origin or configured API base).
 */
export const downloadUserReportFile = async (report, kind) => {
  const isPdf = kind === 'pdf';
  const path = getUserReportDownloadPath(report?._id, kind);
  if (!path) {
    throw new Error('Report is missing an id for download');
  }
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include'
  });
  if (!response.ok) {
    let msg = isPdf ? 'Failed to download PDF' : 'Failed to download Excel';
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        const j = await response.json();
        if (j.error) msg = j.error;
        else if (j.message) msg = j.message;
      } catch (_) {
        /* ignore */
      }
    }
    throw new Error(msg);
  }
  const blob = await response.blob();
  const outBlob =
    isPdf && (blob.type === '' || blob.type === 'application/octet-stream')
      ? new Blob([blob], { type: 'application/pdf' })
      : blob;
  const url = window.URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = isPdf
    ? `${report?.title || 'report'}.pdf`
    : `${report?.title || 'report'}-clean.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Truncate text
 */
export const truncate = (text, length = 50) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

/**
 * Check if file is Excel
 */
export const isExcelFile = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['xlsx', 'xls'].includes(ext);
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

/**
 * Parse number from string
 */
export const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
};

/**
 * Human-readable message from API/axios/unknown errors (for toasts).
 */
export const formatApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error == null) return fallback;
  if (typeof error === 'string') return error.trim() || fallback;
  if (typeof error === 'object') {
    const msg = error.message || error.error || error.detail;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    try {
      const s = JSON.stringify(error);
      if (s && s !== '{}') return s.length > 200 ? `${s.slice(0, 200)}…` : s;
    } catch {
      /* ignore */
    }
  }
  return fallback;
};
