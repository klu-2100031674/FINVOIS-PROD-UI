/** Whether the user submits report help to a channel partner (has referral). */
export function isReferredForReportHelp(user) {
  if (!user) return false;
  const agentRef = user.agent_id || user.referring_agent;
  if (!agentRef) return false;
  if (typeof agentRef === 'object') return Boolean(agentRef._id || agentRef.id);
  return Boolean(agentRef);
}

export function getReportHelpNavLabel(user) {
  return isReferredForReportHelp(user) ? 'Partner requests' : 'Report help';
}

export function getReportHelpListHero(user) {
  if (isReferredForReportHelp(user)) {
    return {
      title: 'Partner requests',
      subtitle:
        'Track structured report requests with your channel partner — status, documents, and updates in one place.',
    };
  }
  return {
    title: 'Report help',
    subtitle:
      'Track structured report requests with Finvois support — status, documents, and updates in one place.',
  };
}

export function getSupportPartyName(request) {
  if (request?.routing === 'platform' || request?.handlerLabel) {
    return request.handlerLabel || 'Finvois support team';
  }
  const partner = request?.agent_id;
  if (partner && typeof partner === 'object') {
    return partner.name || 'Channel partner';
  }
  return 'Channel partner';
}
