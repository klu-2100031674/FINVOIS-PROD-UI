import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks';
import api from '@/api/apiClient';

/**
 * Email "Follow Lead" lands here.
 * Marks the lead opened for the assignee, then redirects to the request detail.
 */
const MsmeServiceFollowPage = () => {
  const { token } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Opening lead…');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMessage('Invalid follow link.');
        return;
      }
      if (!isAuthenticated) {
        navigate('/auth', {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }
      try {
        await api.post(`/msme-service/follow/${token}`);
        toast.success('Lead opened');
        navigate('/msme-service/requests', { replace: true });
      } catch (err) {
        const msg = typeof err === 'string' ? err : err?.message || 'Failed to follow lead';
        setMessage(msg);
        toast.error(msg);
      }
    };
    run();
  }, [token, isAuthenticated, user, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default MsmeServiceFollowPage;
