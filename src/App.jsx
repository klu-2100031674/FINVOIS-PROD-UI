/**
 * Main App Component
 * Routing and Protected Routes
 */


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "./hooks";
import { GoogleReferralPromptModal } from "./components/common";
import {
  AuthPage,
  DashboardPage,
  DraftsPage,
  GeneratePage,
  // PMEGP
  PmegpGeneratePage,
  PmegpSchemeMailPage,
  PublicPmegpSchemeMailPage,
  PublicPmegpFormPage,
  PublicPmegpAiChatPage,
  CmepGeneratePage,
  CmepSchemeMailPage,
  PublicCmepSchemeMailPage,
  PublicCmepFormPage,
  PublicCmepAiChatPage,
  // AP IDP
  ApIdpGeneratePage,
  ApIdpSchemeMailPage,
  PublicApIdpFormPage,
  PublicApIdpSchemeMailPage,
  PublicApIdpAiChatPage,
  ReportsPage,
  Stage1Page,
  Stage2Page,
  Stage3Page,
  FRCC1FormPage,
  ProfilePage,
  AdminPage,
  AdminPaymentsPage,
  PublicClientScreeningPage,
  TheoryPagesHubPage,
  TheoryGeneratePage,
} from "./pages";
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminUserApprovalsPage,
  AdminReportHelpPage,
  AdminReportHelpDetailPage,
  AdminPricingPage,
  AdminWithdrawalsPage,
  AdminTemplateConfigPage,
  AdminReportsPage,
  AdminBankerReportsPage,
  AdminMasterDataPage,
  AdminProfilePage,
  AdminGenerateReportPage,
  AdminFreeCreditsPage,
  AdminPromotionalEmailsPage,
  AdminCompaniesPage,
  AdminCreateCompanyPage,
  AdminCompanyCreatePage,
  AdminServicesPage,
  AdminServiceNewPage,
  AdminServiceCreatePage,
  AdminServiceEditPage,
  AdminLeadsPage,
  AdminLeadRegisterPage,
  AdminLeadEditPage,
  AdminSchemesPage,
  AdminSchemePdfPage,
  SchemeMailManagePage,
  AdminFranchisesPage,
  AdminFranchiseNewPage,
  AdminFranchiseEditPage,
  AdminFranchiseApplicationsPage,
  ClientScreeningMailPage,
  AdminMsmeDprDashboardPage,
  AdminMepmaDprDashboardPage,
  AdminDprRequestDashboardPage,
  AdminCustomerSupportPage,
  AdminGovtFormsPage,
  // AdminGlobalSearchPage,
  AdminDepartmentDashboardPage,
} from "./pages/admin";
import DepartmentDashboardPage from "./pages/department/DepartmentDashboardPage";
import OpenRequestsPage from "./pages/customerService/OpenRequestsPage";
import ClaimedRequestsPage from "./pages/customerService/ClaimedRequestsPage";
import AssignedRequestsPage from "./pages/customerService/AssignedRequestsPage";
import DepartmentRequestsPage from "./pages/customerService/DepartmentRequestsPage";
import RequestHistoryPage from "./pages/customerService/RequestHistoryPage";
import CustomerServiceRequestScreen from "./pages/customerService/CustomerServiceRequestScreen";
import CustomerServiceMsmeLeadsPage from "./pages/customerService/CustomerServiceMsmeLeadsPage";
import PublicFormPage from "./pages/PublicFormPage";
import CustomerLoginPage from "./customer/CustomerLoginPage";
import CustomerDashboardPage from "./customer/CustomerDashboardPage";
import CustomerProfilePage from "./customer/CustomerProfilePage";
import CustomerDepartmentRequestsPage from "./customer/CustomerDepartmentRequestsPage";
import CustomerDepartmentRequestDetailPage from "./customer/CustomerDepartmentRequestDetailPage";
import {
  AgentDashboardPage,
  AgentReferralsPage,
  AgentReferralUserReportsPage,
  AgentReferralLinkPage,
  AgentCommissionsPage,
  AgentWithdrawalsPage,
  AgentProfilePage,
  AgentGeneratePage,
} from "./pages/agent";
import ReportHelpNewPage from "./pages/reportHelp/ReportHelpNewPage";
import ReportHelpListPage from "./pages/reportHelp/ReportHelpListPage";
import ReportHelpDetailPage from "./pages/reportHelp/ReportHelpDetailPage";
import AgentReportHelpPage from "./pages/agent/AgentReportHelpPage";
import AgentReportHelpDetailPage from "./pages/agent/AgentReportHelpDetailPage";
import { AgentLayout } from "./components/layouts";
import CompanyAdminDashboardPage from "./pages/company/CompanyAdminDashboardPage";
import CompanyManageCreditsPage from "./pages/company/CompanyManageCreditsPage";
import CompanyAdminProfilePage from "./pages/company/CompanyAdminProfilePage";
import CompanyAdminReportsPage from "./pages/company/CompanyAdminReportsPage";
import {
  ApprovalRightsReportsPage,
  ApprovalRightsBankerReportsPage,
} from "./pages/approved";
import { hasApprovalRights } from "./utils/approvalRights";
import CompanyAdminGeneratePage from "./pages/company/CompanyAdminGeneratePage";
import CompanyUsersPage from "./pages/company/CompanyUsersPage";
import CompanyUserReportsByPersonPage from "./pages/company/CompanyUserReportsByPersonPage";
import CompanyUserDashboardPage from "./pages/company/user/CompanyUserDashboardPage";
import CompanyUserProfilePage from "./pages/company/user/CompanyUserProfilePage";
import SimpleRoleProfilePage from "./pages/SimpleRoleProfilePage";
import {
  SbiDashboardPage,
  SbiReportsPage,
  SbiDraftsPage,
  SbiProfilePage,
  SbiHousePage,
  SbiOfficePage,
  SbiBusinessPage,
  SbiIncomeTaxPage,
} from "./pages/Executive/sbi";
import {
  BoiDashboardPage,
  BoiReportsPage,
  BoiDraftsPage,
  BoiProfilePage,
  BoiClassicPage,
  BoiHousingPage,
  BoiMsmePage,
  BoiHomeLoan1Page,
  BoiHomeLoan2Page,
  BoiHomeLoan3Page,
  BoiHomeLoan3GuarantorPage,
  BoiHomeLoan4Page,
} from "./pages/Executive/boi";
import CompanyUserGeneratePage from "./pages/company/user/CompanyUserGeneratePage";
import CompanyUserReportsPage from "./pages/company/user/CompanyUserReportsPage";
import GoldLoanFormPage from "./pages/GoldLoanFormPage";
import FRCC2FormPage from "./pages/FRCC2FormPage";
import FRCC3FormPage from "./pages/FRCC3FormPage";
import FRCC4FormPage from "./pages/FRCC4FormPage";
import FRCC5FormPage from "./pages/FRCC5FormPage";
import FRCC6FormPage from "./pages/FRCC6FormPage";
import FRCC7FormPage from "./pages/FRCC7FormPage";
import FRTermLoanFormPage from "./pages/FRTermLoanFormPage";
import FRTermLoanWithStockFormPage from "./pages/FRTermLoanWithStockFormPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForceChangePasswordPage from "./pages/ForceChangePasswordPage";
import FRTermLoanCCFormPage from "./pages/FRTermLoanCCFormPage";
import APITestPage from "./pages/APITestPage";
import ReportReadyPage from "./pages/ReportReadyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OTPVerificationPage from "./pages/OTPVerificationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
// Lead pages
import LeadLoginPage from "./pages/lead/LeadLoginPage";
import LeadResetPasswordPage from "./pages/lead/LeadResetPasswordPage";
import LeadDashboardPage from "./pages/lead/LeadDashboardPage";
// Sales CRM pages
import { SalesAuthProvider, useSalesAuth } from "./context/SalesAuthContext";
import SalesLoginPage from "./pages/sales/SalesLoginPage";
import SalesLayout from "./pages/sales/SalesLayout";
import SalesManagerDashboard from "./pages/sales/manager/SalesManagerDashboard";
import SalesExecutivesPage from "./pages/sales/manager/SalesExecutivesPage";
import SalesUploadPage from "./pages/sales/manager/SalesUploadPage";
import SalesManagerClientsPage from "./pages/sales/manager/SalesManagerClientsPage";
import SalesReportsPage from "./pages/sales/manager/SalesReportsPage";
import SalesManagerFollowUpsPage from "./pages/sales/manager/SalesManagerFollowUpsPage";
import SalesQueuePage from "./pages/sales/executive/SalesQueuePage";
import SalesMyClientsPage from "./pages/sales/executive/SalesMyClientsPage";
import SalesFollowUpsPage from "./pages/sales/executive/SalesFollowUpsPage";
import SalesMyStatsPage from "./pages/sales/executive/SalesMyStatsPage";
import AdminSalesDashboard from "./pages/sales/admin/AdminSalesDashboard";
import AdminSalesManagersPage from "./pages/sales/admin/AdminSalesManagersPage";
import AdminSalesReportsPage from "./pages/sales/admin/AdminSalesReportsPage";
import AdminSalesClientsPage from "./pages/sales/admin/AdminSalesClientsPage";
import AdminSalesUploadPage from "./pages/sales/admin/AdminSalesUploadPage";
import AdminBanksPage from "./pages/admin/AdminBanksPage";
import BankDPRPage from "./pages/admin/BankDPRPage";
import LeadManagerDashboardPage from "./pages/admin/LeadManagerDashboardPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ServiceLayout from "./components/layouts/ServiceLayout";
import MsmeDprLeadFormPage from "./pages/msmeDpr/MsmeDprLeadFormPage";
import MsmeDprDashboardPage from "./pages/msmeDpr/MsmeDprDashboardPage";
import MsmeDprDashboard2Page from "./pages/msmeDpr/MsmeDprDashboard2Page";
import MepmaDprLeadFormPage from "./pages/mepmaDpr/MepmaDprLeadFormPage";
import MepmaDprDashboardPage from "./pages/mepmaDpr/MepmaDprDashboardPage";
import DprRequestLeadFormPage from "./pages/dprRequest/DprRequestLeadFormPage";
import DprRequestDashboardPage from "./pages/dprRequest/DprRequestDashboardPage";
import FranchisesPage from "./pages/franchise/FranchisesPage";
import FranchiseDetailPage from "./pages/franchise/FranchiseDetailPage";
import FranchiseApplyPage from "./pages/franchise/FranchiseApplyPage";
// BuyCreditsPage removed - using pay-per-report model
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import Landing from "./components/LandingPage/Landing";
import EmiCalculatorPage from "./components/calculators/EmiCalculatorPage";
import Pricing from "./components/Pricing/Pricing";
import SchemeFinder from "./components/schemeFinder/SchemeFinder";
import EligibilityResult from "./components/schemeFinder/EligibilityResult";
import FAQ from "./components/FAQ/FQA";
import TemplatesPage from "./components/LandingPage/pages/TemplatesPage";
import DocumentationPage from "./components/LandingPage/pages/DocumentationPage";
import BlogPage from "./components/LandingPage/pages/BlogPage";
import { AboutPage, CareersPage, PartnersPage, ContactPage, HelpCenterPage, APIPage } from "./components/LandingPage/pages/CompanyPages";
import { PrivacyPolicyPage, TermsOfServicePage, RefundPolicyPage, CookiesPage } from "./components/LandingPage/pages/LegalPages";
import { effectiveUserRole, isExecutiveRole } from "./utils/normalizeUserRole";
import { getBankForExecutiveRole } from "./utils/executiveTemplates";
import { dashboardHomePath, profilePathForRole, executiveDashboardPath } from "./utils/routePaths";
import { canAccessApplication } from "./utils/signupApproval";

