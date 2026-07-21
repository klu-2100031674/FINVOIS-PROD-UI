/**
 * Client layout — left collapsible sidebar + header, same interaction model as AdminLayout.
 */

import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import NotificationBell from '../common/NotificationBell';
import finvoisLogo from '../../assets/finvois.png';
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  FileStack,
  User,
  Zap,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { effectiveUserRole } from '../../utils/normalizeUserRole';
import { getReportHelpNavLabel } from '../../utils/reportHelpNav';
import CustomerSidebar from '../../customer/CustomerSidebar';
import CustomerServiceSidebar from '../../pages/customerService/CustomerServiceSidebar';

const linkClass = ({ isActive }) =>
  `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
    isActive
      ? 'bg-purple-50 text-purple-700 font-medium'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

const ClientLayout = ({ children, shellClassName = '', shellStyle, wideContent = false, hideSidebar = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = effectiveUserRole(user);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const { dashboardPath, profilePath, myReportsPath, generatePath, roleBadge, isAdminRole } = useMemo(() => {
    const isAgent = role === 'agent';
    const isExecutive = role === 'executive';
    const isSuperAdmin = role === 'admin';
    const isCompanyAdmin = role === 'company_admin';
    const isCompanyUser = role === 'company_user';
    const isAdmin = isSuperAdmin || isCompanyAdmin;

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
              : isExecutive
                ? '/executive/dashboard'
                : '/dashboard';
    const prof = role === 'customer'
      ? '/customer/profile'
      : isCompanyUser
        ? '/company/user/profile'
        : isCompanyAdmin
          ? '/company/profile'
          : isSuperAdmin
            ? '/admin/profile'
            : isAgent
              ? '/agent/profile'
              : isExecutive
                ? '/executive/profile'
                : '/profile';
    const reports = role === 'customer'
      ? '/customer/reports'
      : isExecutive
        ? '/executive/reports'
        : isCompanyUser
          ? '/company/user/reports'
          : isCompanyAdmin
            ? '/company/reports'
            : isSuperAdmin
              ? '/admin/reports'
              : isAgent
                ? '/agent/reports'
                : '/reports';
    const gen = isCompanyUser
      ? '/company/user/dashboard'
      : isAdmin
        ? isCompanyAdmin
          ? '/company/generate'
          : '/admin/generate'
        : isAgent
          ? '/agent/generate'
          : '/dashboard';

    let badge = 'User';
    if (isSuperAdmin) badge = 'Super Admin';
    else if (isCompanyAdmin) badge = 'Company Admin';
    else if (isCompanyUser) badge = 'Company user';
    else if (isAgent) badge = 'Channel partner';
    else if (isExecutive) badge = 'Executive';
    else if (role === 'customer') badge = 'Customer';
    else if (role === 'customer_service') badge = 'Customer Service';

    return {
      dashboardPath: dash,
      profilePath: prof,
      myReportsPath: reports,
      generatePath: gen,
      roleBadge: badge,
      isAdminRole: isAdmin,
    };
  }, [role, user]);

  const navItems = useMemo(() => {
    if (role === 'executive') {
      return [
        { to: dashboardPath, icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/executive/drafts', icon: FileText, label: 'Drafts' },
        { to: myReportsPath, icon: FileStack, label: 'Reports' },
        { to: profilePath, icon: User, label: 'Profile' },
      ];
    }
    const items = [
      { to: dashboardPath, icon: LayoutDashboard, label: isAdminRole ? 'Admin Dashboard' : 'Dashboard' },
    ];
    if (generatePath !== dashboardPath) {
      items.push({ to: generatePath, icon: Zap, label: 'Generate report' });
    }
    items.push({ to: '/drafts', icon: FileText, label: 'Drafts' });
    if (['user', 'company_user', 'company_admin'].includes(role)) {
      items.push({
        to: '/report-help',
        icon: Inbox,
        label: getReportHelpNavLabel(user),
      });
    }
    items.push(
      { to: myReportsPath, icon: FileStack, label: isAdminRole ? 'Report Validation' : 'My reports' },
      { to: profilePath, icon: User, label: 'Profile' }
    );
    return items;
  }, [dashboardPath, generatePath, myReportsPath, profilePath, isAdminRole, role, user]);

  const roleSidebar = (() => {
    if (role === 'customer') {
      return (
        <CustomerSidebar
          sidebarOpen={sidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          hideSidebar={hideSidebar}
        />
      );
    }
    if (role === 'customer_service') {
      return (
        <CustomerServiceSidebar
          sidebarOpen={sidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          hideSidebar={hideSidebar}
        />
      );
    }
    return null;
  })();

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
        {roleSidebar ? (
          roleSidebar
        ) : !hideSidebar ? (
          <aside
            className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
              sidebarOpen ? 'w-64' : 'w-20'
            }`}
            style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}
          >
          <div
            className={`p-4 border-b border-gray-200 ${!sidebarOpen ? 'flex justify-center' : ''}`}
          >
            <div className={`flex items-center ${!sidebarOpen ? '' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {roleBadge}
                </span>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    className={linkClass}
                    end={item.to === dashboardPath}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && <span className="ml-3">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
                !sidebarOpen ? 'justify-center' : ''
              }`}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
            </button>
          </div>
          </aside>
        ) : null}

        {!roleSidebar && !hideSidebar && mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
              role="presentation"
            />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    {roleBadge}
                  </span>
                </div>
              </div>

              <nav className="py-4">
                <ul className="space-y-1 px-3">
                  {navItems.map((item) => (
                    <li key={`m-${item.to}-${item.label}`}>
                      <NavLink
                        to={item.to}
                        end={item.to === dashboardPath}
                        onClick={() => setMobileMenuOpen(false)}
                        className={linkClass}
                      >
                        <item.icon size={20} className="flex-shrink-0" />
                        <span className="ml-3">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="p-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="ml-3 font-medium">Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

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
