import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const iconMap = {
  FileText,
  TrendingUp,
  BarChart3
};

const AIShowcase = () => {
  const { aiShowcase } = landingData;

  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 border border-purple-100">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 font-inter">
                {aiShowcase.badge}
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-6 leading-tight">
              {aiShowcase.title}
            </h2>

            <p className="text-xl text-gray-600 font-inter mb-8 leading-relaxed">
              {aiShowcase.subtitle}
            </p>

            <div className="space-y-6">
              {aiShowcase.features.map((item, idx) => {
                const Icon = iconMap[item.icon];

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="w-12 h-12 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 font-manrope mb-1">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 font-inter text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden relative z-10">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-xs text-gray-400 font-mono">AI_Generator.exe</div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm font-medium text-purple-700 font-inter">
                    Analysing market trends & competitors...
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-gray-900 font-manrope">
                        Executive Summary
                      </h4>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Generated</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                      <div className="h-2 bg-gray-100 rounded-full w-11/12"></div>
                      <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 font-inter">Confidence Score</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 font-manrope">98%</span>
                        <span className="text-xs text-green-500 font-bold mb-1">+2.4%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '98%' }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="bg-green-500 h-1.5 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 font-inter">Estimated Time</div>
                      <div className="text-2xl font-bold text-gray-900 font-manrope">2m 14s</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '85%' }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="bg-blue-500 h-1.5 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 right-8 bg-white p-3 rounded-lg shadow-xl border border-gray-100 hidden md:block"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-700">Live Processing</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIShowcase;