/** One-shot profile refresh so org users get `companyIsActive` from API (legacy cached blobs). */
const AuthCompanyStatusSync = () => {
  const { isAuthenticated, user, getProfile } = useAuth();
  const ran = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !user || ran.current) return;
    const cid =
      user.companyId?._id || user.companyId?.id || user.companyId || user.company_id;
    if (cid != null && String(cid).length > 0 && user.companyIsActive === undefined) {
      ran.current = true;
      getProfile().catch(() => {
        ran.current = false;
      });
    }
  }, [isAuthenticated, user, getProfile]);
  return null;
};

/**
 * After Google signup, show an optional referral-code dialog once
 * (driven by `referral_prompt_pending` from the API — cleared on apply/skip).
 */
const GoogleReferralPromptHost = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);

  const needsPrompt =
    isAuthenticated &&
    user &&
    (user.needs_referral_prompt === true ||
      (user.referral_prompt_pending === true && !user.agent_id));

  useEffect(() => {
    setOpen(Boolean(needsPrompt));
  }, [needsPrompt]);

  if (!needsPrompt && !open) return null;

  const clearPromptOnUser = (extra = {}) => {
    updateUser({
      referral_prompt_pending: false,
      needs_referral_prompt: false,
      ...extra,
    });
  };

  return (
    <GoogleReferralPromptModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        clearPromptOnUser();
      }}
      onApplied={(data) => {
        setOpen(false);
        clearPromptOnUser({
          agent_id: data?.agent_id || true,
        });
      }}
    />
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!canAccessApplication(user)) {
    return <Navigate to="/auth" replace state={{ signupApprovalBlocked: true }} />;
  }
  // Force password change before accessing any other page
  if (user?.must_change_password) return <Navigate to="/change-password" replace />;
  return children;
};

