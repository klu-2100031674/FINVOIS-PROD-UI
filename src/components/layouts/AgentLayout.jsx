/**
 * Agent Layout Component
 * Provides sidebar navigation for agent users
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import finvoisLogo from '../../assets/finvois.png';
import {
  HomeIcon,
  DocumentTextIcon,
  UsersIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AgentLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const navigation = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: HomeIcon, tab: 'dashboard' },
    { name: 'My Reports', href: '/agent/reports', icon: DocumentTextIcon, tab: 'reports' },
    { name: 'Referred Users', href: '/agent/referrals', icon: UsersIcon, tab: 'referrals' },
    { name: 'Commissions', href: '/agent/commissions', icon: CurrencyDollarIcon, tab: 'commissions' },
    { name: 'Withdrawals', href: '/agent/withdrawals', icon: BanknotesIcon, tab: 'withdrawals' },
    { name: 'Referral Link', href: '/agent/referral-link', icon: LinkIcon, tab: 'referral-link' },
    { name: 'Profile', href: '/agent/profile', icon: UserCircleIcon, tab: 'profile' },
    { name: 'Generate Reports', href: '/agent/generate', icon: ChartBarIcon, tab: 'generate' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'
          } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen fixed top-0 left-0`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <img
              src={finvoisLogo}
              alt="Finvois Logo"
              className="h-8 w-auto"
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Referral Code Banner */}
        {sidebarOpen && user?.referral_code && (
          <div className="mx-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-600 font-medium mb-1">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-700">{user.referral_code}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.referral_code);
                  toast.success('Referral code copied!');
                }}
                className="text-green-600 hover:text-green-700"
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === item.tab || isActive
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">Agent</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!sidebarOpen && 'justify-center'
                }`}
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside >

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        {children}
      </main>
    </div >
  );
};

export default AgentLayout;
