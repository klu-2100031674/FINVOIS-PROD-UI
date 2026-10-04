import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Award, Building2, FileCheck, Landmark, CheckCircle } from 'lucide-react';
import landingData from '../../../data/landingData.json';
import certificateImg from '../../../assets/certificate.jpeg';

const iconMap = {
  "ca-verified": Award,
  "gov-empanelled": Building2,
  "bank-appraisal": FileCheck,
  "ratan-tata": Landmark,
  "payments": Clock,
  "govt-validation": CheckCircle,
  "security": Shield
};

const WhyChooseUs = () => {
  const { whyChooseUs } = landingData;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -skew-x-12 translate-x-32 -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-manrope mb-6 leading-tight">
              Why MSME's choose <span className="text-purple-600">Finvois</span>?
            </h2>
            <p className="text-xl text-gray-600 font-inter mb-10 leading-relaxed">
              We combine AI efficiency with professional accuracy to deliver bank-ready reports that get approved faster.
            </p>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {whyChooseUs.map((feature, idx) => {
                const Icon = iconMap[feature.illustration] || Award;

                return (
                  <motion.div
                    key={idx}
                    variants={item}
                    className="flex gap-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        feature.color === 'blue' ? 'bg-purple-100 text-[#7e22ce]' :
                          'bg-orange-100 text-orange-600'
                      }`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${feature.color === 'purple' ? 'text-purple-600' :
                          feature.color === 'blue' ? 'text-[#7e22ce]' :
                            'text-orange-600'
                        }`}>
                        {feature.badge}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 font-manrope">
                        {feature.title}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 aspect-square flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeSlide === 0 ? (
                  <motion.div
                    key="security-slide"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full bg-gray-900 flex items-center justify-center p-12 relative"
                  >
                    {/* Abstract Grid visual representing data/security */}
                    <div className="grid grid-cols-6 gap-4 w-full h-full opacity-20">
                      {[...Array(36)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                          className="bg-white rounded-md w-full h-full"
                        />
                      ))}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/20">
                          <Shield className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-white font-manrope mb-2">Bank-Grade Security</h3>
                        <p className="text-gray-300 font-inter">Your data is encrypted and secure</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="certificate-slide"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full bg-white flex flex-col items-center justify-center p-4 relative"
                  >
                    <img
                      src={certificateImg}
                      alt="Certificate of Appreciation - Ratan Tata Innovation Hub"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-gray-900/85 backdrop-blur-md text-white text-xs md:text-sm p-3 rounded-xl text-center font-inter font-medium shadow-lg">
                      Certificate of Appreciation — Ratan Tata Innovation Hub
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dots navigation indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <button
                  onClick={() => setActiveSlide(0)}
                  className={`h-2.5 rounded-full transition-all ${activeSlide === 0 ? 'bg-white w-6' : 'bg-white/50 w-2.5 hover:bg-white/80'}`}
                  aria-label="Slide 1"
                />
                <button
                  onClick={() => setActiveSlide(1)}
                  className={`h-2.5 rounded-full transition-all ${activeSlide === 1 ? 'bg-white w-6' : 'bg-white/50 w-2.5 hover:bg-white/80'}`}
                  aria-label="Slide 2"
                />
              </div>

              {/* Hover indicator tag */}
              {isHovered && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/20 z-20">
                  Paused on Hover
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