// Platform super-admin routes only
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole !== 'admin') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Allows admin OR lead_manager to access a route
const LeadManagerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole !== 'admin' && normalizedRole !== 'lead_manager') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const AdminOnlyRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole === 'company_admin') {
    return <Navigate to="/company/dashboard" replace />;
  }
  if (normalizedRole !== 'admin') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const MsmeDprViewerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'msme_dpr_viewer') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const MepmaDprViewerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'mepma_dpr_viewer') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const DprRequestViewerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'dpr_request_viewer') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Admin-only access to report validation (approve/reject/etc.).
// Company admins don't get this — they are sent to /company/reports instead.
const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole === 'company_admin') {
    return <Navigate to="/company/reports" replace />;
  }
  if (normalizedRole !== 'admin') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Channel Partner / Customer Service with Approval Rights.
const ApprovalRightsRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!hasApprovalRights(user)) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// company_admin role only (platform admin redirected to admin dashboard).
const CompanyAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole !== 'company_admin') {
    if (normalizedRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Authenticated Finvois retail user routes only (distinct from company org users).
const RetailUserRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'user' && r !== 'customer_service') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const ExecutiveRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!isExecutiveRole(r)) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const ExecutiveBankRoute = ({ bank, children }) => {
  const { user } = useAuth();
  const allowedBank = getBankForExecutiveRole(effectiveUserRole(user));
  if (allowedBank && allowedBank !== bank) {
    return <Navigate to={executiveDashboardPath(user)} replace />;
  }
  return children;
};

const ExecutiveHomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={executiveDashboardPath(user)} replace />;
};

const ExecutiveProfileRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={profilePathForRole(user)} replace />;
};

const DepartmentRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'department') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const CustomerServiceRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'customer_service') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const CustomerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth?portal=customer" replace />;
  }
  if (r !== 'customer') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const NonExecutiveRoute = ({ children }) => {
  const { user } = useAuth();
  if (isExecutiveRole(effectiveUserRole(user))) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const ReportHelpUserRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!['user', 'company_user', 'company_admin'].includes(r)) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Shared Excel wizard at `/generate` — used by retail users, company admins (AI → wizard), and org users who land here.
const GenerateWizardRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!['user', 'company_user', 'company_admin', 'admin', 'agent', 'customer_service'].includes(r)) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// company_user role only (distinct from standalone retail users).
const CompanyUserRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const r = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (r !== 'company_user') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

