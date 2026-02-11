/**
 * Main App Component
 * Routing and Protected Routes
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks";
import {
  AuthPage,
  DashboardPage,
  GeneratePage,
  ReportsPage,
  Stage1Page,
  Stage2Page,
  Stage3Page,
  FRCC1FormPage,
  ProfilePage,
  AdminPage,
  AdminPaymentsPage,
} from "./pages";
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminPricingPage,
  AdminWithdrawalsPage,
  AdminTemplateConfigPage,
  AdminReportsPage,
  AdminProfilePage,
  AdminGenerateReportPage,
} from "./pages/admin";
import {
  AgentDashboardPage,
  AgentReferralsPage,
  AgentReferralLinkPage,
  AgentReportsPage,
  AgentCommissionsPage,
  AgentWithdrawalsPage,
  AgentProfilePage,
} from "./pages/agent";
import FRCC2FormPage from "./pages/FRCC2FormPage";
import FRCC3FormPage from "./pages/FRCC3FormPage";
import FRCC4FormPage from "./pages/FRCC4FormPage";
import FRCC5FormPage from "./pages/FRCC5FormPage";
import FRCC6FormPage from "./pages/FRCC6FormPage";
import FRTermLoanFormPage from "./pages/FRTermLoanFormPage";
import FRTermLoanWithStockFormPage from "./pages/FRTermLoanWithStockFormPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import FRTermLoanCCFormPage from "./pages/FRTermLoanCCFormPage";
import APITestPage from "./pages/APITestPage";
import ReportReadyPage from "./pages/ReportReadyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OTPVerificationPage from "./pages/OTPVerificationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
// BuyCreditsPage removed - using pay-per-report model
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import Landing from "./components/LandingPage/Landing";
import Pricing from "./components/Pricing/Pricing";
import SchemeFinder from "./components/schemeFinder/SchemeFinder";
import EligibilityResult from "./components/schemeFinder/EligibilityResult";
import FAQ from "./components/FAQ/FQA";
import TemplatesPage from "./components/LandingPage/pages/TemplatesPage";
import DocumentationPage from "./components/LandingPage/pages/DocumentationPage";
import BlogPage from "./components/LandingPage/pages/BlogPage";
import { AboutPage, CareersPage, PartnersPage, ContactPage, HelpCenterPage, APIPage } from "./components/LandingPage/pages/CompanyPages";
import { PrivacyPolicyPage, TermsOfServicePage, CookiesPage } from "./components/LandingPage/pages/LegalPages";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  console.log(
    "🔒 ProtectedRoute - isAuthenticated:",
    isAuthenticated,
    "user:",
    user
  );
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Admin Protected Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Agent Protected Route Component
const AgentRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (user?.role !== 'agent') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  console.log(
    "🌐 PublicRoute - isAuthenticated:",
    isAuthenticated,
    "user:",
    user
  );

  if (!isAuthenticated) {
    return children;
  }

  // Redirect based on user role
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'agent') {
    return <Navigate to="/agent/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
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

        {/* API Test Route (for development) */}
        <Route path="/api-test" element={<APITestPage />} />

        {/* Email Verification Route */}
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Forgot Password Flow Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate"
          element={
            <ProtectedRoute>
              <GeneratePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
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
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pricing"
          element={
            <AdminRoute>
              <AdminPricingPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <AdminRoute>
              <AdminTemplateConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminRoute>
              <AdminWithdrawalsPage />
            </AdminRoute>
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
            <AdminRoute>
              <AdminGenerateReportPage />
            </AdminRoute>
          }
        />

        {/* Agent Routes */}
        <Route
          path="/agent"
          element={<Navigate to="/agent/dashboard" replace />}
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
              <AgentReportsPage />
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
        <Route path="/schemes" element={<SchemeFinder />} />
        <Route path="/eligibility-result" element={<EligibilityResult />} />
        <Route path="/faq" element={<FAQ />} />

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
        <Route path="/cookies" element={<CookiesPage />} />

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
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
