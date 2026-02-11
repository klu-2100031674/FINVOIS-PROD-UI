import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
} from "lucide-react";
import Footer from "../LandingPage/components/Footer";

const EligibilityResult = () => {
  const location = useLocation();
  const { result } = location.state || {};

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Result Found</h1>
          <Link
            to="/schemes"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Go back to Scheme Finder
          </Link>
        </div>
      </div>
    );
  }

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
              to="/schemes"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-['Inter']"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Eligibility Checker
            </Link>
          </div>
        </div>
      </nav>

      {/* Result Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <FileText className="w-16 h-16 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
              {result.title}
            </h1>
            <p className="text-xl text-gray-600 font-['Inter']">
              Eligibility Assessment Result
            </p>
          </div>

          {/* Complete Response */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 font-['Manrope'] mb-8 text-center">
              Assessment Details
            </h2>
            <div className="text-gray-700 font-['Inter'] text-lg leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto">
              <div dangerouslySetInnerHTML={{ __html: result.htmlContent }} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-12">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-['Manrope'] font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Check Another Eligibility
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default EligibilityResult;