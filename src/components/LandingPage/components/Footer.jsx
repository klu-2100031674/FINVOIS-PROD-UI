import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Facebook, Instagram, Shield } from 'lucide-react';
import landingData from '../../../data/landingData.json';
import finvoisLogo from '../../../assets/finvois.png';

const iconMap = {
  Twitter,
  Linkedin,
  LinkedIn: Linkedin,
  Facebook,
  Instagram
};

const Footer = () => {
  const { footer } = landingData;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 pt-24 pb-12 text-gray-400 font-inter border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <img
                src={finvoisLogo}
                alt="Finvois Logo"
                className="h-8 w-auto brightness-0 invert opacity-90"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed font-inter">
              {footer.description}
            </p>
            <div className="flex gap-4">
              {footer.social.map((platform, idx) => {
                const Icon = iconMap[platform];
                return (
                  <a
                    key={idx}
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-300"
                    aria-label={platform}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {footer.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-white font-bold font-manrope mb-6 text-lg">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-bold font-manrope mb-6 text-lg">
              Contact Us
            </h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <a href={`mailto:${footer.contact.email}`} className="hover:text-white transition-colors">
                  {footer.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <a href={`tel:${footer.contact.phone}`} className="hover:text-white transition-colors">
                  {footer.contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>{footer.contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            {footer.copyright.replace('2025', currentYear)}
          </p>

          <div className="flex gap-6 text-sm">
            {footer.legal.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Secure SSL Connection</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
