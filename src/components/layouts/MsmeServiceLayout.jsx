import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Inbox } from 'lucide-react';
import { useAuth } from '@/hooks';
import finvoisLogo from '@/assets/finvois.png';
import MsmeSetupModal, { clearMsmeSetupDismissed } from '@/pages/msmeService/MsmeSetupModal';

const MsmeServiceLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!user?.must_change_password) {
      setShowSetup(false);
      return;
    }
    try {
      if (sessionStorage.getItem('msme_setup_dismissed') === '1') {
        setShowSetup(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setShowSetup(true);
  }, [user?.must_change_password, user?._id]);

  const handleLogout = async () => {
    clearMsmeSetupDismissed();
    await logout();
    navigate('/auth', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3.5 py-2 text-sm rounded-xl transition-colors ${
      isActive
        ? 'bg-purple-700 text-white font-semibold shadow-sm'
        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f3e8ff_0%,_#f8fafc_42%,_#eef2ff_100%)]">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img src={finvoisLogo} alt="Finvois" className="h-8 w-auto shrink-0" />
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-700">
                MSME Service
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[14rem]">{user?.name || user?.email}</p>
            </div>
            <nav className="flex items-center gap-1 rounded-2xl bg-purple-50/80 p-1">
              <NavLink to="/msme-service/requests" className={linkClass}>
                <Inbox className="h-4 w-4" />
                Requests
              </NavLink>
              <NavLink to="/msme-service/profile" className={linkClass}>
                <User className="h-4 w-4" />
                Profile
              </NavLink>
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      {showSetup ? (
        <MsmeSetupModal user={user} onDismissed={() => setShowSetup(false)} />
      ) : null}
    </div>
  );
};

export default MsmeServiceLayout;
