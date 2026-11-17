/** When a non-admin report list may show View, PDF, or Excel. */

function paymentRecord(report) {
  return report?.payment && typeof report.payment === 'object' ? report.payment : {};
}

export function isReportPaid(report) {
  const payment = paymentRecord(report);
  const status = payment.status || report?.payment_status;
  return status === 'completed' || payment.is_free_credit === true || payment.is_beta_free === true;
}

function fileIsSaved(report, kind) {
  if (kind === 'pdf') return Boolean(report?.pdf_file_url || report?.has_pdf_file);
  if (kind === 'excel') return Boolean(report?.excel_file_url || report?.has_excel_file);
  if (kind === 'json') return Boolean(report?.json_file_url);
  return false;
}

function paymentOf(source) {
  if (source?.reportId?.payment && typeof source.reportId.payment === 'object') return source.reportId.payment;
  return paymentRecord(source);
}

/** Customer Service reports stay unpaid at ₹0 until an admin types the amount. */
export function isPayableAmountReady(source) {
  const payment = paymentOf(source);
  if (payment.status === 'completed') return false;
  const amount = Number(payment.amount || 0);
  if (payment.collect_on_download === true) {
    return Boolean(payment.amount_set_at) && amount > 0;
  }
  return amount > 0;
}

export function shareablePaymentLink(source) {
  const payment = paymentOf(source);
  return payment.payment_link_url || source?.payment_link_url || '';
}

/** Razorpay payment links are created only after the PDF file exists. */
export function reportHasGeneratedPdf(source) {
  const report = source?.reportId && typeof source.reportId === 'object' ? source.reportId : source;
  return Boolean(report?.pdf_file_url || report?.has_pdf_file);
}

export function canCreateOrSharePaymentLink(source) {
  return isPayableAmountReady(source) && reportHasGeneratedPdf(source);
}

/** Paid, approved, and that file is saved. */
export function canShowReportFileButton(report, kind) {
  if (!report || report.validation_status !== 'approved') return false;
  if (!isReportPaid(report)) return false;
  return fileIsSaved(report, kind);
}

/** Pay only after an admin has approved the report and typed the amount, and the PDF exists. */
export function canShowChannelPartnerPayDownload(report) {
  const payLater = report?.payment?.collect_on_download === true;
  const unpaid = payLater && report?.payment?.status !== 'completed';
  const fileReady = Boolean(report?.pdf_file_url || report?.has_pdf_file);
  return Boolean(
    unpaid &&
    report?.validation_status === 'approved' &&
    report?.payment?.amount_set_at &&
    fileReady
  );
}
