/**
 * Pages Export
 * Centralized export for all pages
 */

export { default as AuthPage } from './AuthPage';
export { default as DashboardPage } from './DashboardPage';
export { default as ExecutiveDashboardPage } from './Executive/ExecutiveDashboardPage';
export { default as ExecutiveSbiHousePage } from './Executive/ExecutiveSbiHousePage';
export { default as ExecutiveSbiOfficePage } from './Executive/ExecutiveSbiOfficePage';
export { default as ExecutiveSbiBussinessPage } from './Executive/ExecutiveSbiBussinessPage';
export { default as ExecutiveIncomeTaxPage } from './Executive/ExecutiveIncomeTaxPage';
export { default as ExecutiveReportsPage } from './Executive/ExecutiveReportsPage';
export { default as ExecutiveDraftsPage } from './Executive/ExecutiveDraftsPage';
export { default as DraftsPage } from './DraftsPage';
export { default as GeneratePage } from './GeneratePage';
export { default as ReportsPage } from './ReportsPage';
export { default as Stage1Page } from './Stage1Page';
export { default as Stage2Page } from './Stage2Page';
export { default as Stage3Page } from './Stage3Page';
export { default as FinalWorkingsPage } from './FinalWorkingsPage';
export { default as APITestPage } from './APITestPage';
export { default as FRCC1FormPage } from './FRCC1FormPage';
export { default as ProfilePage } from './ProfilePage';
export { default as AdminPage } from './AdminPage';
export { default as AdminPaymentsPage } from './AdminPaymentsPage';
export { default as FRTermLoanFormPage } from './FRTermLoanFormPage';
export { default as FRTermLoanWithStockFormPage } from './FRTermLoanWithStockFormPage';

// Auth Flow Pages
export { default as ForgotPasswordPage } from './ForgotPasswordPage';
export { default as OTPVerificationPage } from './OTPVerificationPage';
export { default as ResetPasswordPage } from './ResetPasswordPage';

// Payment Pages
export { default as BuyCreditsPage } from './BuyCreditsPage';
export { default as PaymentSuccessPage } from './PaymentSuccessPage';
export { default as PaymentFailurePage } from './PaymentFailurePage';
export { default as OrderHistoryPage } from './OrderHistoryPage';

// PMEGP Pages
export { default as PmegpGeneratePage } from './scheme/pmegp/PmegpGeneratePage';
export { default as PmegpSchemeMailPage } from './scheme/pmegp/PmegpSchemeMailPage';
export { default as PublicPmegpSchemeMailPage } from './scheme/pmegp/PublicPmegpSchemeMailPage';
export { default as PublicPmegpFormPage } from './scheme/pmegp/PublicPmegpFormPage';
export { default as PublicPmegpAiChatPage } from './scheme/pmegp/PublicPmegpAiChatPage';

// CMEP Pages
export { default as CmepGeneratePage } from './scheme/cmep/CmepGeneratePage';
export { default as CmepSchemeMailPage } from './scheme/cmep/CmepSchemeMailPage';
export { default as PublicCmepSchemeMailPage } from './scheme/cmep/PublicCmepSchemeMailPage';
export { default as PublicCmepFormPage } from './scheme/cmep/PublicCmepFormPage';
export { default as PublicCmepAiChatPage } from './scheme/cmep/PublicCmepAiChatPage';

// AP IDP Pages
export { default as ApIdpGeneratePage } from './scheme/apIdp/ApIdpGeneratePage';
export { default as ApIdpSchemeMailPage } from './scheme/apIdp/ApIdpSchemeMailPage';
export { default as PublicApIdpFormPage } from './scheme/apIdp/PublicApIdpFormPage';
export { default as PublicApIdpSchemeMailPage } from './scheme/apIdp/PublicApIdpSchemeMailPage';
export { default as PublicApIdpAiChatPage } from './scheme/apIdp/PublicApIdpAiChatPage';

// Client screening (standalone — not a scheme form)
export { default as PublicClientScreeningPage } from './clientScreening/PublicClientScreeningPage';
export { default as PublicFormPage } from './PublicFormPage';
