import React from 'react';
import { Sparkles, BarChart3, Search, FileCheck, Wallet, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import landingData from '../../../data/landingData.json';

const iconMap = {
  Sparkles,
  BarChart3,
  Search,
  FileCheck,
  Wallet,
  Users
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Features = () => {
  const { features } = landingData;

  return (
    <section id="features" className="py-24 px-6 bg-white relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-40 right-0 w-96 h-96 bg-purple-50/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-40 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-4"
          >
            {features.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 font-inter max-w-2xl mx-auto"
          >
            {features.subtitle}
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.items.map((feature, idx) => {
            const Icon = iconMap[feature.icon];

            return (
              <motion.div
                key={idx}
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-manrope">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-inter leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
