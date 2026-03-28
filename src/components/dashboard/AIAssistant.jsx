import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOfficeIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    DocumentTextIcon,
    ArrowRightIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STEPS = {
    REPORT_TYPE: 0,
    SECTOR: 1,
    LOAN_TYPE_MFG: 2,
    STOCK_CHECK: 3,
    LOAN_TYPE_SERVICE_STOCK: 4,
    CMA_FORMAT: 5,
    CMA_Q1: 6,
    CMA_Q2: 7,
    CMA_Q3: 8,
    CMA_COMING_SOON: 9
};

const AIAssistant = ({ onSelectTemplate }) => {
    const [currentStep, setCurrentStep] = useState(STEPS.REPORT_TYPE);
    const [history, setHistory] = useState([]);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for back

    const handleNext = (nextStep) => {
        setDirection(1);
        setHistory([...history, currentStep]);
        setCurrentStep(nextStep);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        setDirection(-1);
        const prevStep = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setCurrentStep(prevStep);
    };

    const containerVariants = {
        hidden: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" }
        },
        exit: (direction) => ({
            x: direction > 0 ? -50 : 50,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" }
        })
    };

    // --- Step Content Renderers ---

    const renderReportType = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                What type of report would you like to generate?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="DPR (Detailed Project Report)"
                    description="For comprehensive project planning and bank loans"
                    onClick={() => handleNext(STEPS.SECTOR)}
                />
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="CMA Data Projections"
                    description="Credit Monitoring Arrangement data for working capital"
                    onClick={() => handleNext(STEPS.CMA_Q1)}
                />
            </div>
        </div>
    );

    const renderSector = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Which sector does your business belong to?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={WrenchScrewdriverIcon}
                    title="Manufacturing Sector"
                    description="Production and processing of goods"
                    onClick={() => handleNext(STEPS.LOAN_TYPE_MFG)}
                />
                <SelectionCard
                    icon={BuildingOfficeIcon}
                    title="Service Sector"
                    description="Providing services to customers"
                    onClick={() => handleNext(STEPS.STOCK_CHECK)}
                />
            </div>
        </div>
    );

    const renderLoanTypeMfg = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                What type of loan are you applying for?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Term Loan and CC / Working Capital loan"
                    description="Both long-term and short-term funding"
                    onClick={() => onSelectTemplate('TERM_LOAN_CC')}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Pure term loan"
                    description="Long-term funding for assets"
                    onClick={() => onSelectTemplate('TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK')}
                />
            </div>
        </div>
    );

    const renderStockCheck = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Does your business maintain stock or inventory?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ArchiveBoxIcon}
                    title="Yes"
                    description="We maintain inventory/stock for business"
                    onClick={() => handleNext(STEPS.LOAN_TYPE_SERVICE_STOCK)}
                />
                <SelectionCard
                    icon={BuildingOfficeIcon}
                    title="No"
                    description="Pure service based, no significant inventory"
                    onClick={() => onSelectTemplate('TERM_LOAN_SERVICE_WITHOUT_STOCK')}
                />
            </div>
        </div>
    );

    const renderLoanTypeServiceStock = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                What type of loan are you applying for?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Term Loan and CC / Working Capital loan"
                    description="Both long-term and short-term funding"
                    onClick={() => onSelectTemplate('TERM_LOAN_CC')}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Pure term loan"
                    description="Long-term funding for assets"
                    onClick={() => onSelectTemplate('TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK')}
                />
            </div>
        </div>
    );

    const renderCMAFormat = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Select your CMA / CC Format
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['frcc1', 'frcc2', 'frcc3', 'frcc4', 'frcc5', 'frcc6'].map((id, idx) => (
                    <SelectionCard
                        key={id}
                        icon={ClipboardDocumentCheckIcon}
                        title={`Format CC${idx + 1}`}
                        description="Standard CMA Data Format"
                        onClick={() => onSelectTemplate(id)}
                        compact
                    />
                ))}
            </div>
        </div>
    );

    const renderCMAQ1 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have a working capital limit?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">An existing CC / working capital sanction from a bank</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ArchiveBoxIcon}
                    title="Yes"
                    description="I already have an existing working capital / CC limit"
                    onClick={() => handleNext(STEPS.CMA_COMING_SOON)}
                    badge="Coming Soon"
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="I do not have an existing working capital limit"
                    onClick={() => handleNext(STEPS.CMA_Q2)}
                />
            </div>
        </div>
    );

    const renderCMAQ2 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                What type of financial statements do you have?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Select based on the financials you'll be submitting</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="Estimated"
                    description="Projected / estimated financial data (no prior audited accounts)"
                    onClick={() => onSelectTemplate('frcc1')}  // Estimated → CC1
                />
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Audited"
                    description="Audited financial statements are available"
                    onClick={() => handleNext(STEPS.CMA_Q3)}
                />
            </div>
        </div>
    );

    const renderCMAQ3 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Is this a top-up from an existing limit?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Enhancement or renewal of a previously sanctioned credit line</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes — Top-up"
                    description="Enhancement or renewal of an existing credit limit"
                    onClick={() => onSelectTemplate('frcc2')}  // Top-up → CC2
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No — Fresh"
                    description="Fresh credit limit application"
                    onClick={() => onSelectTemplate('frcc3')}  // Fresh → CC3
                />
            </div>
        </div>
    );

    const renderCMAComingSoon = () => (
        <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="p-5 bg-yellow-100 rounded-full">
                <ClipboardDocumentCheckIcon className="w-14 h-14 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center">Coming Soon</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 max-w-md text-center">
                <p className="text-yellow-700 font-semibold text-base mb-2">CMA for Existing Working Capital Limit</p>
                <p className="text-yellow-600 text-sm leading-relaxed">
                    We are building CMA templates for businesses with an existing working capital / CC limit.
                    This feature will be available soon. Use the <strong>Back</strong> button to explore other options.
                </p>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="text-gray-800 flex items-center justify-between p-2">

                {history.length > 0 && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2  rounded-lg transition-colors text-sm font-medium"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-8 min-h-[400px] flex flex-col justify-center">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full"
                    >
                        {currentStep === STEPS.REPORT_TYPE && renderReportType()}
                        {currentStep === STEPS.SECTOR && renderSector()}
                        {currentStep === STEPS.LOAN_TYPE_MFG && renderLoanTypeMfg()}
                        {currentStep === STEPS.STOCK_CHECK && renderStockCheck()}
                        {currentStep === STEPS.LOAN_TYPE_SERVICE_STOCK && renderLoanTypeServiceStock()}
                        {currentStep === STEPS.CMA_FORMAT && renderCMAFormat()}
                        {currentStep === STEPS.CMA_Q1 && renderCMAQ1()}
                        {currentStep === STEPS.CMA_Q2 && renderCMAQ2()}
                        {currentStep === STEPS.CMA_Q3 && renderCMAQ3()}
                        {currentStep === STEPS.CMA_COMING_SOON && renderCMAComingSoon()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const SelectionCard = ({ icon: Icon, title, description, onClick, badge, compact = false }) => (
    <button
        onClick={onClick}
        className={`
      flex flex-col items-start p-6 rounded-xl border-2 border-transparent 
      bg-gray-50 hover:bg-purple-50 hover:border-purple-200 
      transition-all duration-200 group text-left w-full
      ${compact ? 'p-4' : 'p-6'}
    `}
    >
        <div className="flex items-center justify-between w-full mb-3">
            <div className={`p-3 rounded-lg bg-white shadow-sm group-hover:bg-purple-100 transition-colors ${compact ? 'p-2' : ''}`}>
                <Icon className={`text-purple-600 ${compact ? 'w-5 h-5' : 'w-8 h-8'}`} />
            </div>
            {badge && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    {badge}
                </span>
            )}
            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors opacity-0 group-hover:opacity-100" />
        </div>
        <h3 className={`font-bold text-gray-900 mb-1 group-hover:text-purple-700 ${compact ? 'text-base' : 'text-lg'}`}>
            {title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600">
            {description}
        </p>
    </button>
);

export default AIAssistant;
