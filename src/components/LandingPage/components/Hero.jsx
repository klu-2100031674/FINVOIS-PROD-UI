import React, { useRef } from 'react';
import { ArrowRight, Play, CheckCircle, Sparkles, FileText, Clock, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import landingData from '../../../data/landingData.json';

const iconMap = {
  FileText: FileText,
  CheckCircle: CheckCircle,
  Clock: Clock,
  TrendingUp: TrendingUp
};

const colorMap = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' }
};

const Hero = () => {
  const { hero } = landingData;
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-100 rounded-full mb-8 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 font-inter">
              {hero.badge}
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 font-manrope leading-[1.15] mb-6 max-w-5xl mx-auto tracking-tight">
            {hero.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{hero.titleHighlight}</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto font-inter leading-relaxed"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <button
              onClick={() => navigate(hero.primaryLink)}
              className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-manrope font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2 group"
            >
              {hero.primaryCTA}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate(hero.secondaryLink)}
              className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 hover:bg-white text-gray-900 rounded-xl font-manrope font-semibold text-lg transition-all duration-300 flex items-center gap-2 hover:shadow-md"
            >
              <Play className="w-5 h-5" />
              {hero.secondaryCTA}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-inter text-gray-600 bg-white/60 backdrop-blur-sm p-4 rounded-2xl mx-auto inline-flex border border-white/50 shadow-sm"
          >
            {hero.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero Mockup */}
        <motion.div
          style={{ y, opacity }}
          className="relative max-w-6xl mx-auto mt-8 perspective-1000"
        >
          <motion.div
            initial={{ rotateX: 20, opacity: 0, y: 100 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl shadow-purple-200/50 border border-gray-200/60 overflow-hidden ring-1 ring-gray-900/5"
          >
            {/* Window Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full border border-red-500/20"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-500/20"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full border border-green-500/20"></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md border border-gray-200 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-purple-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span className="text-xs text-gray-500 font-inter font-medium">
                  Finvois Dashboard
                </span>
              </div>
              <div className="w-16"></div> {/* Spacer for alignment */}
            </div>

            <div className="p-8 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/80 min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {hero.stats.map((stat, idx) => {
                  const Icon = iconMap[stat.icon];
                  const colors = colorMap[stat.color] || colorMap.blue;

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center border ${colors.border}`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-inter font-medium uppercase tracking-wider mb-1">
                            {stat.label}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 font-manrope">
                            {stat.value}
                          </div>
                        </div>
                      </div>

                      {/* Fake mini chart */}
                      <div className="h-10 flex items-end gap-1 mt-2">
                        {[40, 70, 45, 90, 60, 85, 95].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`flex-1 rounded-sm ${i === 6 ? 'bg-purple-500' : 'bg-gray-100'}`}
                          ></div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-32 h-32 text-purple-600" />
                </div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="tex-lg font-bold text-gray-900 font-manrope">AI Generation in Progress</h3>
                    <span className="text-sm text-gray-500 font-inter">
                      Analyzing market trends and financial data...
                    </span>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>SWOT Analysis</span>
                      <span>85%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Market Research</span>
                      <span>60%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "60%" }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Financial Projections</span>
                      <span>42%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "42%" }}
                        transition={{ duration: 1.5, delay: 1.4 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
