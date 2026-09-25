import React from 'react';
import { Phone } from 'lucide-react';
import Navbar from '../LandingPage/components/Navbar';
import Footer from '../LandingPage/components/Footer';

const PRICING_CONTACT = '+91 96182 21011';
const PRICING_TEL = '+919618221011';
const PRICING_WHATSAPP = 'https://wa.me/919618221011';

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-purple-100 selection:text-purple-900 font-inter">
      <Navbar />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-['Manrope'] mb-3">
            Talk to us for a Pricing
          </h1>
          <p className="text-gray-600 font-['Inter'] mb-8 leading-relaxed">
            Call or WhatsApp our team with your loan type and project details. We will share
            pricing options suited to your need — usually within the same business day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`tel:${PRICING_TEL}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-['Manrope'] font-semibold text-lg transition-all duration-300 shadow-lg"
            >
              <Phone className="w-5 h-5" />
              {PRICING_CONTACT}
            </a>
            <a
              href={PRICING_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-xl font-['Manrope'] font-semibold text-lg transition-all duration-300 shadow-lg"
            >
              <WhatsAppIcon className="w-5 h-5" />
              WhatsApp
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-500 font-['Inter']">
            Available on weekdays
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
