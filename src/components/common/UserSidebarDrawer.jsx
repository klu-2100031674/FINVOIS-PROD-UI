import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FileStack,
  FileText,
  LayoutDashboard,
  LogOut,
  X,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { normalizeUserRole } from '../../utils/normalizeUserRole';

/**
 * Client right drawer — visual pattern aligned with AdminLayout sidebar
 * (profile block, purple active NavLinks, border + logout footer).
 */
const UserSidebarDrawer = ({
  isOpen,
  onClose,
  myReportsPath = '/reports',
  onLogout,
  onGenerateReport,
  /** Optional override when auth user name is not yet loaded */
  userName: userNameProp,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const displayName = userNameProp || user?.name || 'User';
  const displayEmail = user?.email || '';

  const role = normalizeUserRole(user?.role);
  const dashboardHomePath = (() => {
    if (role === 'agent') return '/agent/dashboard';
    if (role === 'company_user') return '/company/user/dashboard';
    if (role === 'company_admin') return '/company/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/dashboard';
  })();

  const profileNavPath = (() => {
    if (role === 'agent') return '/agent/profile';
    if (role === 'admin') return '/admin/profile';
    if (role === 'company_admin') return '/company/profile';
    if (role === 'company_user') return '/company/user/profile';
    return '/profile';
  })();

  const roleBadge = (() => {
    if (role === 'admin') return 'Super Admin';
    if (role === 'company_admin') return 'Company Admin';
    if (role === 'company_user') return 'Company user';
    if (role === 'agent') return 'Channel partner';
    return 'User';
  })();

  const linkClass = ({ isActive }) =>
    `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-purple-50 text-purple-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  const actionClass =
    'flex items-center w-full px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 text-left';

  const onDashboard = location.pathname === dashboardHomePath;
  const onProfile =
    location.pathname === '/profile' ||
    location.pathname === '/agent/profile' ||
    location.pathname === '/admin/profile' ||
    location.pathname === '/company/profile' ||
    location.pathname === '/company/user/profile';
  const onDrafts = location.pathname === '/drafts';
  const onReports = location.pathname === myReportsPath;
  /** Match legacy drawer: only hide on end-user dashboard, not `/agent/dashboard`. */
  const hideGenerateReport =
    location.pathname === '/dashboard' || location.pathname === '/company/user/dashboard';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-label="Close sidebar backdrop"
      />

      <aside className="absolute right-0 top-0 h-full w-64 max-w-[min(16rem,100vw)] bg-white border-l border-gray-200 flex flex-col shadow-xl">
        <div className="p-4 border-b border-gray-200 flex items-start gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              {displayEmail ? (
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {roleBadge}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {!onDashboard && (
              <li>
                <NavLink
                  to={dashboardHomePath}
                  onClick={onClose}
                  className={linkClass}
                >
                  <LayoutDashboard size={20} className="flex-shrink-0" />
                  <span className="ml-3">Dashboard</span>
                </NavLink>
              </li>
            )}

            {role === 'admin' && (
              <li>
                <NavLink
                  to="/admin/dashboard"
                  onClick={onClose}
                  className={linkClass}
                >
                  <ShieldCheck size={20} className="flex-shrink-0" />
                  <span className="ml-3">Admin portal</span>
                </NavLink>
              </li>
            )}

            {!onProfile && (
              <li>
                <NavLink
                  to={profileNavPath}
                  onClick={onClose}
                  className={linkClass}
                >
                  <User size={20} className="flex-shrink-0" />
                  <span className="ml-3">My Profile</span>
                </NavLink>
              </li>
            )}

            {!onDrafts && (
              <li>
                <NavLink to="/drafts" onClick={onClose} className={linkClass}>
                  <FileText size={20} className="flex-shrink-0" />
                  <span className="ml-3">Drafts</span>
                </NavLink>
              </li>
            )}

            {!hideGenerateReport && onGenerateReport && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGenerateReport();
                  }}
                  className={actionClass}
                >
                  <Zap size={20} className="flex-shrink-0" />
                  <span className="ml-3 font-medium">Generate Report</span>
                </button>
              </li>
            )}

            {!onReports && (
              <li>
                <NavLink
                  to={myReportsPath}
                  onClick={onClose}
                  className={linkClass}
                >
                  <FileStack size={20} className="flex-shrink-0" />
                  <span className="ml-3">My Reports</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default UserSidebarDrawer;
