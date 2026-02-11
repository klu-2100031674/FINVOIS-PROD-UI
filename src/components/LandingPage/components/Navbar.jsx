import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import finvoisLogo from "../../../assets/finvois.png";
import landingData from "../../../data/landingData.json";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { navigation } = landingData;
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <img
                        src={finvoisLogo}
                        alt="Finvois Logo"
                        className="h-8 md:h-10 w-auto"
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navigation.links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                        <button
                            className="text-sm font-bold text-gray-900 hover:text-purple-600 transition-colors"
                            onClick={() => navigate(navigation.loginText.href)}
                        >
                            {navigation.loginText.text}
                        </button>
                        <button
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                            onClick={() => navigate(navigation.ctaText.href)}
                        >
                            {navigation.ctaText.text}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-gray-900 p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="px-6 py-8 space-y-4 flex flex-col">
                            {navigation.links.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.href}
                                    className="text-lg font-medium text-gray-900"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <hr className="border-gray-100 my-4" />
                            <button
                                className="text-lg font-medium text-gray-600 text-left"
                                onClick={() => navigate(navigation.loginText.href)}
                            >
                                {navigation.loginText.text}
                            </button>
                            <button
                                className="w-full px-5 py-3 bg-purple-600 text-white rounded-xl font-bold text-lg"
                                onClick={() => navigate(navigation.ctaText.href)}
                            >
                                {navigation.ctaText.text}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
