import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  BarChart2, Users, Upload, Database, Calendar, FileText,
  List, UserCheck, TrendingUp, LogOut, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import finvoisLogo from '@/assets/finvois.png';
import { useSalesAuth } from '../../context/SalesAuthContext';
import { getManagerDashboard, getMyFollowUps } from '../../services/salesService';

const SalesLayout = () => {
  const { user, logout, isManager, isExecutive } = useSalesAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({ pendingFollowUps: 0, queueCount: 0 });

  useEffect(() => {
    if (isManager) {
      getManagerDashboard()
        .then((res) => {
          const d = res.data;
          setBadges({ pendingFollowUps: d?.kpis?.pendingFollowUps || 0 });
        })
        .catch(() => {});
    }
    if (isExecutive) {
      getMyFollowUps({ status: 'pending' })
        .then((res) => {
          const items = res.data.followUps || res.data || [];
          const overdue = items.filter((f) => new Date(f.followUpDate) < new Date()).length;
          setBadges((b) => ({ ...b, overdueFollowUps: overdue }));
        })
        .catch(() => {});
    }
  }, [isManager, isExecutive]);

  const handleLogout = () => {
    logout();
    navigate('/crm/login', { replace: true });
  };

  const managerNav = [
    { to: '/crm/manager/dashboard', icon: BarChart2,  label: 'Dashboard' },
    { to: '/crm/manager/executives', icon: Users,      label: 'Executives' },
    { to: '/crm/manager/upload',     icon: Upload,     label: 'Upload Customers' },
    { to: '/crm/manager/clients',    icon: Database,   label: 'All Customers' },
    { to: '/crm/manager/follow-ups', icon: Calendar,   label: 'Follow-Ups', badge: badges.pendingFollowUps },
    { to: '/crm/manager/reports',    icon: FileText,   label: 'Reports' },
  ];

  const executiveNav = [
    { to: '/crm/executive/queue',      icon: List,       label: 'Customer Queue', badge: badges.queueCount },
    { to: '/crm/executive/clients',    icon: UserCheck,  label: 'My Customers' },
    { to: '/crm/executive/follow-ups', icon: Calendar,   label: 'Follow-Ups', badge: badges.overdueFollowUps },
    { to: '/crm/executive/stats',      icon: TrendingUp, label: 'My Stats' },
  ];

  const navItems = isManager ? managerNav : executiveNav;
  const roleBadgeLabel = isManager ? 'Manager' : 'Executive';

  const SidebarContent = () => (
    <>
      {/* User info */}
      <div className={`p-4 border-b border-gray-200 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${!sidebarOpen ? '' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-colors px-3 py-2.5 ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="ml-3 flex-1 text-sm">{item.label}</span>
                )}
                {sidebarOpen && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {sidebarOpen && <span className="ml-3 font-medium text-sm">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-2"
              >
                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto" />
            </div>
            <span className="text-sm text-gray-500 capitalize hidden sm:block">
              {roleBadgeLabel} Portal
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
          style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: '64px' }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto flex flex-col">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalesLayout;
