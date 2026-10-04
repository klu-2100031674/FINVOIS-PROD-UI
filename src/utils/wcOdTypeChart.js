/** Sequential Yes/No type-chart for Working capital or OD Loan → CC1–CC7. */

export const WC_OD_CC_TEMPLATE_IDS = ['frcc1', 'frcc2', 'frcc3', 'frcc4', 'frcc5', 'frcc6', 'frcc7'];

const YES_NO = new Set(['Yes', 'No']);

function yesNo(value) {
  const v = String(value || '').trim();
  return YES_NO.has(v) ? v : '';
}

export function emptyWcOdTypeChartAnswers() {
  return {
    hasWorkingCapitalLimitPresent: '',
    alsoNewTermLoanForAsset: '',
    wcLimitTopup: '',
    hasAuditedLastFy: '',
    hasProvisionalCurrentFy: '',
  };
}

export function applyWcOdChartAnswer(prev = {}, field, value) {
  const next = { ...emptyWcOdTypeChartAnswers(), ...prev, [field]: yesNo(value) };
  if (field === 'hasWorkingCapitalLimitPresent') {
    next.alsoNewTermLoanForAsset = '';
    next.wcLimitTopup = '';
    next.hasAuditedLastFy = '';
    next.hasProvisionalCurrentFy = '';
  } else if (field === 'alsoNewTermLoanForAsset') {
    next.wcLimitTopup = '';
  } else if (field === 'hasAuditedLastFy') {
    next.hasProvisionalCurrentFy = '';
  }
  return next;
}

/**
 * Returns frcc1–frcc7 when the selected branch is complete, otherwise null.
 *
 * Present WC limit Yes → new TL for asset + topup → CC7 / CC6 / CC5 / CC4
 * Present WC limit No  → audited last FY + provisional current FY → CC2 / CC3 / CC1
 */
export function resolveWcOdChartTemplate(answers = {}) {
  const hasLimit = yesNo(answers.hasWorkingCapitalLimitPresent);
  if (!hasLimit) return null;

  if (hasLimit === 'Yes') {
    const newTermLoan = yesNo(answers.alsoNewTermLoanForAsset);
    const topup = yesNo(answers.wcLimitTopup);
    if (!newTermLoan || !topup) return null;
    if (newTermLoan === 'Yes') return topup === 'Yes' ? 'frcc7' : 'frcc6';
    return topup === 'Yes' ? 'frcc5' : 'frcc4';
  }

  const audited = yesNo(answers.hasAuditedLastFy);
  const provisional = yesNo(answers.hasProvisionalCurrentFy);
  if (!audited || !provisional) return null;
  if (audited === 'Yes') return provisional === 'Yes' ? 'frcc2' : 'frcc3';
  return provisional === 'Yes' ? 'frcc3' : 'frcc1';
}

export function wcOdChartTemplateLabel(templateId) {
  const match = String(templateId || '').trim().toLowerCase().match(/^frcc([1-7])$/);
  return match ? `CC${match[1]}` : '';
}

export function isWcOdCcTemplateId(templateId) {
  return WC_OD_CC_TEMPLATE_IDS.includes(String(templateId || '').trim().toLowerCase());
}

export function serializeWcOdTypeChart(answers) {
  const suggestedTemplateId = resolveWcOdChartTemplate(answers);
  if (!suggestedTemplateId) return undefined;
  return {
    hasWorkingCapitalLimitPresent: yesNo(answers.hasWorkingCapitalLimitPresent),
    alsoNewTermLoanForAsset: yesNo(answers.alsoNewTermLoanForAsset),
    wcLimitTopup: yesNo(answers.wcLimitTopup),
    hasAuditedLastFy: yesNo(answers.hasAuditedLastFy),
    hasProvisionalCurrentFy: yesNo(answers.hasProvisionalCurrentFy),
    suggestedTemplateId,
  };
}
