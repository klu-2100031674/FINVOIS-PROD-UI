import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  Users,
  Upload,
  List,
  CalendarClock,
  BarChart3,
  Inbox,
  UserCheck,
  Star,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useSalesAuth } from '../../context/SalesAuthContext';
import { salesFollowUpsAPI, salesClientsAPI } from '../../services/salesService';

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

export default function SalesLayout() {
  const { user, logout, isManager, isExecutive } = useSalesAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [followUpBadge, setFollowUpBadge] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    if (isManager) {
      salesFollowUpsAPI.pendingCount().then((r) => setFollowUpBadge(r.data.count)).catch(() => null);
    }
    if (isExecutive) {
      salesFollowUpsAPI.overdueCount().then((r) => setFollowUpBadge(r.data.count)).catch(() => null);
      salesClientsAPI.availableCount().then((r) => setAvailableCount(r.data.count)).catch(() => null);
    }
  }, [isManager, isExecutive]);

  function handleLogout() {
    logout();
    navigate('/sales/login', { replace: true });
  }

  const managerNav: NavItem[] = [
    { to: '/sales/manager/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/sales/manager/executives', icon: <Users className="w-5 h-5" />, label: 'Executives' },
    { to: '/sales/manager/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload Customers' },
    { to: '/sales/manager/clients', icon: <List className="w-5 h-5" />, label: 'All Customers' },
    { to: '/sales/manager/follow-ups', icon: <CalendarClock className="w-5 h-5" />, label: 'Follow-Ups', badge: followUpBadge || undefined },
    { to: '/sales/manager/reports', icon: <BarChart3 className="w-5 h-5" />, label: 'Reports' },
  ];

  const executiveNav: NavItem[] = [
    { to: '/sales/executive/queue', icon: <Inbox className="w-5 h-5" />, label: 'Customer Queue', badge: availableCount || undefined },
    { to: '/sales/executive/clients', icon: <UserCheck className="w-5 h-5" />, label: 'My Customers' },
    { to: '/sales/executive/follow-ups', icon: <CalendarClock className="w-5 h-5" />, label: 'Follow-Ups', badge: followUpBadge || undefined },
    { to: '/sales/executive/stats', icon: <Star className="w-5 h-5" />, label: 'My Stats' },
  ];

  const navItems = isManager ? managerNav : executiveNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-900/30">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Sales Portal</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="bg-violet-500/80 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white/5 backdrop-blur-md border-r border-white/10 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-white/10 z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold text-sm">Sales Portal</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
