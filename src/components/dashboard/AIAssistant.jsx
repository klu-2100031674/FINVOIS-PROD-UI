import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOfficeIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    DocumentTextIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    UserIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
const STEPS = {
    GENERATION_MODE: 100,
    REPORT_TYPE: 0,
    SECTOR: 1,
    LOAN_TYPE_MFG: 2,
    LOAN_TYPE_TRADING: 12,
    STOCK_CHECK: 3,
    LOAN_TYPE_SERVICE_STOCK: 4,
    CMA_WC_LIMIT: 5,
    CMA_NEW_TERM_LOAN: 6,
    CMA_TOPUP_WITH_TERM_LOAN: 7,
    CMA_TOPUP_WITHOUT_TERM_LOAN: 8,
    CMA_AUDITED_LAST_YEAR: 9,
    CMA_PROVISIONAL_AUDITED_YES: 10,
    CMA_PROVISIONAL_AUDITED_NO: 11,
};

const AIAssistant = ({ onSelectTemplate, showGenerationModeStep = false, showHeader = true }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(STEPS.REPORT_TYPE);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [history, setHistory] = useState([]);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for back

    useEffect(() => {
        setCurrentStep(STEPS.REPORT_TYPE);
        setSelectedReportType(null);
        setHistory([]);
    }, [showGenerationModeStep]);

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

    const renderGenerationMode = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Please select the type of report you would like to be prepared
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={UserIcon}
                    title="Generate report"
                    description="(to generate Report on your own)"
                    onClick={() => {
                        if (selectedReportType === 'CMA') {
                            handleNext(STEPS.CMA_WC_LIMIT);
                        } else {
                            handleNext(STEPS.SECTOR);
                        }
                    }}
                />
                <SelectionCard
                    icon={UserGroupIcon}
                    title="Send Data for Report"
                    description="(our Team will help you in preparing report)"
                    onClick={() => navigate('/generate/report-help/new')}
                />
            </div>
        </div>
    );

    const renderReportType = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Please select the type of report you would like to be prepared
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="DPR (Detailed Project Report)"
                    description="For comprehensive project planning and bank loans"
                    onClick={() => {
                        setSelectedReportType('DPR');
                        if (showGenerationModeStep) {
                            handleNext(STEPS.GENERATION_MODE);
                        } else {
                            handleNext(STEPS.SECTOR);
                        }
                    }}
                />
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="CMA Data Projections"
                    description="Credit Monitoring Arrangement data for working capital"
                    onClick={() => {
                        setSelectedReportType('CMA');
                        if (showGenerationModeStep) {
                            handleNext(STEPS.GENERATION_MODE);
                        } else {
                            handleNext(STEPS.CMA_WC_LIMIT);
                        }
                    }}
                />
            </div>
        </div>
    );

    const renderSector = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Which sector does your business belong to?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectionCard
                    icon={BuildingOfficeIcon}
                    title="Trading Sector"
                    description="Buying and selling of goods"
                    onClick={() => handleNext(STEPS.LOAN_TYPE_TRADING)}
                />
            </div>
        </div>
    );

    const renderLoanTypeSelection = ({ sectorLabel, selectOptions }) => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                What type of loan are you applying for?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
                {sectorLabel} DPR flow
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Term Loan and CC / Working Capital loan"
                    description="Both long-term and short-term funding"
                    onClick={() => onSelectTemplate('TERM_LOAN_CC', selectOptions)}
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Pure term loan"
                    description="Long-term funding for assets"
                    onClick={() => onSelectTemplate('TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', selectOptions)}
                />
            </div>
        </div>
    );

    const renderLoanTypeMfg = () =>
        renderLoanTypeSelection({
            sectorLabel: 'Manufacturing Sector',
            selectOptions: { presetSector: 'Manufacturing sector', lockSector: true },
        });
    const renderLoanTypeTrading = () =>
        renderLoanTypeSelection({
            sectorLabel: 'Trading Sector',
            selectOptions: { presetSector: 'Trading sector', lockSector: true },
        });

    const renderStockCheck = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Does your business maintain stock or Inventory Holdings?
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
                    description="Pure service based, no significant inventory holdings"
                    onClick={() =>
                        onSelectTemplate('TERM_LOAN_SERVICE_WITHOUT_STOCK', {
                            presetSector: 'service sector without stock',
                            lockSector: true,
                        })
                    }
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
                    onClick={() =>
                        onSelectTemplate('TERM_LOAN_CC', {
                            presetSector: 'service sector with stock',
                            lockSector: true,
                        })
                    }
                />
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Pure term loan"
                    description="Long-term funding for assets"
                    onClick={() =>
                        onSelectTemplate('TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', {
                            presetSector: 'service sector with stock',
                            lockSector: true,
                        })
                    }
                />
            </div>
        </div>
    );

    // CMA decision tree:
    // Q1: WC limit at present?
    // ├── Yes -> Q2A: New term loan for asset purchase?
    // │   ├── Yes -> Q3A: WC top-up?
    // │   │   ├── Yes -> CC7
    // │   │   └── No  -> CC6
    // │   └── No  -> Q3B: WC top-up?
    // │       ├── Yes -> CC5
    // │       └── No  -> CC4
    // └── No  -> Q2B: Audited last FY statements?
    //     ├── Yes -> Q3C: Provisional current FY statements?
    //     │   ├── Yes -> CC2
    //     │   └── No  -> CC3
    //     └── No  -> Q3D: Provisional current FY statements?
    //         ├── Yes -> CC3
    //         └── No  -> CC1

    const renderCMAWCLimit = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have a Working Capital Limit at present?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Select based on your current sanctioned working capital/CC limit</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ArchiveBoxIcon}
                    title="Yes"
                    description="We already have an existing working capital limit"
                    onClick={() => handleNext(STEPS.CMA_NEW_TERM_LOAN)}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No existing working capital limit at present"
                    onClick={() => handleNext(STEPS.CMA_AUDITED_LAST_YEAR)}
                />
            </div>
        </div>
    );

    const renderCMANewTermLoan = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Are you also going for a New Term Loan for purchase of an Asset?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">This is for applicants who already have a working capital limit</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes"
                    description="Applying for a new term loan along with existing WC setup"
                    onClick={() => handleNext(STEPS.CMA_TOPUP_WITH_TERM_LOAN)}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="Not applying for a new term loan"
                    onClick={() => handleNext(STEPS.CMA_TOPUP_WITHOUT_TERM_LOAN)}
                />
            </div>
        </div>
    );

    const renderCMATopupWithTermLoan = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Are you going for Working Capital limit Top-up from present limit?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">WC limit exists + New term loan = CC6/CC7 path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes"
                    description="Top-up with new term loan"
                    onClick={() => onSelectTemplate('frcc7')}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No top-up, term loan only addition"
                    onClick={() => onSelectTemplate('frcc6')}
                />
            </div>
        </div>
    );

    const renderCMATopupWithoutTermLoan = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Are you going for Working Capital limit Top-up from present limit?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">WC limit exists + No new term loan = CC4/CC5 path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={CurrencyDollarIcon}
                    title="Yes"
                    description="Top-up of existing WC limit"
                    onClick={() => onSelectTemplate('frcc5')}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No top-up of existing WC limit"
                    onClick={() => onSelectTemplate('frcc4')}
                />
            </div>
        </div>
    );

    const renderCMAAuditedLastYear = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have Audited Financial statements for last financial year?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">WC limit does not exist = audited/provisional check path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Yes"
                    description="Audited statements available for last FY"
                    onClick={() => handleNext(STEPS.CMA_PROVISIONAL_AUDITED_YES)}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No audited statements for last FY"
                    onClick={() => handleNext(STEPS.CMA_PROVISIONAL_AUDITED_NO)}
                />
            </div>
        </div>
    );

    const renderCMAProvisionalAuditedYes = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have Provisional Financial statements for current financial year?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Audited = Yes path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Yes"
                    description="Provisional statements available"
                    onClick={() => onSelectTemplate('frcc2')}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="Provisional statements not available"
                    onClick={() => onSelectTemplate('frcc3')}
                />
            </div>
        </div>
    );

    const renderCMAProvisionalAuditedNo = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Do you have Provisional Financial statements for current financial year?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Audited = No path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectionCard
                    icon={ClipboardDocumentCheckIcon}
                    title="Yes"
                    description="Provisional statements available"
                    onClick={() => onSelectTemplate('frcc3')}
                />
                <SelectionCard
                    icon={DocumentTextIcon}
                    title="No"
                    description="No provisional statements available"
                    onClick={() => onSelectTemplate('frcc1')}
                />
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto">
            {showHeader && (
                <div className="mb-8 text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 font-['Outfit'] tracking-tight">
                        Comprehensive Report Generation System
                    </h1>
                    <p className="text-gray-500 mt-2 text-base font-medium font-['Inter']">
                        Use our AI Assistant to Generate the perfect report for you
                    </p>
                </div>
            )}

            <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="text-gray-800 flex items-center justify-between p-2">
                    {history.length > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
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
                            {currentStep === STEPS.GENERATION_MODE && renderGenerationMode()}
                            {currentStep === STEPS.REPORT_TYPE && renderReportType()}
                            {currentStep === STEPS.SECTOR && renderSector()}
                            {currentStep === STEPS.LOAN_TYPE_MFG && renderLoanTypeMfg()}
                            {currentStep === STEPS.LOAN_TYPE_TRADING && renderLoanTypeTrading()}
                            {currentStep === STEPS.STOCK_CHECK && renderStockCheck()}
                            {currentStep === STEPS.LOAN_TYPE_SERVICE_STOCK && renderLoanTypeServiceStock()}
                            {currentStep === STEPS.CMA_WC_LIMIT && renderCMAWCLimit()}
                            {currentStep === STEPS.CMA_NEW_TERM_LOAN && renderCMANewTermLoan()}
                            {currentStep === STEPS.CMA_TOPUP_WITH_TERM_LOAN && renderCMATopupWithTermLoan()}
                            {currentStep === STEPS.CMA_TOPUP_WITHOUT_TERM_LOAN && renderCMATopupWithoutTermLoan()}
                            {currentStep === STEPS.CMA_AUDITED_LAST_YEAR && renderCMAAuditedLastYear()}
                            {currentStep === STEPS.CMA_PROVISIONAL_AUDITED_YES && renderCMAProvisionalAuditedYes()}
                            {currentStep === STEPS.CMA_PROVISIONAL_AUDITED_NO && renderCMAProvisionalAuditedNo()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const SelectionCard = ({ icon: Icon, title, description, onClick, badge, compact = false }) => (
    <button
        type="button"
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
