/**
 * Service Layout — minimal layout with header for public service pages
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../LandingPage/components/Navbar';
import finvoisLogo from '../../assets/finvois.png';

const ServiceLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <Navbar />

      {/* Main Content */}
      <main className="pt-20">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={finvoisLogo} alt="Finvois" className="h-6 w-auto" />
              <span className="text-gray-500 text-sm">© 2024 Finvois. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServiceLayout;
