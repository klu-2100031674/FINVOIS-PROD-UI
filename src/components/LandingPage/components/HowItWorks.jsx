import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, FileEdit, Cpu, CreditCard, Download, CheckCircle2 } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const iconMap = [
  UserPlus,
  Search,
  FileEdit,
  Cpu,
  CreditCard,
  Download
];

const HowItWorks = () => {
  const { howItWorks } = landingData;

  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 mix-blend-multiply"></div>
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 mix-blend-multiply"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm font-inter tracking-wide"
          >
            PROCESS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-6 leading-tight"
          >
            {howItWorks.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 font-inter max-w-2xl mx-auto leading-relaxed"
          >
            {howItWorks.subtitle}
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-4 md:left-1/2 top-4 bottom-0 w-0.5 md:-translate-x-1/2 bg-gradient-to-b from-purple-200 via-purple-400 to-purple-200 hidden md:block"></div>

          {/* Mobile Line */}
          <div className="absolute left-8 top-4 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-purple-400 to-purple-200 md:hidden"></div>

          <div className="space-y-12 md:space-y-24">
            {howItWorks.steps.map((step, idx) => {
              const Icon = iconMap[idx] || CheckCircle2;
              const isEven = idx % 2 === 0;

              return (
                <div key={idx} className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row mx-auto`}>

                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-white bg-purple-600 shadow-lg z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>

                  {/* Content Card */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={`w-full md:w-[calc(50%-3rem)] ${isEven ? 'pl-20 md:pl-0 md:pr-12' : 'pl-20 md:pl-12'} relative`}
                  >
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-4xl font-bold text-gray-100 font-manrope group-hover:text-purple-50 transition-colors duration-300">
                          0{idx + 1}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 font-manrope mb-3 group-hover:text-purple-700 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 font-inter leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>

                  {/* Empty space for the other side on desktop */}
                  <div className="hidden md:block w-[calc(50%-3rem)]"></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-20 text-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold font-manrope hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-1 inline-flex items-center gap-2"
          >
            Start Your Journey
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

