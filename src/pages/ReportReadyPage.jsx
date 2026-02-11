import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/common';
import { Download, CheckCircle, ArrowRight, Home, FileCheck, Mail, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const ReportReadyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { report_id } = location.state || {};

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (!report_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 font-manrope">Access Denied</h2>
          <p className="text-gray-600 mb-6 font-inter text-sm">No active report session found. Please try generating a new report.</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full justify-center bg-gray-900 hover:bg-gray-800 text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative z-10"
      >
        <div className="grid md:grid-cols-2">
          {/* Left Column: Success & Actions */}
          <div className="p-10 flex flex-col justify-center text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100 shadow-sm mx-auto md:mx-0"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3 font-manrope">Report Submitted!</h1>
            <p className="text-gray-500 text-lg mb-8 font-inter">
              Your report <span className="font-semibold text-gray-900">#{report_id}</span> has been sent for CA validation.
            </p>

            <div className="flex flex-col gap-3 mt-auto">
              <Button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all w-full justify-center"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={() => navigate('/reports')}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all w-full flex items-center justify-center gap-2"
              >
                View All Reports
              </button>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="p-10 bg-gray-50 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              What to expect
            </h3>

            <div className="space-y-8 relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-2 bottom-10 w-0.5 bg-gray-200"></div>

              {/* Step 1 */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4 relative"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center z-10 shrink-0 border border-gray-100 ring-4 ring-gray-50 shadow-sm">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">CA Validation</h4>
                  <p className="text-xs text-gray-500 mt-1">Our expert CAs verify your data for 100% bank compliance.</p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 relative"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center z-10 shrink-0 border border-gray-100 ring-4 ring-gray-50 shadow-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Email Notification</h4>
                  <p className="text-xs text-gray-500 mt-1">You receive the final PDF via email within 24 hours.</p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 relative"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center z-10 shrink-0 border border-gray-100 ring-4 ring-gray-50 shadow-sm">
                  <Download className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Download & Search</h4>
                  <p className="text-xs text-gray-500 mt-1">Your report will be available in the dashboard automatically.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportReadyPage;