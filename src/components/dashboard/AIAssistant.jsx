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
    CMA_LOAN_TYPE: 5,       // Q1: Pure CC Loan vs Existing CC + TL
    CMA_WC_LIMIT: 6,        // Q2 (Pure CC): Do you have WC limit at present?
    CMA_FINANCIALS: 7,      // Q3 (Pure CC, No WC): Estimated / Audited Provisional / Audited
    CMA_PURE_CC_TOPUP: 8,   // Q3 (Pure CC, Yes WC): Top-up? → CC4 / CC5
    CMA_CC67: 9,            // Q2 (Existing CC+TL): Top-up? → CC6 / CC7
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
                    onClick={() => handleNext(STEPS.CMA_LOAN_TYPE)}
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

    // ── CMA Decision Tree ────────────────────────────────────────────────────
    //
    //  CC proposals
    // ── CMA Decision Tree ────────────────────────────────────────────
    //
    //  Q1: What type of CC proposal?
    //  ├── Pure CC Loan  (CC1–CC5)
    //  │   └── Q2: WC limit at present?
    //  │       ├── No
    //  │       │   └── Q3: Financial statement type?
    //  │       │       ├── Estimated                  → CC1
    //  │       │       ├── Audited (Provisional)      → CC2
    //  │       │       └── Audited                    → CC3
    //  │       └── Yes
    //  │           └── Q3: Working capital top-up?
    //  │               ├── No                         → CC4
    //  │               └── Yes                        → CC5
    //  └── Existing CC Loan + Additional Term Loan  (CC6–CC7)
    //      └── Q2: Working capital top-up?
    //          ├── No                                 → CC6
    //          └── Yes                                → CC7

    const renderCMALoanType = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                What type of CC proposal is this?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Select the nature of your credit application</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="Pure CC Loan"
                    description="Working capital / cash credit loan only — no term loan component"
                    onClick={() => handleNext(STEPS.CMA_WC_LIMIT)}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Existing CC Loan + Additional Term Loan"
                    description="Already have a CC limit and now applying for a term loan as well"
                    onClick={() => handleNext(STEPS.CMA_CC67)}
                />
            </div>
        </div>
    );

    const renderCMAWCLimit = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have a working capital limit at present?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">An existing CC / working capital sanction from a bank</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No existing working capital / CC limit — applying fresh"
                    onClick={() => handleNext(STEPS.CMA_FINANCIALS)}
                />
                <SelectionCard
                    icon={ArchiveBoxIcon}
                    title="Yes"
                    description="Already have an existing working capital / CC limit"
                    onClick={() => handleNext(STEPS.CMA_PURE_CC_TOPUP)}
                />
            </div>
        </div>
    );

    const renderCMAFinancials = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                What type of financial statements do you have?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Select based on the financials you'll be submitting</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="Estimated"
                    description="Projected / estimated data only — no prior audited accounts"
                    onClick={() => onSelectTemplate('frcc1')}
                    compact
                />
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Audited (Provisional)"
                    description="Provisional audited statements are available"
                    onClick={() => onSelectTemplate('frcc2')}
                    compact
                />
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Audited"
                    description="Full audited financial statements are available"
                    onClick={() => onSelectTemplate('frcc3')}
                    compact
                />
            </div>
        </div>
    );

    const renderCMAPureCCTopup = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Is this a working capital top-up / enhancement?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Are you applying to increase your existing CC limit?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No — Same Limit"
                    description="Renewing the existing CC limit without enhancement"
                    onClick={() => onSelectTemplate('frcc4')}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes — Top-up"
                    description="Applying for an enhancement / increase in the working capital limit"
                    onClick={() => onSelectTemplate('frcc5')}
                />
            </div>
        </div>
    );

    const renderCMACC67 = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Is this a working capital top-up as well?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Alongside the new term loan, are you also increasing your working capital limit?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No — Term Loan Only"
                    description="Adding a term loan while keeping the existing CC limit unchanged"
                    onClick={() => onSelectTemplate('frcc6')}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes — Enhance CC + Term Loan"
                    description="Increasing the CC limit and also applying for a new term loan"
                    onClick={() => onSelectTemplate('frcc7')}
                />
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
                        {currentStep === STEPS.CMA_LOAN_TYPE && renderCMALoanType()}
                        {currentStep === STEPS.CMA_WC_LIMIT && renderCMAWCLimit()}
                        {currentStep === STEPS.CMA_FINANCIALS && renderCMAFinancials()}
                        {currentStep === STEPS.CMA_PURE_CC_TOPUP && renderCMAPureCCTopup()}
                        {currentStep === STEPS.CMA_CC67 && renderCMACC67()}
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
