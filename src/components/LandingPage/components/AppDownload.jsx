import React from "react";
import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import landingData from "../../../data/landingData.json";
import MobileScreen1 from "../../../assets/mobile-show-case-screen1.png";
import MobileScreen2 from "../../../assets/Mobile-screen-2.png";

const AppDownload = () => {
  const { appDownload } = landingData;

  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/50 to-transparent"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-12 lg:p-16 relative z-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-manrope mb-6 leading-tight">
                {appDownload.title}
              </h2>
              <p className="text-xl text-gray-400 mb-10 font-inter leading-relaxed max-w-lg">
                {appDownload.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-manrope font-bold hover:bg-gray-100 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1">
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-inter text-gray-500 leading-tight">Download on the</div>
                    <div className="text-sm leading-tight">App Store</div>
                  </div>
                </button>
                <button className="px-6 py-3 bg-gray-800 text-white border border-gray-700 rounded-xl font-manrope font-bold hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 hover:-translate-y-1">
                  <Play className="w-6 h-6 fill-current" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-inter text-gray-400 leading-tight">GET IT ON</div>
                    <div className="text-sm leading-tight">Google Play</div>
                  </div>
                </button>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs text-white">
                      U{i + 1}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400 font-inter">
                  <strong className="text-white">5,000+</strong> beta testers
                </div>
              </div>
            </div>

            {/* App mockup with images */}
            <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center lg:justify-end">
              <motion.div
                initial={{ y: 50, opacity: 0, rotate: -5 }}
                whileInView={{ y: 0, opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 w-64 md:w-72"
              >
                <img
                  src={MobileScreen1}
                  alt="Finvois App Screen"
                  className="w-full h-auto drop-shadow-2xl rounded-[2.5rem] border-8 border-gray-800"
                />
              </motion.div>

              <motion.div
                initial={{ y: 100, opacity: 0, rotate: 5 }}
                whileInView={{ y: 40, opacity: 1, rotate: 10 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute right-10 top-0 z-0 w-64 md:w-72 hidden md:block opacity-60 grayscale-[50%]"
              >
                <img
                  src={MobileScreen2}
                  alt="Finvois App Screen Secondary"
                  className="w-full h-auto drop-shadow-2xl rounded-[2.5rem] border-8 border-gray-800"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownload;
