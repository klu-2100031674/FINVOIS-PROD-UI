import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import finvoisLogo from "../../../assets/finvois.png";
import landingData from "../../../data/landingData.json";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [desktopDropdownIdx, setDesktopDropdownIdx] = useState(null);
    const [mobileDropdownIdx, setMobileDropdownIdx] = useState(null);
    const { navigation } = landingData;
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (location.pathname === "/" && location.hash) {
            const sectionId = location.hash;
            const timer = setTimeout(() => {
                const sectionElement = document.querySelector(sectionId);
                if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [location.pathname, location.hash]);

    useEffect(() => {
        setDesktopDropdownIdx(null);
        setMobileDropdownIdx(null);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (desktopDropdownIdx === null) return undefined;
        const onDocMouseDown = (e) => {
            if (!e.target.closest("[data-navbar-dropdown-root]")) {
                setDesktopDropdownIdx(null);
            }
        };
        const onKey = (e) => {
            if (e.key === "Escape") setDesktopDropdownIdx(null);
        };
        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [desktopDropdownIdx]);

    const handleNavLinkClick = (href) => {
        setMobileMenuOpen(false);

        if (href.startsWith("#")) {
            if (location.pathname !== "/") {
                navigate(`/${href}`);
                return;
            }

            const sectionElement = document.querySelector(href);
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
                window.history.replaceState(null, "", href);
                return;
            }

            navigate(`/${href}`);
            return;
        }

        navigate(href);
    };

    const closeDesktopDropdown = () => setDesktopDropdownIdx(null);

    const renderNavEntry = (link, idx, variant) => {
        const isDesktop = variant === "desktop";
        if (link.dropdown?.length) {
            if (isDesktop) {
                const open = desktopDropdownIdx === idx;
                return (
                    <div
                        key={idx}
                        className="relative"
                        data-navbar-dropdown-root
                    >
                        <button
                            type="button"
                            aria-expanded={open}
                            aria-haspopup="true"
                            onClick={() =>
                                setDesktopDropdownIdx((cur) => (cur === idx ? null : idx))
                            }
                            className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
                        >
                            {link.label}
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                                aria-hidden
                            />
                        </button>
                        {open && (
                            <div
                                className="absolute left-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg"
                                role="menu"
                            >
                                {link.dropdown.map((item, subIdx) => (
                                    <button
                                        key={subIdx}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            navigate(item.href);
                                            closeDesktopDropdown();
                                        }}
                                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            const mobileOpen = mobileDropdownIdx === idx;
            return (
                <div key={idx}>
                    <button
                        type="button"
                        className="text-lg font-medium text-gray-900 w-full text-left inline-flex items-center justify-between gap-2"
                        onClick={() =>
                            setMobileDropdownIdx((cur) => (cur === idx ? null : idx))
                        }
                        aria-expanded={mobileOpen}
                    >
                        {link.label}
                        <ChevronDown
                            className={`w-5 h-5 shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
                            aria-hidden
                        />
                    </button>
                    {mobileOpen && (
                        <div className="pl-4 mt-3 space-y-2 border-l-2 border-purple-100">
                            {link.dropdown.map((item, subIdx) => (
                                <button
                                    key={subIdx}
                                    type="button"
                                    className="block w-full text-left text-base font-medium text-gray-700 py-2"
                                    onClick={() => {
                                        navigate(item.href);
                                        setMobileMenuOpen(false);
                                        setMobileDropdownIdx(null);
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        const href = link.href;
        if (isDesktop) {
            return (
                <button
                    key={idx}
                    type="button"
                    onClick={() => handleNavLinkClick(href)}
                    className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
                >
                    {link.label}
                </button>
            );
        }

        return (
            <button
                key={idx}
                type="button"
                onClick={() => handleNavLinkClick(href)}
                className="text-lg font-medium text-gray-900 text-left"
            >
                {link.label}
            </button>
        );
    };

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
                    {navigation.links.map((link, idx) =>
                        renderNavEntry(link, idx, "desktop"),
                    )}
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
                            {navigation.links.map((link, idx) =>
                                renderNavEntry(link, idx, "mobile"),
                            )}
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
