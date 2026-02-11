import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, ArrowLeft } from 'lucide-react';
import faqData from '../../data/FAQ.json';
import Footer from '../LandingPage/components/Footer';

const FAQ = () => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const { title, subtitle, faqs } = faqData;

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 font-['Manrope']">
                Finvois
              </span>
            </Link>
            
            <Link 
              to="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-['Inter']"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* FAQ Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
              {title}
            </h1>
            <p className="text-xl text-gray-600 font-['Inter']">
              {subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-bold text-gray-900 font-['Manrope'] pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      activeFAQ === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    activeFAQ === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 font-['Inter'] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
