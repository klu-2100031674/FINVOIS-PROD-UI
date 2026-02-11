import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, BarChart } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const FinancialProjections = () => {
  const { financialProjections } = landingData;

  // Calculate max values for charts to normalize bars
  const maxRevenue = Math.max(...financialProjections.data.map(d => parseInt(d.revenue.replace(/,/g, ''))));

  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-800 relative"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <TrendingUp className="w-24 h-24 text-purple-500" />
              </div>

              <div className="mb-8">
                <h3 className="text-white font-bold font-manrope text-lg mb-6 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-purple-400" />
                  Revenue Growth Projection
                </h3>

                <div className="h-64 flex items-end gap-4">
                  {financialProjections.data.map((item, idx) => {
                    const height = (parseInt(item.revenue.replace(/,/g, '')) / maxRevenue) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative h-full flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${height}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="w-full bg-gradient-to-t from-purple-900 to-purple-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity relative"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ₹{item.revenue}
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-xs text-gray-400 font-inter">Yr {item.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-xs font-inter mb-1">Break Even</div>
                  <div className="text-xl font-bold text-white font-manrope">{financialProjections.breakEven}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="text-gray-400 text-xs font-inter mb-1">ROI (5 Years)</div>
                  <div className="text-xl font-bold text-green-400 font-manrope">342%</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6 text-purple-700 font-medium text-sm font-inter">
                <PieChart className="w-4 h-4" />
                {financialProjections.badge}
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-6 leading-tight">
                {financialProjections.title}
              </h2>

              <p className="text-xl text-gray-600 font-inter mb-8 leading-relaxed">
                {financialProjections.subtitle}
              </p>

              <ul className="space-y-4">
                {financialProjections.benefits.map((benefit, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3 text-gray-700 font-inter"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialProjections;
