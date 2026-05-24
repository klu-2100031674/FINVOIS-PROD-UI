/** Statuses where the request owner may add/remove uploaded documents */
export const EDITABLE_DOC_STATUSES = ['pending', 'needs_documents', 'documents_submitted'];

export function resolveRequestOwnerId(request) {
  const ref = request?.user_id;
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return String(ref._id || ref.id || ref);
}

export function isReportHelpOwner(request, currentUser) {
  if (!request || !currentUser) return false;
  const ownerId = resolveRequestOwnerId(request);
  const viewerId = String(currentUser._id || currentUser.id || '');
  return Boolean(ownerId && viewerId && ownerId === viewerId);
}

/**
 * Client-side edit flags (matches API; used as fallback if API omits flags).
 */
export function getReportHelpDocumentEditState(request, currentUser) {
  const maxFiles = request?.maxFiles ?? 10;
  const docCount = (request?.documents || []).length;
  const owner = isReportHelpOwner(request, currentUser);
  const statusOk = EDITABLE_DOC_STATUSES.includes(request?.status);

  const canEditDocuments =
    request?.canEditDocuments === true || (owner && statusOk);
  const canAddDocuments =
    request?.canAddDocuments === true ||
    (canEditDocuments && docCount < maxFiles);

  return { canEditDocuments, canAddDocuments, maxFiles, isOwner: owner };
}
