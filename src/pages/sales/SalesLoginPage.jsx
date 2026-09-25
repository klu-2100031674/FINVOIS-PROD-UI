import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useSalesAuth } from '../../context/SalesAuthContext';
import finvoisLogo from '@/assets/finvois.png';

const SalesLoginPage = () => {
  const { login } = useSalesAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'manager') {
        navigate('/crm/manager/dashboard', { replace: true });
      } else {
        navigate('/crm/executive/queue', { replace: true });
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Animated background blobs — same as /auth */}
      <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob" />
      <div className="absolute top-[-300px] left-1/3 w-[500px] h-[700px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute top-[-400px] right-[-100px] w-[500px] h-[700px] bg-yellow-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-4000" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto" />
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-['Manrope']">
                Log in to your account
              </h2>
              <p className="text-gray-600 font-['Inter'] mt-2">
                Welcome back! Please enter your details.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl mb-5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-['Inter']">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition font-['Inter']"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-['Inter']">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition font-['Inter']"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Manrope'] flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 font-['Inter']">
            Finvois CRM Portal &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesLoginPage;
