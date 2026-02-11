import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const Testimonials = () => {
  const { testimonials } = landingData;

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
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 font-manrope mb-4">
            Trusted by Entrepreneurs
          </h2>
          <p className="text-xl text-gray-600 font-inter max-w-2xl mx-auto">
            See what our users have to say about their experience with Finvois.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              variants={item}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative transition-all duration-300 hover:shadow-lg"
            >
              <Quote className="w-10 h-10 text-purple-100 absolute top-6 right-6" />

              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 font-inter mb-8 leading-relaxed relative z-10">
                "{t.content}"
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold font-manrope text-lg shadow-md">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900 font-manrope">
                    {t.name}
                  </div>
                  <div className="text-sm text-gray-500 font-inter">
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
