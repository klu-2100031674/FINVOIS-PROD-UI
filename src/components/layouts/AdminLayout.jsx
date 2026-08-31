/**
 * Admin Layout Component
 * Provides sidebar navigation for admin/company_admin users
 * Matching main dashboard UI theme
 */

import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import NotificationBell from '../common/NotificationBell';
import finvoisLogo from '../../assets/finvois.png';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { normalizeUserRole } from '../../utils/normalizeUserRole';
import AdminSidebar from '../../pages/admin/AdminSidebar';
import CompanyAdminSidebar from '../../pages/company/CompanyAdminSidebar';

const ADMIN_SIDEBAR_SCROLL_KEY = 'finvois-admin-sidebar-scroll';

const AdminLayout = ({ children, hideSidebar = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarNavRef = useRef(null);
  const mobileSidebarRef = useRef(null);

  // Each admin page mounts its own AdminLayout, so restore sidebar scroll after remount.
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SIDEBAR_SCROLL_KEY);
    if (saved == null) return;
    const scrollTop = Number(saved);
    if (sidebarNavRef.current) sidebarNavRef.current.scrollTop = scrollTop;
    if (mobileSidebarRef.current) mobileSidebarRef.current.scrollTop = scrollTop;
  }, [location.pathname]);

  // Main content should always open at the top when switching sidebar pages.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const persistSidebarScroll = useCallback((event) => {
    sessionStorage.setItem(ADMIN_SIDEBAR_SCROLL_KEY, String(event.currentTarget.scrollTop));
  }, []);

  const saveSidebarScrollBeforeNavigate = useCallback(() => {
    const nav = sidebarNavRef.current || mobileSidebarRef.current;
    if (nav) {
      sessionStorage.setItem(ADMIN_SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
    }
  }, []);

  const role = normalizeUserRole(user?.role);

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
        {role === 'company_admin' ? (
          <CompanyAdminSidebar
            sidebarOpen={sidebarOpen}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            hideSidebar={hideSidebar}
          />
        ) : (
          <AdminSidebar
            sidebarOpen={sidebarOpen}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            hideSidebar={hideSidebar}
            persistSidebarScroll={persistSidebarScroll}
            saveSidebarScrollBeforeNavigate={saveSidebarScrollBeforeNavigate}
            sidebarNavRef={sidebarNavRef}
            mobileSidebarRef={mobileSidebarRef}
          />
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
