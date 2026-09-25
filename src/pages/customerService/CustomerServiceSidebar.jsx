import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import {
  LayoutDashboard,
  Inbox,
  User,
  FileText,
  FileStack,
  Briefcase,
  ClipboardCheck,
  // ClipboardList,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasApprovalRights } from '../../utils/approvalRights';
import api from '../../api/apiClient';

const linkClass = ({ isActive }) =>
  `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
    isActive
      ? 'bg-purple-50 text-purple-700 font-medium'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

const workQueueLinkClass = ({ isActive }) =>
  `flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${
    isActive
      ? 'bg-purple-100 text-purple-800 font-semibold shadow-sm ring-1 ring-purple-200'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

const WORK_QUEUE_ITEMS = [
  { to: '/customer-service/open', icon: Inbox, label: 'Open', countKey: 'open' },
  { to: '/customer-service/assigned', icon: User, label: 'Assigned', countKey: 'assigned' },
  { to: '/customer-service/department-requests', icon: FileText, label: 'Dept', countKey: 'department' },
  { to: '/customer-service/history', icon: FileStack, label: 'History', countKey: 'completed' },
  // { to: '/customer-service/msme-leads', icon: ClipboardList, label: 'MSME', countKey: null },
];

const CustomerServiceSidebar = ({
  sidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  hideSidebar = false,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [queueCounts, setQueueCounts] = useState({
    open: 0,
    assigned: 0,
    department: 0,
    completed: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const parseCounts = (res) => {
      const body = res?.data;
      const payload = body?.data && typeof body.data === 'object' ? body.data : body;
      if (!payload || typeof payload !== 'object') return null;
      const next = {};
      ['open', 'assigned', 'department', 'completed'].forEach((key) => {
        const n = Number(payload[key]);
        if (Number.isFinite(n)) next[key] = n;
      });
      return Object.keys(next).length ? next : null;
    };
    const loadCounts = async () => {
      try {
        const res = await api.get('/govt-forms/requests/counts');
        const next = parseCounts(res);
        if (!cancelled && next) {
          setQueueCounts((prev) => ({ ...prev, ...next }));
        }
      } catch {
        // Counts are decorative; ignore failures.
      }
    };
    loadCounts();
    const timer = setInterval(loadCounts, 15000);
    const onFocus = () => loadCounts();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Generate Report' },
    { type: 'section', key: 'cs-section', label: 'Work Queue' },
    { type: 'work-queue' },
    { type: 'section', key: 'personal-section', label: 'Personal Work' },
    { to: '/drafts', icon: FileText, label: 'Drafts' },
    { to: '/reports', icon: FileStack, label: 'Approved Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  if (hasApprovalRights(user)) {
    navItems.splice(
      3,
      0,
      { type: 'section', key: 'approval-section', label: 'Approval Rights' },
      { to: '/approved/reports', icon: ClipboardCheck, label: 'Report Validation' },
      { to: '/approved/banker-reports', icon: Briefcase, label: 'Banker Reports' },
    );
  }

  const renderWorkQueue = ({ compact = false, onNavigate } = {}) => (
    <ul className={compact ? 'space-y-0.5 mt-1 mb-2' : 'space-y-0.5'}>
      {WORK_QUEUE_ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={workQueueLinkClass}
            onClick={onNavigate}
          >
            <span className="flex items-center min-w-0">
              <item.icon size={18} className="flex-shrink-0" />
              {(sidebarOpen || !compact) && (
                <span className="ml-2 text-sm truncate">{item.label}</span>
              )}
            </span>
            {(item.countKey) && (
              <span className="ml-auto shrink-0 min-w-[1.5rem] text-center text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200">
                {queueCounts[item.countKey] ?? 0}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  if (hideSidebar) return null;

  return (
    <>
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
              {user?.name?.[0]?.toUpperCase() || 'C'}
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
                Customer Service
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              if (item.type === 'work-queue') {
                return (
                  <li key="work-queue">{renderWorkQueue({ compact: true })}</li>
                );
              }
              if (item.type === 'section') {
                return !sidebarOpen ? null : (
                  <li key={item.key} className="pt-3 pb-1">
                    <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {item.label}
                    </span>
                  </li>
                );
              }
              return (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    className={linkClass}
                    end={item.to === '/dashboard'}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && <span className="ml-3">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
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

      {mobileMenuOpen && (
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
                  {user?.name?.[0]?.toUpperCase() || 'C'}
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
                  Customer Service
                </span>
              </div>
            </div>

            <nav className="py-4">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => {
                  if (item.type === 'work-queue') {
                    return (
                      <li key="m-work-queue">
                        {renderWorkQueue({
                          compact: false,
                          onNavigate: () => setMobileMenuOpen(false),
                        })}
                      </li>
                    );
                  }
                  if (item.type === 'section') {
                    return (
                      <li key={`m-${item.key}`} className="pt-3 pb-1 px-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {item.label}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={`m-${item.to}-${item.label}`}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={linkClass}
                      >
                        <item.icon size={20} className="flex-shrink-0" />
                        <span className="ml-3">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
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
    </>
  );
};

export default CustomerServiceSidebar;
