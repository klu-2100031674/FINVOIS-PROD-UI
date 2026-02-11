import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const CTA = () => {
  const { cta } = landingData;
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-900 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
        {/* Animated background particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.1, y: 0 }}
            animate={{
              y: [0, -1000],
              opacity: [0.1, 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 20,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: '110%'
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/10"
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium text-white font-inter">
            Start AI Generation Now
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-manrope mb-6 leading-tight"
        >
          {cta.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-300 font-inter mb-10 max-w-2xl mx-auto"
        >
          {cta.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <button
            onClick={() => navigate(cta.primaryLink)}
            className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-manrope font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2 min-w-[200px] justify-center"
          >
            {cta.primaryCTA}
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(cta.secondaryLink)}
            className="px-8 py-4 bg-transparent border border-gray-600 hover:border-white hover:bg-white/5 text-white rounded-xl font-manrope font-semibold text-lg transition-all duration-300 flex items-center gap-2 min-w-[200px] justify-center"
          >
            {cta.secondaryCTA}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-inter text-gray-400"
        >
          {cta.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
