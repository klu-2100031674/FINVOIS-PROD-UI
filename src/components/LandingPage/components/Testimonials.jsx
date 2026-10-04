import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import landingData from '../../../data/landingData.json';

const Testimonials = () => {
  const [list, setList] = useState(landingData.testimonials || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll every 2 seconds if > 3 reviews
  useEffect(() => {
    if (list.length <= 3) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % list.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [list.length]);

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

  // Determine which reviews to show
  const visibleReviews = list.length <= 3
    ? list
    : Array.from({ length: 3 }, (_, i) => list[(currentIndex + i) % list.length]);

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
          {visibleReviews.map((t, idx) => {
            const key = t._id || t.id || `${t.name}-${idx}-${currentIndex}`;
            const commentText = t.comment || t.content || '';
            const ratingVal = Number(t.rating) || 5;

            return (
              <motion.div
                key={key}
                variants={item}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
              >
                <Quote className="w-10 h-10 text-purple-100 absolute top-6 right-6" />

                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(ratingVal)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>

                  <p className="text-gray-700 font-inter mb-8 leading-relaxed relative z-10">
                    "{commentText}"
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold font-manrope text-lg shadow-md">
                    {t.avatar || (t.name ? t.name.substring(0, 2).toUpperCase() : 'RK')}
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
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
