import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import landingData from "../../data/landingData.json";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import AIShowcase from "./components/AIShowcase";
import FinancialProjections from "./components/FinancialProjections";
import WhyChooseUs from "./components/WhyChooseUs";
import ReportTypes from "./components/ReportTypes";
import AppDownload from "./components/AppDownload";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import useAuth from "../../hooks/useAuth";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { navigation, trustedBy } = landingData;
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Clear all storage and Redux state when landing page loads
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    const clearAllCookies = () => {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    };
    clearAllCookies();
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-purple-100 selection:text-purple-900 font-inter">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Trusted By Section */}
      <section className="py-10 px-6 border-y border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-gray-400 mb-8 uppercase">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {trustedBy.map((brand, idx) => (
              <div
                key={idx}
                className="text-xl md:text-2xl font-bold text-gray-500 font-manrope flex items-center gap-2"
              >
                {/* Fallback logos with text if images aren't available */}
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <AIShowcase />
      <FinancialProjections />
      <WhyChooseUs />
      <ReportTypes />
      <AppDownload />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
