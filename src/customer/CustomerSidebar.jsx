import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import {
  LayoutDashboard,
  LogOut,
  FileStack,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const linkClass = ({ isActive }) =>
  `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
    isActive
      ? 'bg-purple-50 text-purple-700 font-medium'
      : 'text-gray-700 hover:bg-gray-100'
  }`;

const CustomerSidebar = ({
  sidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  hideSidebar = false,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customer/reports', icon: FileStack, label: 'My Reports' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ];

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
                  {user?.name || 'Customer'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Customer
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
                  end={item.to === '/customer/dashboard'}
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

      {/* Mobile Sidebar */}
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
                    {user?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  Customer
                </span>
              </div>
            </div>

            <nav className="py-4">
              <ul className="space-y-1 px-3">
                {navItems.map((item) => (
                  <li key={`m-${item.to}-${item.label}`}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/customer/dashboard'}
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
    </>
  );
};

export default CustomerSidebar;