/** Org reports URL — inactive company members use retail `/reports` (same UX as sidebar). */
const CompanyUserReportsRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (user?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }
  const r = effectiveUserRole(user);
  if (r === 'user') {
    return <Navigate to="/reports" replace />;
  }
  if (r !== 'company_user') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Platform admin or company admin (shared org-level routes under /company/…, etc.)
const AdminOrCompanyAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!['admin', 'company_admin'].includes(normalizedRole)) {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

const AdminGenerateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = effectiveUserRole(user);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (normalizedRole === 'company_admin') {
    return <Navigate to="/company/generate" replace />;
  }
  if (normalizedRole !== 'admin') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Agent Protected Route Component
const AgentRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (effectiveUserRole(user) !== 'agent') {
    return <Navigate to={dashboardHomePath(user)} replace />;
  }
  return children;
};

// Lead authenticated route — redirects to /lead/login if not authenticated
const LeadRoute = ({ children }) => {
  const isAuthenticated = useSelector(state => state.leadAuth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/lead/login" replace />;
  return children;
};

// Sales CRM route guards (separate auth system from main app)
const SalesPublicRoute = ({ children }) => {
  const { user, loading } = useSalesAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'manager' ? '/crm/manager/dashboard' : '/crm/executive/queue'} replace />;
  }
  return children;
};

const SalesManagerRoute = ({ children }) => {
  const { user, loading, isManager } = useSalesAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/crm/login" replace />;
  if (!isManager) return <Navigate to="/crm/executive/queue" replace />;
  return children;
};

