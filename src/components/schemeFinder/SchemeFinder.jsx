import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Award,
  Building2,
  Wallet,
  Users,
  ArrowLeft,
  User,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-react";
import schemeData from "../../data/schemeData.json";
import { schemeEligibilityAPI } from "../../api/endpoints";
import Footer from "../LandingPage/components/Footer";

const iconMap = {
  Award,
  Building2,
  Wallet,
  Users,
};

const colorMap = {
  purple: {
    bg: "from-purple-50 to-white",
    border: "border-purple-200",
    icon: "bg-purple-600",
  },
  blue: {
    bg: "from-blue-50 to-white",
    border: "border-blue-200",
    icon: "bg-blue-600",
  },
  green: {
    bg: "from-green-50 to-white",
    border: "border-green-200",
    icon: "bg-green-600",
  },
  orange: {
    bg: "from-orange-50 to-white",
    border: "border-orange-200",
    icon: "bg-orange-600",
  },
};

const SchemeFinder = () => {
  const { title, subtitle, filters, ctaText, schemes } = schemeData;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessOrganisation: "",
    businessName: "",
    sector: filters.sector.options[0],
    placeOfUnit: "",
    lineOfActivity: "",
    primaryContact: "",
    casteCategory: "",
    businessEntityType: "",
    incentiveScheme: "",
    investment: filters.investment.options[0],
    state: filters.state.options[0],
    // New fields for AP IDP 4.0
    gender: "",
    serviceEquipment: "",
    civilWorks: "",
    erectionCommissioning: "",
    workingCapital: "",
    totalProjectCost: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Submitting eligibility form data:', formData);
      const data = await schemeEligibilityAPI.checkEligibility(formData);
      navigate('/eligibility-result', { state: { result: data } });
    } catch (error) {
      console.error('Error:', error);
      alert('Error checking eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Scheme Finder Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Manrope'] mb-4">
              Eligibility Checker
            </h1>
            <p className="text-xl text-gray-600 font-['Inter']">{subtitle}</p>
          </div>

          {/* Eligibility Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 space-y-6"
          >
            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email and Phone - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Nature of Business Organisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Nature of Business Organisation
              </label>
              <div className="relative">
                <select
                  name="businessOrganisation"
                  value={formData.businessOrganisation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Select business type</option>
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llp">
                    Limited Liability Partnership (LLP)
                  </option>
                  <option value="private_limited">
                    Private Limited Company
                  </option>
                  <option value="public_limited">Public Limited Company</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Firm/Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Firm/Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Enter your business name"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Sector and Place of Unit - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Sector
                </label>
                <div className="relative">
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select sector</option>
                    {filters.sector.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Place of Unit
                </label>
                <div className="relative">
                  <select
                    name="placeOfUnit"
                    value={formData.placeOfUnit}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select location</option>
                    <option value="Urban(Other than Panchayat)">Urban(Other than Panchayat)</option>
                    <option value="Rural(Panchayat)">Rural(Panchayat)</option>
                    <option value="semi-Urban(Other than Panchayat)">Semi-Urban(Other than Panchayat)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Line of Activity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Line of Activity
              </label>
              <textarea
                name="lineOfActivity"
                value={formData.lineOfActivity}
                onChange={handleInputChange}
                placeholder="e.g., Manufacturing of chilly products"
                rows="3"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Proprietor/Primary Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Proprietor/Primary Contact Name
              </label>
              <input
                type="text"
                name="primaryContact"
                value={formData.primaryContact}
                onChange={handleInputChange}
                placeholder="Enter name of primary contact"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Caste Category and Type of Business Entity - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Caste Category
                </label>
                <div className="relative">
                  <select
                    name="casteCategory"
                    value={formData.casteCategory}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select category</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Type of Business Entity
                </label>
                <div className="relative">
                  <select
                    name="businessEntityType"
                    value={formData.businessEntityType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="service">Service</option>
                    <option value="trading">Trading</option>
                    <option value="retail">Retail</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Investment and State - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Investment
                </label>
                <div className="relative">
                  <select
                    name="investment"
                    value={formData.investment}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    {filters.investment.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  State
                </label>
                <div className="relative">
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    {filters.state.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Check Incentive Eligibility Under */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Check Incentive Eligibility Under
              </label>
              <div className="relative">
                <select
                  name="incentiveScheme"
                  value={formData.incentiveScheme}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Select scheme</option>
                  <option value="pmegp">
                    PMEGP (Prime Minister's Employment Generation Programme)
                  </option>
                  <option value="mudra">Mudra Loan</option>
                  <option value="startup_india">Startup India</option>
                  <option value="standup_india">Stand-Up India</option>
                  <option value="cgtmse">
                    CGTMSE (Credit Guarantee Scheme)
                  </option>
                  <option value="msme">MSME Schemes</option>
                  <option value="sidbi">SIDBI Schemes</option>
                  <option value="ap_idp_4_0">AP IDP 4.0</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Gender
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Project Cost Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Service Equipment (Lacs)
                </label>
                <input
                  type="number"
                  name="serviceEquipment"
                  value={formData.serviceEquipment}
                  onChange={handleInputChange}
                  placeholder="56.89"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Civil Works (Lacs)
                </label>
                <input
                  type="number"
                  name="civilWorks"
                  value={formData.civilWorks}
                  onChange={handleInputChange}
                  placeholder="10"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Erection and Commissioning (Lacs)
                </label>
                <input
                  type="number"
                  name="erectionCommissioning"
                  value={formData.erectionCommissioning}
                  onChange={handleInputChange}
                  placeholder="1.50"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Working Capital (Lacs)
                </label>
                <input
                  type="number"
                  name="workingCapital"
                  value={formData.workingCapital}
                  onChange={handleInputChange}
                  placeholder="10"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Total Project Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Total Project Cost (Lacs)
              </label>
              <input
                type="number"
                name="totalProjectCost"
                value={formData.totalProjectCost}
                onChange={handleInputChange}
                placeholder="78.39"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-['Inter'] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-['Manrope'] font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Checking...' : 'Check My Eligibility'}
            </button>
          </form>
        </div>
      </section>

      {/* Schemes Grid Section */}
      <section className="pb-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-['Manrope'] mb-4">
              Available Schemes
            </h2>
            <p className="text-lg text-gray-600 font-['Inter']">
              Explore government schemes and funding opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schemes.map((scheme, idx) => {
              const Icon = iconMap[scheme.icon];
              const colors = colorMap[scheme.color];

              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} p-8 hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 font-['Manrope']">
                        {scheme.title}
                      </h3>
                      <p className="text-gray-600 font-['Inter'] mb-4">
                        {scheme.description}
                      </p>
                      <div
                        className={`text-${scheme.color}-600 font-bold text-lg font-['Inter']`}
                      >
                        {scheme.subsidy}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SchemeFinder;
