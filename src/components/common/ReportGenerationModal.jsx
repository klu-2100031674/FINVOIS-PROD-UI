import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, FileText, Sparkles, BarChart3, PieChart } from "lucide-react";

// ... existing imports

const ReportGenerationModal = ({ isOpen }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    { title: "Initializing Report Generation", duration: 3000, icon: FileText },
    { title: "Collecting & Validating Data", duration: 4000, icon: CheckCircle },
    { title: "Processing Financial Models", duration: 5000, icon: BarChart3 },
    { title: "AI Market Analysis", duration: 6000, icon: Sparkles },
    { title: "Generating Visual Insights", duration: 4000, icon: PieChart },
    { title: "Finalizing Report Structure", duration: 3000, icon: FileText },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    let currentStep = 0;
    let accumulatedTime = 0;
    const totalTime = stages.reduce((acc, stage) => acc + stage.duration, 0);

    const timeouts = [];

    // Stage adavancement logic
    const runStages = () => {
      if (currentStep < stages.length) {
        timeouts.push(setTimeout(() => {
          if (currentStep < stages.length - 1) {
            setCurrentStage(prev => prev + 1);
          }
          currentStep++;
          runStages();
        }, stages[currentStep].duration));
      }
    };

    runStages();

    // Smooth progress bar logic
    const interval = setInterval(() => {
      accumulatedTime += 100;
      const newProgress = Math.min((accumulatedTime / totalTime) * 100, 99); // Cap at 99 until finished
      setProgress(newProgress);
    }, 100);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const CurrentIcon = stages[currentStage]?.icon || Loader2;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 relative border border-purple-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500"
              />
              <CurrentIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-manrope">Generating Your Report</h2>
            <p className="text-gray-500 mt-2 font-inter text-sm">Please wait while our AI analyzes your data</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gray-900"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isActive = index === currentStage;
              const isCompleted = index < currentStage;
              const isPending = index > currentStage;
              const Icon = stage.icon;

              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    opacity: isPending ? 0.4 : 1,
                    x: isActive ? 10 : 0
                  }}
                  className={`flex items-center gap-3 ${isActive ? 'bg-purple-50 p-3 rounded-xl border border-purple-100' : 'px-3 py-1'}`}
                >
                  <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-300
                                ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                                ${isActive ? 'border-purple-500' : ''}
                                ${isPending ? 'border-gray-200' : ''}
                            `}>
                    {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                    {isActive && <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
                  </div>

                  <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>
                    {stage.title}
                  </span>

                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-auto text-xs text-purple-600 font-bold bg-white px-2 py-1 rounded-full shadow-sm"
                    >
                      Processing...
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Note:</span> Large reports may take up to 2 minutes. Do not refresh.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportGenerationModal;
