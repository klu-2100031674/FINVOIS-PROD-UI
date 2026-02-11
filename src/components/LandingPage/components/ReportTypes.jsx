import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, FileSpreadsheet, FileBarChart } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const iconMap = {
  "detailed": FileText,
  "summary": FileSpreadsheet,
  "visual": FileBarChart
};

const ReportTypes = () => {
  const { reportTypes } = landingData;

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

  return (
    <section className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-purple-600 font-bold mb-4 font-inter tracking-wide uppercase text-sm"
          >
            {reportTypes.subtitle}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-4 leading-tight"
          >
            {reportTypes.title}
          </motion.h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {reportTypes.reports.map((report, idx) => {
            // Map based on index to potential icons if not strictly defined, 
            // but for now we can just use generic icons or map by title keywords
            let Icon = FileText;
            if (report.title.toLowerCase().includes('excel')) Icon = FileSpreadsheet;
            if (report.title.toLowerCase().includes('detail')) Icon = FileBarChart;

            return (
              <motion.div
                key={idx}
                variants={item}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-100"
              >
                <div className="h-56 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 z-20"></div>

                  <div className="absolute top-4 right-4 z-30">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-manrope group-hover:text-purple-600 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-gray-600 font-inter mb-6 leading-relaxed">
                    {report.description}
                  </p>
                  <button className="flex items-center gap-2 text-purple-600 font-semibold font-manrope group-hover:gap-3 transition-all">
                    View Sample
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default ReportTypes;

