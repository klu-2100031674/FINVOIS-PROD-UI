/**
 * Client layout — left collapsible sidebar + header, same interaction model as AdminLayout.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import NotificationBell from '../common/NotificationBell';
import finvoisLogo from '../../assets/finvois.png';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { effectiveUserRole, isExecutiveRole } from '../../utils/normalizeUserRole';
import UserSidebar from '../../pages/UserSidebar';
import CompanyUserSidebar from '../../pages/company/user/CompanyUserSidebar';
import SbiSidebar from '../../pages/Executive/sbi/SbiSidebar';
import BoiSidebar from '../../pages/Executive/boi/BoiSidebar';
import CompanyAdminSidebar from '../../pages/company/CompanyAdminSidebar';
import CustomerSidebar from '../../customer/CustomerSidebar';
import CustomerServiceSidebar from '../../pages/customerService/CustomerServiceSidebar';
import { executiveDashboardPath } from '../../utils/routePaths';

const ClientLayout = ({ children, shellClassName = '', shellStyle, wideContent = false, hideSidebar = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = effectiveUserRole(user);

  const { dashboardPath, isAdminRole } = useMemo(() => {
    const isSuperAdmin = role === 'admin';
    const isCompanyAdmin = role === 'company_admin';
    const isCompanyUser = role === 'company_user';
    const isAgent = role === 'agent';
    const isExec = isExecutiveRole(role);

    const dash = role === 'customer'
      ? '/customer/dashboard'
      : isCompanyUser
        ? '/company/user/dashboard'
        : isCompanyAdmin
          ? '/company/dashboard'
          : isSuperAdmin
            ? '/admin/dashboard'
            : isAgent
              ? '/agent/dashboard'
              : isExec
                ? executiveDashboardPath(user)
                : '/dashboard';

    return {
      dashboardPath: dash,
      isAdminRole: isSuperAdmin || isCompanyAdmin,
    };
  }, [role, user]);

  const shell = `min-h-screen bg-gray-50 font-['Inter'] ${shellClassName}`.trim();

  return (
    <div className={shell} style={shellStyle}>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0">
              {!hideSidebar && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2 flex-shrink-0"
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
              {!hideSidebar && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2 flex-shrink-0"
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              )}
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 text-gray-900 min-w-0"
              >
                <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto flex-shrink-0" />
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <NotificationBell />
              {isAdminRole && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hidden sm:inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {(() => {
          switch (role) {
            case 'company_user':
              return (
                <CompanyUserSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'sbi_executive':
              return (
                <SbiSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'boi_executive':
              return (
                <BoiSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'company_admin':
              return (
                <CompanyAdminSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'customer':
              return (
                <CustomerSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'customer_service':
              return (
                <CustomerServiceSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
            case 'user':
            default:
              return (
                <UserSidebar
                  sidebarOpen={sidebarOpen}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  hideSidebar={hideSidebar}
                />
              );
          }
        })()}

        <main
          className={`flex-1 overflow-x-hidden min-w-0 ${
            wideContent
              ? 'p-0 min-h-[calc(100vh-4rem)] flex flex-col'
              : 'p-6'
          }`}
        >
          <div
            className={
              wideContent
                ? 'flex-1 min-h-0 flex flex-col w-full'
                : 'max-w-7xl mx-auto'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
