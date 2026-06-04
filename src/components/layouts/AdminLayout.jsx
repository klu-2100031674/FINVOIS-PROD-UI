/**
 * Admin Layout Component
 * Provides sidebar navigation for admin/company_admin users
 * Matching main dashboard UI theme
 */

import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import NotificationBell from '../common/NotificationBell';
import finvoisLogo from '../../assets/finvois.png';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Wallet,
  FileStack,
  User,
  Settings,
  BarChart3,
  Zap,
  CreditCard,
  Gift,
  Mail,
  Building2,
  FolderOpen,
  Briefcase,
  UserCheck,
  Landmark,
  Inbox,
  Store,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeUserRole } from '../../utils/normalizeUserRole';
import { getReportHelpNavLabel } from '../../utils/reportHelpNav';
import { companyAPI } from '../../api/endpoints';

const AdminLayout = ({ children, hideSidebar = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const role = normalizeUserRole(user?.role);

  const navItems = useMemo(() => {
    const companyIdForRoutes = companyAPI.normalizeCompanyId(
      user?.companyId?._id ||
        user?.companyId?.id ||
        user?.companyId?.$oid ||
        user?.company?._id ||
        user?.company?.id ||
        user?.company_id ||
        (typeof user?.companyId === 'string' || typeof user?.companyId === 'number' ? user.companyId : '')
    );

    const items = [
      { to: role === 'company_admin' ? '/company/dashboard' : '/admin/dashboard', icon: LayoutDashboard, label: role === 'company_admin' ? 'Company Dashboard' : 'Admin Dashboard' },
      { to: role === 'company_admin' ? '/company/generate' : '/admin/generate', icon: Zap, label: 'Generate Reports' },
      { to: '/drafts', icon: FolderOpen, label: 'Drafts' },
    ];

    if (role !== 'company_admin') {
      items.push({ to: '/admin/users', icon: Users, label: 'User Management' });
      if (role === 'admin') {
        items.push({ to: '/admin/user-approvals', icon: UserCheck, label: 'User Approvals' });
        items.push({ to: '/admin/report-help', icon: Inbox, label: 'Report Help' });
      }
    }

    if (role === 'company_admin') {
      items.push({
        to: '/company/my-reports',
        icon: FileStack,
        label: 'My Reports'
      });
      items.push({
        to: '/report-help',
        icon: Inbox,
        label: getReportHelpNavLabel(user),
      });
    }

    // Company admins: org settings (logos, users) live under /admin/companies/:id — not /company/profile (personal account).
    if (role === 'company_admin') {
      items.push({ type: 'section', key: 'company-nav-section', label: 'Your company' });
      if (companyIdForRoutes) {
        items.push({
          to: `/admin/companies/${companyIdForRoutes}`,
          icon: Building2,
          label: 'Company Profile',
          title: 'Company logos, details, and users',
        });
      }
      items.push({
        to: '/company/credits',
        icon: Gift,
        label: 'Manage Credits'
      });
    }

    items.push({
      to: role === 'company_admin' ? '/company/reports' : '/admin/reports',
      icon: FileText,
      label: role === 'company_admin' ? 'Company Reports' : 'Report Validation'
    });

    if (role === 'admin') {
      items.push({
        to: '/admin/banker-reports',
        icon: Briefcase,
        label: 'Banker Reports'
      });
      items.push({
        to: '/admin/master-data',
        icon: Layers,
        label: 'Master Data'
      });
    }

    if (role === 'admin') {
      items.push({
        to: '/admin/schemes',
        icon: Landmark,
        label: 'Schemes',
      });
      items.push({
        to: '/admin/franchises',
        icon: Store,
        label: 'Franchise',
      });
    }

    if (role !== 'company_admin') {
      items.push(
        { to: '/admin/templates', icon: FileStack, label: 'Template Config' },
        { to: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
        { to: '/admin/payments', icon: CreditCard, label: 'Transactions' },
        { to: '/admin/free-credits', icon: Gift, label: 'Free Credits' },
        { to: '/admin/promotional-emails', icon: Mail, label: 'Promo Emails' },
        { type: 'section', key: 'crm-section', label: 'CRM' },
        { to: '/admin/services', icon: Briefcase, label: 'Services' },
        { to: '/admin/leads', icon: UserCheck, label: 'Leads' }
      );
    }

    if (role === 'admin') {
      items.push({ to: '/admin/companies', icon: Building2, label: 'Company Management' });
    }

    items.push({
      to: role === 'company_admin' ? '/company/profile' : '/admin/profile',
      icon: User,
      label: 'Profile'
    });
    return items;
  }, [role, user]);

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      {/* Header - Matching main dashboard */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              {!hideSidebar && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
              {!hideSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2"
                >
                  {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              )}
              <Link to={role === 'company_admin' ? '/company/dashboard' : '/admin/dashboard'} className="flex items-center gap-2 text-gray-900">
                <img
                  src={finvoisLogo}
                  alt="Finvois Logo"
                  className="h-9 w-auto"
                />
                
              </Link>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        {!hideSidebar && (
          <aside
            className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
              sidebarOpen ? 'w-64' : 'w-20'
            }`}
            style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}
          >
          {/* User Profile Section */}
          <div className={`p-4 border-b border-gray-200 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center ${!sidebarOpen ? '' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {normalizeUserRole(user?.role) === 'admin' ? 'Super Admin' : 'Company Admin'}
                </span>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {navItems.map((item) =>
                item.type === 'section' ? (
                  !sidebarOpen ? null : (
                  <li key={item.key} className="pt-3 pb-1">
                    <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {item.label}
                    </span>
                  </li>
                  )
                ) : (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      title={item.title}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {sidebarOpen && <span className="ml-3">{item.label}</span>}
                    </NavLink>
                  </li>
                )
              )}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
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
        )}

        {/* Mobile Sidebar Overlay */}
        {!hideSidebar && mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto">
              {/* User Profile Section - Mobile */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    {normalizeUserRole(user?.role) === 'admin' ? 'Super Admin' : 'Company Admin'}
                  </span>
                </div>
              </div>

              <nav className="py-4">
                <ul className="space-y-1 px-3">
                  {navItems.map((item) =>
                    item.type === 'section' ? (
                      <li key={item.key} className="pt-3 pb-1">
                        <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {item.label}
                        </span>
                      </li>
                    ) : (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          title={item.title}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-purple-50 text-purple-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                          }
                        >
                          <item.icon size={20} />
                          <span className="ml-3">{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>
              </nav>

              {/* Logout Button - Mobile */}
              <div className="p-3 border-t border-gray-200">
                <button
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

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
