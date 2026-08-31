import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Wallet,
  FileStack,
  User,
  Zap,
  CreditCard,
  Gift,
  Mail,
  Building2,
  FolderOpen,
  Briefcase,
  UserCheck,
  Landmark,
  Send,
  Inbox,
  Store,
  Layers,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeUserRole } from '../../utils/normalizeUserRole';
import DepartmentsSidebarItem from '../../components/admin/DepartmentsSidebarItem';

const AdminSidebar = ({
  sidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  hideSidebar = false,
  persistSidebarScroll,
  saveSidebarScrollBeforeNavigate,
  sidebarNavRef,
  mobileSidebarRef,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const role = normalizeUserRole(user?.role);

  const roleBadgeLabel = {
    admin: 'Super Admin',
    lead_manager: 'Service Manager',
    sbi_executive: 'SBI Executive',
    boi_executive: 'BOI Executive',
  }[role] || 'Admin';

  const navItems = useMemo(() => {
    // ── Service Manager: isolated sidebar — CRM items only, no profile ──
    if (role === 'lead_manager') {
      return [
        { to: '/admin/lead-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { type: 'section', key: 'crm-section', label: 'CRM' },
        { to: '/admin/leads', icon: UserCheck, label: 'Service Providers' },
        { to: '/admin/services', icon: Briefcase, label: 'Services' },
        { to: '/admin/banks', icon: Landmark, label: 'Banks' },
        { to: '/admin/banks/send-dpr', icon: Send, label: 'Send to Banks' },
      ];
    }

    const items = [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
      { to: '/admin/generate', icon: Zap, label: 'Generate Reports' },
      { to: '/admin/theory-pages', icon: BookOpen, label: 'Theory Pages' },
      { to: '/drafts', icon: FolderOpen, label: 'Drafts' },
      { to: '/admin/users', icon: Users, label: 'User Management' },
    ];

    if (role === 'admin') {
      items.push({ to: '/admin/user-approvals', icon: UserCheck, label: 'User Approvals' });
      items.push({ to: '/admin/report-help', icon: Inbox, label: 'Report Help' });
    }

    items.push({
      to: '/admin/reports',
      icon: FileText,
      label: 'Report Validation',
    });

    if (role === 'admin') {
      items.push({
        to: '/admin/banker-reports',
        icon: Briefcase,
        label: 'Banker Reports',
      });
      items.push({
        to: '/admin/master-data',
        icon: Layers,
        label: 'Master Data',
      });
      items.push({
        to: '/admin/schemes',
        icon: Landmark,
        label: 'Schemes',
      });
      items.push({
        to: '/admin/client-screening/emails',
        icon: UserCheck,
        label: 'Client Screening',
      });
      items.push({
        to: '/admin/franchises',
        icon: Store,
        label: 'Franchise',
      });
      items.push({
        to: '/admin/msme-dpr-dashboard',
        icon: FileText,
        label: 'AP MSME DC',
      });
      items.push({
        to: '/admin/mepma-dpr-dashboard',
        icon: FileText,
        label: 'MEPMA DC',
      });
      items.push({
        to: '/admin/govt-forms',
        icon: Layers,
        label: 'Govt Forms',
      });
      items.push({
        type: 'departments',
        key: 'departments',
        label: 'Departments',
      });
    }

    if (role !== 'lead_manager') {
      items.push(
        { to: '/admin/templates', icon: FileStack, label: 'Template Config' },
        { to: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
        { to: '/admin/payments', icon: CreditCard, label: 'Transactions' },
        { to: '/admin/free-credits', icon: Gift, label: 'Free Reports' },
        { to: '/admin/promotional-emails', icon: Mail, label: 'Promo Emails' }
      );
    }

    // CRM section — visible to admin (no Sales CRM in Prod)
    items.push(
      { type: 'section', key: 'crm-section', label: 'CRM' },
      { to: '/admin/services', icon: Briefcase, label: 'Services' },
      { to: '/admin/leads', icon: UserCheck, label: 'Service Providers' },
      { to: '/admin/banks', icon: Landmark, label: 'Banks' }
    );

    if (role === 'admin') {
      items.push({ to: '/admin/companies', icon: Building2, label: 'Company Management' });
    }

    items.push({
      to: '/admin/profile',
      icon: User,
      label: 'Profile',
    });

    return items;
  }, [role]);

  if (hideSidebar) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}
      >
        <div className={`p-4 border-b border-gray-200 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${!sidebarOpen ? '' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {roleBadgeLabel}
              </span>
            </div>
          )}
        </div>

        <nav
          ref={sidebarNavRef}
          className="flex-1 py-4 overflow-y-auto"
          onScroll={persistSidebarScroll}
        >
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
              ) : item.type === 'departments' ? (
                <DepartmentsSidebarItem
                  key={item.key}
                  sidebarOpen={sidebarOpen}
                  onNavigate={saveSidebarScrollBeforeNavigate}
                />
              ) : (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={saveSidebarScrollBeforeNavigate}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg transition-colors ${
                        item.indent ? 'px-2 py-2 ml-2' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon size={item.indent ? 16 : 20} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <span className={`ml-3 ${item.indent ? 'text-sm' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            type="button"
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <aside
            ref={mobileSidebarRef}
            onScroll={persistSidebarScroll}
            className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {roleBadgeLabel}
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
                  ) : item.type === 'departments' ? (
                    <DepartmentsSidebarItem
                      key={item.key}
                      sidebarOpen
                      onNavigate={() => {
                        saveSidebarScrollBeforeNavigate();
                        setMobileMenuOpen(false);
                      }}
                    />
                  ) : (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => {
                          saveSidebarScrollBeforeNavigate();
                          setMobileMenuOpen(false);
                        }}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg transition-colors ${
                            item.indent ? 'px-2 py-2 ml-2' : 'px-3 py-2.5'
                          } ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <item.icon size={item.indent ? 16 : 20} />
                        <span className={`ml-3 ${item.indent ? 'text-sm' : ''}`}>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </nav>

            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleLogout}
                type="button"
                className="flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                <span className="ml-3 font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