const SalesExecutiveRoute = ({ children }) => {
  const { user, loading, isExecutive } = useSalesAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/crm/login" replace />;
  if (!isExecutive) return <Navigate to="/crm/manager/dashboard" replace />;
  return children;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return children;
  }

  // Redirect based on user role
  const normalizedRole = effectiveUserRole(user);
  if (normalizedRole === 'company_user') {
    return <Navigate to="/company/user/dashboard" replace />;
  }
  if (normalizedRole === 'company_admin') {
    return <Navigate to="/company/generate" replace />;
  }
  if (normalizedRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (effectiveUserRole(user) === 'agent') {
    return <Navigate to="/agent/dashboard" replace />;
  } else if (normalizedRole === 'msme_dpr_viewer') {
    return <Navigate to="/msme-dpr-dashboard" replace />;
  } else if (normalizedRole === 'mepma_dpr_viewer') {
    return <Navigate to="/mepma-dpr-dashboard" replace />;
  } else if (normalizedRole === 'dpr_request_viewer') {
    return <Navigate to="/dpr-request-dashboard" replace />;
  } else if (normalizedRole === 'customer') {
    return <Navigate to="/customer/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthCompanyStatusSync />
      <GoogleReferralPromptHost />
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#363636",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Routes */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login/page"
          element={
            <PublicRoute>
              <CustomerLoginPage />
            </PublicRoute>
          }
        />

        {/* API Test Route (for development) */}
        <Route path="/api-test" element={<APITestPage />} />

        {/* Email Verification Route */}
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Forgot Password Flow Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Force password change on first login — accessible while authenticated */}
        <Route path="/change-password" element={<ForceChangePasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <RetailUserRoute>
              <DashboardPage />
            </RetailUserRoute>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <CustomerRoute>
              <CustomerDashboardPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <CustomerRoute>
              <CustomerProfilePage />
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/reports"
          element={
            <CustomerRoute>
              <ReportsPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/department-requests"
          element={
            <CustomerRoute>
              <CustomerDepartmentRequestsPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/customer/department-requests/:id"
          element={
            <CustomerRoute>
              <CustomerDepartmentRequestDetailPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/executive/sbi/dashboard"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiDashboardPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/templates/sbi-house"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiHousePage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/templates/sbi-office"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiOfficePage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/templates/sbi-bussiness"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiBusinessPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/templates/income-tax"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiIncomeTaxPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/reports"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiReportsPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/drafts"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiDraftsPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/sbi/profile"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="SBI">
                <SbiProfilePage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/dashboard"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiDashboardPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi/*"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiClassicPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-housing"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHousingPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-msme"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiMsmePage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-home-loan-1"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHomeLoan1Page />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-home-loan-2"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHomeLoan2Page />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-home-loan-3"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHomeLoan3Page />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-home-loan-3-guarantor"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHomeLoan3GuarantorPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/templates/boi-home-loan-4"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiHomeLoan4Page />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/reports"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiReportsPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/drafts"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiDraftsPage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        <Route
          path="/executive/boi/profile"
          element={
            <ExecutiveRoute>
              <ExecutiveBankRoute bank="BOI">
                <BoiProfilePage />
              </ExecutiveBankRoute>
            </ExecutiveRoute>
          }
        />
        {/* Legacy executive paths → bank-scoped homes */}
        <Route path="/executive/dashboard" element={<ExecutiveRoute><ExecutiveHomeRedirect /></ExecutiveRoute>} />
        <Route path="/executive/reports" element={<ExecutiveRoute><ExecutiveHomeRedirect /></ExecutiveRoute>} />
        <Route path="/executive/drafts" element={<ExecutiveRoute><ExecutiveHomeRedirect /></ExecutiveRoute>} />
        <Route path="/executive/profile" element={<ExecutiveRoute><ExecutiveProfileRedirect /></ExecutiveRoute>} />
        <Route path="/executive/templates/*" element={<ExecutiveRoute><ExecutiveHomeRedirect /></ExecutiveRoute>} />
        <Route
          path="/company/dashboard"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyAdminDashboardPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/generate"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyAdminGeneratePage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/theory-pages"
          element={
            <AdminOrCompanyAdminRoute>
              <TheoryPagesHubPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/theory-pages/generate"
          element={
            <AdminOrCompanyAdminRoute>
              <TheoryGeneratePage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/user"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyUsersPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/user/:userId/reports"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyUserReportsByPersonPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route path="/draft" element={<Navigate to="/drafts" replace />} />
        <Route
          path="/drafts"
          element={
            <ProtectedRoute>
              <NonExecutiveRoute>
                <DraftsPage />
              </NonExecutiveRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate"
          element={
            <GenerateWizardRoute>
              <GeneratePage />
            </GenerateWizardRoute>
          }
        />
        <Route
          path="/theory-pages"
          element={
            <RetailUserRoute>
              <TheoryPagesHubPage />
            </RetailUserRoute>
          }
        />
        <Route
          path="/theory-pages/generate"
          element={
            <RetailUserRoute>
              <TheoryGeneratePage />
            </RetailUserRoute>
          }
        />
        <Route
          path="/generate/report-help"
          element={<Navigate to="/report-help" replace />}
        />
        <Route
          path="/generate/report-help/new"
          element={
            <ReportHelpUserRoute>
              <ReportHelpNewPage />
            </ReportHelpUserRoute>
          }
        />
        <Route
          path="/report-help"
          element={
            <ReportHelpUserRoute>
              <ReportHelpListPage />
            </ReportHelpUserRoute>
          }
        />
        <Route
          path="/report-help/:id"
          element={
            <ReportHelpUserRoute>
              <ReportHelpDetailPage />
            </ReportHelpUserRoute>
          }
        />
        {/* PMEGP / AP IDP generate routes */}
        <Route path="/generate/pmegp" element={<GenerateWizardRoute><PmegpGeneratePage /></GenerateWizardRoute>} />
        <Route path="/generate/pmegp/scheme-mail" element={<GenerateWizardRoute><PmegpSchemeMailPage /></GenerateWizardRoute>} />
        <Route path="/generate/pmegp/ai-chat" element={<GenerateWizardRoute><PublicPmegpAiChatPage /></GenerateWizardRoute>} />
        <Route path="/generate/ap-idp" element={<GenerateWizardRoute><ApIdpGeneratePage /></GenerateWizardRoute>} />
        <Route path="/generate/ap-idp/scheme-mail" element={<GenerateWizardRoute><ApIdpSchemeMailPage /></GenerateWizardRoute>} />
        <Route path="/generate/ap-idp/ai-chat" element={<GenerateWizardRoute><PublicApIdpAiChatPage /></GenerateWizardRoute>} />
        <Route
          path="/generate/cmep"
          element={
            <GenerateWizardRoute>
              <CmepGeneratePage />
            </GenerateWizardRoute>
          }
        />
        <Route
          path="/generate/cmep/scheme-mail"
          element={
            <GenerateWizardRoute>
              <CmepSchemeMailPage />
            </GenerateWizardRoute>
          }
        />
        <Route
          path="/generate/cmep/ai-chat"
          element={
            <GenerateWizardRoute>
              <PublicCmepAiChatPage />
            </GenerateWizardRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RetailUserRoute>
              <ReportsPage />
            </RetailUserRoute>
          }
        />
        {/* Buy Credits removed - using pay-per-report model now */}
        <Route path="/buy-credits" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-failure"
          element={
            <ProtectedRoute>
              <PaymentFailurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RetailUserRoute>
              <ProfilePage />
            </RetailUserRoute>
          }
        />
        <Route
          path="/company/user/dashboard"
          element={
            <CompanyUserRoute>
              <CompanyUserDashboardPage />
            </CompanyUserRoute>
          }
        />
        <Route
          path="/company/user/profile"
          element={
            <CompanyUserRoute>
              <CompanyUserProfilePage />
            </CompanyUserRoute>
          }
        />
        <Route
          path="/company/user/generate"
          element={
            <CompanyUserRoute>
              <CompanyUserGeneratePage />
            </CompanyUserRoute>
          }
        />
        <Route
          path="/company/user/theory-pages"
          element={
            <CompanyUserRoute>
              <TheoryPagesHubPage />
            </CompanyUserRoute>
          }
        />
        <Route
          path="/company/user/theory-pages/generate"
          element={
            <CompanyUserRoute>
              <TheoryGeneratePage />
            </CompanyUserRoute>
          }
        />
        <Route
          path="/company/user/reports"
          element={
            <CompanyUserReportsRoute>
              <CompanyUserReportsPage />
            </CompanyUserReportsRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute>
              <AdminPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/gold-loan"
          element={
            <ProtectedRoute>
              <GoldLoanFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/GOLD_LOAN"
          element={
            <ProtectedRoute>
              <GoldLoanFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/:templateId"
          element={
            <ProtectedRoute>
              <FRCC1FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc2"
          element={
            <ProtectedRoute>
              <FRCC2FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc3"
          element={
            <ProtectedRoute>
              <FRCC3FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc4"
          element={
            <ProtectedRoute>
              <FRCC4FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc5"
          element={
            <ProtectedRoute>
              <FRCC5FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc6"
          element={
            <ProtectedRoute>
              <FRCC6FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/frcc7"
          element={
            <ProtectedRoute>
              <FRCC7FormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/term-loan"
          element={
            <ProtectedRoute>
              <FRTermLoanFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/term-loan-with-stock"
          element={
            <ProtectedRoute>
              <FRTermLoanWithStockFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form/term-loan-cc"
          element={
            <ProtectedRoute>
              <FRTermLoanCCFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stage1"
          element={
            <ProtectedRoute>
              <Stage1Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stage2"
          element={
            <ProtectedRoute>
              <Stage2Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stage3"
          element={
            <ProtectedRoute>
              <Stage3Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-ready"
          element={
            <ProtectedRoute>
              <ReportReadyPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminOnlyRoute>
              <AdminUsersPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/user-approvals"
          element={
            <AdminOnlyRoute>
              <AdminUserApprovalsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/report-help"
          element={
            <AdminOnlyRoute>
              <AdminReportHelpPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/report-help/:id"
          element={
            <AdminOnlyRoute>
              <AdminReportHelpDetailPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/pricing"
          element={
            <AdminOnlyRoute>
              <AdminPricingPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <AdminOnlyRoute>
              <AdminTemplateConfigPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <SuperAdminRoute>
              <AdminReportsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/banker-reports"
          element={
            <SuperAdminRoute>
              <AdminBankerReportsPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/approved/reports"
          element={
            <ApprovalRightsRoute>
              <ApprovalRightsReportsPage />
            </ApprovalRightsRoute>
          }
        />
        <Route
          path="/approved/banker-reports"
          element={
            <ApprovalRightsRoute>
              <ApprovalRightsBankerReportsPage />
            </ApprovalRightsRoute>
          }
        />
        <Route
          path="/admin/master-data"
          element={
            <AdminOnlyRoute>
              <AdminMasterDataPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/schemes"
          element={
            <AdminOnlyRoute>
              <AdminSchemesPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/schemes/:schemeKey"
          element={
            <AdminOnlyRoute>
              <AdminSchemePdfPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/company/reports"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyAdminReportsPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/my-reports"
          element={
            <AdminOrCompanyAdminRoute>
              <ReportsPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/credits"
          element={
            <AdminOrCompanyAdminRoute>
              <CompanyManageCreditsPage />
            </AdminOrCompanyAdminRoute>
          }
        />
        <Route
          path="/company/profile"
          element={
            <CompanyAdminRoute>
              <CompanyAdminProfilePage />
            </CompanyAdminRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminOnlyRoute>
              <AdminWithdrawalsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfilePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/generate"
          element={
            <AdminGenerateRoute>
              <AdminGenerateReportPage />
            </AdminGenerateRoute>
          }
        />
        <Route
          path="/admin/theory-pages"
          element={
            <AdminGenerateRoute>
              <TheoryPagesHubPage />
            </AdminGenerateRoute>
          }
        />
        <Route
          path="/admin/theory-pages/generate"
          element={
            <AdminGenerateRoute>
              <TheoryGeneratePage />
            </AdminGenerateRoute>
          }
        />
        <Route
          path="/admin/free-credits"
          element={
            <AdminOnlyRoute>
              <AdminFreeCreditsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/promotional-emails"
          element={
            <AdminOnlyRoute>
              <AdminPromotionalEmailsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <LeadManagerRoute>
              <AdminServicesPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/services/new"
          element={
            <LeadManagerRoute>
              <AdminServiceNewPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/services/create"
          element={
            <LeadManagerRoute>
              <AdminServiceCreatePage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/services/:id"
          element={
            <LeadManagerRoute>
              <AdminServiceEditPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/franchises/applications"
          element={
            <AdminOnlyRoute>
              <AdminFranchiseApplicationsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/franchises/new"
          element={
            <AdminOnlyRoute>
              <AdminFranchiseNewPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/franchises/:id"
          element={
            <AdminOnlyRoute>
              <AdminFranchiseEditPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/franchises"
          element={
            <AdminOnlyRoute>
              <AdminFranchisesPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/msme-dpr-dashboard"
          element={
            <AdminOnlyRoute>
              <AdminMsmeDprDashboardPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/mepma-dpr-dashboard"
          element={
            <AdminOnlyRoute>
              <AdminMepmaDprDashboardPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/dpr-request-dashboard"
          element={
            <AdminOnlyRoute>
              <AdminDprRequestDashboardPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/customer-support"
          element={
            <AdminOnlyRoute>
              <AdminCustomerSupportPage />
            </AdminOnlyRoute>
          }
        />
        {/*
        <Route
          path="/admin/global-search"
          element={
            <AdminOnlyRoute>
              <AdminGlobalSearchPage />
            </AdminOnlyRoute>
          }
        />
        */}
        <Route
          path="/admin/govt-forms"
          element={
            <AdminOnlyRoute>
              <AdminGovtFormsPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/department-name"
          element={
            <AdminOnlyRoute>
              <AdminDepartmentDashboardPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/msme-dpr-dashboard"
          element={
            <MsmeDprViewerRoute>
              <MsmeDprDashboardPage />
            </MsmeDprViewerRoute>
          }
        />
        <Route
          path="/msme-dpr-dashboard-2"
          element={
            <MsmeDprViewerRoute>
              <MsmeDprDashboard2Page />
            </MsmeDprViewerRoute>
          }
        />
        <Route
          path="/msme-dpr/profile"
          element={
            <MsmeDprViewerRoute>
              <SimpleRoleProfilePage />
            </MsmeDprViewerRoute>
          }
        />
        <Route
          path="/mepma-dpr-dashboard"
          element={
            <MepmaDprViewerRoute>
              <MepmaDprDashboardPage />
            </MepmaDprViewerRoute>
          }
        />
        <Route
          path="/mepma-dpr/profile"
          element={
            <MepmaDprViewerRoute>
              <SimpleRoleProfilePage />
            </MepmaDprViewerRoute>
          }
        />
        <Route
          path="/dpr-request-dashboard"
          element={
            <DprRequestViewerRoute>
              <DprRequestDashboardPage />
            </DprRequestViewerRoute>
          }
        />
        <Route
          path="/dpr-request/profile"
          element={
            <DprRequestViewerRoute>
              <SimpleRoleProfilePage />
            </DprRequestViewerRoute>
          }
        />
        
        {/* Department Dashboard */}
        <Route
          path="/department/dashboard"
          element={
            <DepartmentRoute>
              <DepartmentDashboardPage />
            </DepartmentRoute>
          }
        />
        <Route
          path="/department/profile"
          element={
            <DepartmentRoute>
              <SimpleRoleProfilePage />
            </DepartmentRoute>
          }
        />

        {/* Public Form submissions */}
        <Route
          path="/report-requests/:customRoute"
          element={
            <ServiceLayout>
              <PublicFormPage />
            </ServiceLayout>
          }
        />

        {/* Customer Service pages */}
        <Route
          path="/customer-service/open"
          element={
            <CustomerServiceRoute>
              <OpenRequestsPage />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/customer-service/claimed"
          element={
            <Navigate to="/customer-service/assigned" replace />
          }
        />
        <Route
          path="/customer-service/assigned"
          element={
            <CustomerServiceRoute>
              <AssignedRequestsPage />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/customer-service/department-requests"
          element={
            <CustomerServiceRoute>
              <DepartmentRequestsPage />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/customer-service/history"
          element={
            <CustomerServiceRoute>
              <RequestHistoryPage />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/customer-service/requests/:id"
          element={
            <CustomerServiceRoute>
              <CustomerServiceRequestScreen />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/customer-service/msme-leads"
          element={
            <CustomerServiceRoute>
              <CustomerServiceMsmeLeadsPage />
            </CustomerServiceRoute>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <LeadManagerRoute>
              <AdminLeadsPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/leads/register"
          element={
            <LeadManagerRoute>
              <AdminLeadRegisterPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/leads/:id"
          element={
            <LeadManagerRoute>
              <AdminLeadEditPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/lead-manager/dashboard"
          element={
            <LeadManagerRoute>
              <LeadManagerDashboardPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/banks"
          element={
            <LeadManagerRoute>
              <AdminBanksPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/banks/send-dpr"
          element={
            <LeadManagerRoute>
              <BankDPRPage />
            </LeadManagerRoute>
          }
        />
        <Route
          path="/admin/company/create"
          element={
            <AdminOnlyRoute>
              <AdminCompanyCreatePage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <AdminOnlyRoute>
              <AdminCompaniesPage />
            </AdminOnlyRoute>
          }
        />
        {/* Static paths must be declared before :companyId or "create"/"new" are captured as ids */}
        <Route
          path="/admin/companies/create"
          element={
            <AdminOnlyRoute>
              <AdminCompanyCreatePage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/companies/new"
          element={
            <AdminOnlyRoute>
              <AdminCompanyCreatePage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/admin/companies/:companyId"
          element={
            <AdminOrCompanyAdminRoute>
              <AdminCreateCompanyPage />
            </AdminOrCompanyAdminRoute>
          }
        />

        {/* Agent Routes */}
        <Route
          path="/agent"
          element={<Navigate to="/agent/dashboard" replace />}
        />
        <Route
          path="/agent/generate"
          element={
            <AgentRoute>
              <AgentGeneratePage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/dashboard"
          element={
            <AgentRoute>
              <AgentDashboardPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/reports"
          element={
            <AgentRoute>
              <AgentLayout activeTab="reports">
                <ReportsPage />
              </AgentLayout>
            </AgentRoute>
          }
        />
        <Route
          path="/agent/referrals"
          element={
            <AgentRoute>
              <AgentReferralsPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/referrals/:userId/reports"
          element={
            <AgentRoute>
              <AgentReferralUserReportsPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/report-help"
          element={
            <AgentRoute>
              <AgentReportHelpPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/report-help/:id"
          element={
            <AgentRoute>
              <AgentReportHelpDetailPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/referral-link"
          element={
            <AgentRoute>
              <AgentReferralLinkPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/commissions"
          element={
            <AgentRoute>
              <AgentCommissionsPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/withdrawals"
          element={
            <AgentRoute>
              <AgentWithdrawalsPage />
            </AgentRoute>
          }
        />
        <Route
          path="/agent/profile"
          element={
            <AgentRoute>
              <AgentProfilePage />
            </AgentRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/client-screening" element={<PublicClientScreeningPage />} />
        <Route
          path="/msme-dpr-lead-data"
          element={
            <ServiceLayout>
              <MsmeDprLeadFormPage />
            </ServiceLayout>
          }
        />
        <Route
          path="/mempa"
          element={
            <ServiceLayout>
              <MepmaDprLeadFormPage />
            </ServiceLayout>
          }
        />
        <Route path="/mepma-dpr" element={<Navigate to="/mempa" replace />} />
        <Route
          path="/dpr-request"
          element={
            <ServiceLayout>
              <DprRequestLeadFormPage />
            </ServiceLayout>
          }
        />
        <Route
          path="/admin/client-screening/emails"
          element={
            <AdminOnlyRoute>
              <ClientScreeningMailPage />
            </AdminOnlyRoute>
          }
        />
        <Route path="/schemes" element={<SchemeFinder />} />
        {/* PMEGP */}
        <Route path="/schemes/pmegp/support" element={<PublicPmegpSchemeMailPage />} />
        <Route path="/schemes/pmegp" element={<PublicPmegpFormPage />} />
        <Route path="/schemes/pmegp/ai-chat" element={<PublicPmegpAiChatPage />} />
        <Route
          path="/schemes/mail"
          element={
            <AdminOnlyRoute>
              <SchemeMailManagePage />
            </AdminOnlyRoute>
          }
        />
        {/* AP IDP */}
        <Route path="/schemes/ap-idp/support" element={<PublicApIdpSchemeMailPage />} />
        <Route path="/schemes/ap-idp" element={<PublicApIdpFormPage />} />
        <Route path="/schemes/ap-idp/ai-chat" element={<PublicApIdpAiChatPage />} />
        <Route path="/schemes/cmep/support" element={<PublicCmepSchemeMailPage />} />
        <Route path="/schemes/cmep" element={<PublicCmepFormPage />} />
        <Route path="/schemes/cmep/ai-chat" element={<PublicCmepAiChatPage />} />
        <Route path="/eligibility-result" element={<EligibilityResult />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/calculators/emi-calculator" element={<EmiCalculatorPage />} />

        {/* New Landing Pages */}
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/api" element={<APIPage />} />

        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />

        {/* Lead & Service Management Routes */}
        <Route path="/services" element={<ServiceLayout><ServicesPage /></ServiceLayout>} />
        <Route path="/services/:id" element={<ServiceLayout><ServiceDetailPage /></ServiceLayout>} />
        <Route path="/franchises" element={<ServiceLayout><FranchisesPage /></ServiceLayout>} />
        <Route path="/franchises/:id/apply" element={<ServiceLayout><FranchiseApplyPage /></ServiceLayout>} />
        <Route path="/franchises/:id" element={<ServiceLayout><FranchiseDetailPage /></ServiceLayout>} />
        <Route path="/lead/login" element={<LeadLoginPage />} />
        <Route path="/lead/reset-password" element={<LeadResetPasswordPage />} />
        <Route path="/lead/dashboard" element={<LeadRoute><LeadDashboardPage /></LeadRoute>} />

        {/* Admin Sales CRM Routes — use main platform JWT (AdminRoute guard) */}
        <Route path="/admin/sales" element={<AdminRoute><Navigate to="/admin/sales/dashboard" replace /></AdminRoute>} />
        <Route path="/admin/sales/dashboard" element={<AdminRoute><AdminSalesDashboard /></AdminRoute>} />
        <Route path="/admin/sales/managers"  element={<AdminRoute><AdminSalesManagersPage /></AdminRoute>} />
        <Route path="/admin/sales/reports"   element={<AdminRoute><AdminSalesReportsPage /></AdminRoute>} />
        <Route path="/admin/sales/clients"   element={<AdminRoute><AdminSalesClientsPage /></AdminRoute>} />
        <Route path="/admin/sales/upload"    element={<AdminRoute><AdminSalesUploadPage /></AdminRoute>} />

        {/* Sales CRM Routes — wrapped in SalesAuthProvider for isolated auth */}
        <Route
          path="/crm/*"
          element={
            <SalesAuthProvider>
              <Routes>
                <Route path="login" element={<SalesPublicRoute><SalesLoginPage /></SalesPublicRoute>} />

                {/* Manager routes */}
                <Route
                  path="manager"
                  element={<SalesManagerRoute><SalesLayout /></SalesManagerRoute>}
                >
                  <Route path="dashboard" element={<SalesManagerDashboard />} />
                  <Route path="executives" element={<SalesExecutivesPage />} />
                  <Route path="upload" element={<SalesUploadPage />} />
                  <Route path="clients" element={<SalesManagerClientsPage />} />
                  <Route path="reports" element={<SalesReportsPage />} />
                  <Route path="follow-ups" element={<SalesManagerFollowUpsPage />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Executive routes */}
                <Route
                  path="executive"
                  element={<SalesExecutiveRoute><SalesLayout /></SalesExecutiveRoute>}
                >
                  <Route path="queue" element={<SalesQueuePage />} />
                  <Route path="clients" element={<SalesMyClientsPage />} />
                  <Route path="follow-ups" element={<SalesFollowUpsPage />} />
                  <Route path="stats" element={<SalesMyStatsPage />} />
                  <Route index element={<Navigate to="queue" replace />} />
                </Route>

                <Route index element={<Navigate to="login" replace />} />
              </Routes>
            </SalesAuthProvider>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a
                  href="/dashboard"
                  className="bg-[#7e22ce] text-white px-6 py-3 rounded-lg hover:bg-[#6b21a8] transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
