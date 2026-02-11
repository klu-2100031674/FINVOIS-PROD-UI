import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import pricingData from '../../data/pricingData.json';
import Footer from '../LandingPage/components/Footer';

const Pricing = () => {
  const { title, subtitle, addOnsText, plans } = pricingData;

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

      {/* Pricing Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
              {title}
            </h1>
            <p className="text-xl text-gray-600 font-['Inter']">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-2xl border-2 \${
                  plan.popular ? 'border-purple-600 shadow-2xl scale-105' : 'border-gray-200'
                } p-8 hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-bold rounded-full font-['Manrope']">
                    MOST POPULAR
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full font-['Manrope']">
                    {plan.savings}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-['Manrope']">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    {plan.price !== "Custom" && <span className="text-gray-500 text-xl">₹</span>}
                    <span className="text-5xl font-bold text-gray-900 font-['Manrope']">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-gray-600 font-['Inter']">{plan.period}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-['Inter']">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-lg font-['Manrope'] font-semibold text-lg transition-all duration-300 ${plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 font-['Inter']">
              {addOnsText}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;


