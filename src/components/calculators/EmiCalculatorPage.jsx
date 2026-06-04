import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Copy, Download, RotateCcw, User, Phone, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../LandingPage/components/Navbar';
import Footer from '../LandingPage/components/Footer';
import apiClient from '../../api/apiClient';
import {
  QUICK_AMOUNTS,
  INTEREST_FREQUENCIES,
  CALCULATION_MODES,
  buildLoanAmortization,
  calculateLoanEmi,
  formatInr,
  formatInrCompact,
  getEmiInsights,
  getInstallmentLabel,
  getPeriodsPerYear,
  parseInrInput,
} from '../../utils/emiCalculator';
import { downloadEmiScheduleExcel } from '../../utils/emiScheduleExport';
import {
  defaultLoanStartDate,
  enrichScheduleRows,
  getFixedPrincipalPerPeriod,
  getPeriodColumnTitle,
  getRepaymentInterestPerPeriod,
} from '../../utils/emiSchedulePeriods';

ChartJS.register(ArcElement, Tooltip, Legend);

const ACCENT = '#00B386';

const DEFAULT_LOAN = 0;
const DEFAULT_RATE = 10.5;
const DEFAULT_TENURE_YEARS = 20;
const DEFAULT_FREQUENCY = 'monthly';
const DEFAULT_MORATORIUM_MONTHS = 0;
const DEFAULT_CALCULATION_MODE = 'principal_fixed';
const DEFAULT_LOAN_START_DATE = defaultLoanStartDate();
const LOAN_MIN = 0;
const LOAN_MAX = 1000000000;
const RATE_MIN = 1;
const RATE_MAX = 36;
const TENURE_MIN = 1;
const TENURE_MAX = 30;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToDecimals(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sanitizeRateInput(raw) {
  let s = String(raw ?? '').replace(/[^\d.]/g, '');
  if (!s) return '';
  const dot = s.indexOf('.');
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  }
  const parts = s.split('.');
  if (parts.length === 1) return parts[0];
  const [whole, frac = ''] = parts;
  return `${whole}.${frac.slice(0, 2)}`;
}

function formatRateValue(value) {
  const n = roundToDecimals(Number(value) || 0, 2);
  return n.toFixed(2).replace(/\.?0+$/, '');
}

function parseRateValue(text, min, max, fallback) {
  const cleaned = sanitizeRateInput(text);
  if (cleaned === '' || cleaned === '.') return fallback;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return fallback;
  return clamp(roundToDecimals(n, 2), min, max);
}

function NumericInputField({ label, suffix, displayValue, onDisplayChange, onBlur, ariaLabel }) {
  return (
    <motion.div layout className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 min-w-[7.5rem] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          {suffix === '₹' && <span className="text-gray-400 text-sm">₹</span>}
          <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => onDisplayChange(e.target.value)}
            onBlur={onBlur}
            className="w-full text-right text-sm font-semibold text-gray-900 outline-none bg-transparent ml-1"
            aria-label={ariaLabel ?? label}
          />
          {suffix === '%' && <span className="text-gray-400 text-sm ml-1">%</span>}
        </div>
      </div>
    </motion.div>
  );
}

function InterestRateField({ label, value, inputValue, min, max, onInputChange, onBlur, onSliderChange }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div layout className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 min-w-[7.5rem] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={onBlur}
            className="w-full text-right text-sm font-semibold text-gray-900 outline-none bg-transparent"
            aria-label={label}
          />
          <span className="text-gray-400 text-sm ml-1">%</span>
        </div>
      </div>
      <div className="relative">
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-emerald-500 pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={value}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="emi-range relative z-10 w-full"
          aria-label={`${label} slider`}
        />
      </div>
    </motion.div>
  );
}

function SliderField({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
  formatDisplay,
  parseInput,
  onInputBlur,
  hideSlider = false,
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <motion.div layout className="space-y-3">
      <motion.div layout className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 min-w-[7.5rem] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          {suffix === '₹' && <span className="text-gray-400 text-sm">₹</span>}
          <input
            type="text"
            inputMode={suffix === '%' ? 'decimal' : 'numeric'}
            value={formatDisplay(value)}
            onChange={(e) => {
              const parsed = parseInput ? parseInput(e.target.value) : parseInrInput(e.target.value);
              onChange(parsed);
            }}
            onBlur={onInputBlur}
            className="w-full text-right text-sm font-semibold text-gray-900 outline-none bg-transparent ml-1"
            aria-label={label}
          />
          {suffix === '%' && <span className="text-gray-400 text-sm ml-1">%</span>}
          {suffix === 'Yr' && <span className="text-gray-400 text-sm ml-1">Yr</span>}
          {suffix === 'Mo' && <span className="text-gray-400 text-sm ml-1">Mo</span>}
        </div>
      </motion.div>
      {!hideSlider && (
        <div className="relative">
          <div
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-emerald-500 pointer-events-none"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="emi-range relative z-10 w-full"
            aria-label={`${label} slider`}
          />
        </div>
      )}
    </motion.div>
  );
}

function ReadOnlyMetric({ label, value }) {
  return (
    <motion.div
      layout
      className="rounded-lg border border-gray-100 bg-white px-4 py-3.5 min-h-[4.25rem] flex flex-col justify-center"
    >
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1 tabular-nums break-words">
        {value}
      </p>
    </motion.div>
  );
}

function SummaryLine({ label, value, highlight }) {
  return (
    <motion.div
      layout
      className={`flex items-center justify-between py-3.5 px-4 border-b border-gray-100 last:border-0 ${
        highlight ? 'bg-emerald-50/60' : ''
      }`}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-emerald-600 text-base' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </motion.div>
  );
}

const EmiCalculatorPage = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [calculatorUnlocked, setCalculatorUnlocked] = useState(false);

  const [loanAmount, setLoanAmount] = useState(DEFAULT_LOAN);
  const [calculationMode, setCalculationMode] = useState(DEFAULT_CALCULATION_MODE);
  const [interestRate, setInterestRate] = useState(DEFAULT_RATE);
  const [interestRateInput, setInterestRateInput] = useState(formatRateValue(DEFAULT_RATE));
  const [tenureYears, setTenureYears] = useState(DEFAULT_TENURE_YEARS);
  const [interestFrequency, setInterestFrequency] = useState(DEFAULT_FREQUENCY);
  const [moratoriumMonths, setMoratoriumMonths] = useState(DEFAULT_MORATORIUM_MONTHS);
  const [loanStartDate, setLoanStartDate] = useState(DEFAULT_LOAN_START_DATE);

  const isFlatInterest = calculationMode === 'flat_interest';

  const periodsPerYear = useMemo(
    () => getPeriodsPerYear(interestFrequency),
    [interestFrequency],
  );

  const moratoriumMax = tenureYears * 12;

  const loanResult = useMemo(
    () =>
      calculateLoanEmi({
        principal: loanAmount,
        annualRatePercent: interestRate,
        tenureYears,
        periodsPerYear,
        moratoriumMonths,
        calculationMode,
      }),
    [
      loanAmount,
      interestRate,
      tenureYears,
      periodsPerYear,
      moratoriumMonths,
      calculationMode,
    ],
  );

  const {
    emi,
    totalInterest,
    totalAmount,
    totalInstallments,
    moratoriumPeriods,
    repaymentPeriods,
  } = loanResult;

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (!phone.trim()) {
        toast.error('Please enter your phone number');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      try {
        setSavingInfo(true);
        await apiClient.post('/form-submissions/emi-calculator/submit', {
          name: name.trim(),
          phone: cleanPhone,
        });
        setCalculatorUnlocked(true);
        toast.success('Details saved! You can now use the calculator.');
      } catch (err) {
        console.error(err);
        toast.error(
          typeof err === 'string' ? err : 'Failed to save information. Please try again.',
        );
      } finally {
        setSavingInfo(false);
      }
    },
    [name, phone],
  );

  const installmentLabel = useMemo(
    () => getInstallmentLabel(interestFrequency),
    [interestFrequency],
  );

  const schedulePeriodLabel = useMemo(() => {
    const map = {
      monthly: 'Month',
      quarterly: 'Quarter',
      halfyearly: 'Half-year',
      yearly: 'Year',
    };
    return map[interestFrequency] ?? 'Period';
  }, [interestFrequency]);

  const insights = useMemo(
    () => getEmiInsights(loanAmount, totalInterest, totalAmount, emi),
    [loanAmount, totalInterest, totalAmount, emi],
  );

  const scheduleRows = useMemo(
    () =>
      buildLoanAmortization({
        calculationMode,
        principal: loanAmount,
        annualRatePercent: interestRate,
        tenureYears,
        periodsPerYear,
        moratoriumMonths,
        installmentAmount: emi,
      }),
    [
      calculationMode,
      loanAmount,
      interestRate,
      tenureYears,
      periodsPerYear,
      moratoriumMonths,
      emi,
    ],
  );

  const enrichedScheduleRows = useMemo(
    () =>
      enrichScheduleRows(scheduleRows, {
        principal: loanAmount,
        loanStartDate,
        periodsPerYear,
      }),
    [scheduleRows, loanAmount, loanStartDate, periodsPerYear],
  );

  const interestPerPeriod = useMemo(
    () => getRepaymentInterestPerPeriod(scheduleRows),
    [scheduleRows],
  );

  const fixedPrincipalPerPeriod = useMemo(
    () =>
      getFixedPrincipalPerPeriod(
        scheduleRows,
        calculationMode,
        loanAmount,
        repaymentPeriods,
      ),
    [scheduleRows, calculationMode, loanAmount, repaymentPeriods],
  );

  const periodColumnTitle = useMemo(
    () => getPeriodColumnTitle(interestFrequency),
    [interestFrequency],
  );

  const doughnutData = useMemo(
    () => ({
      labels: ['Principal', 'Interest'],
      datasets: [
        {
          data: [loanAmount, totalInterest],
          backgroundColor: ['#6366f1', ACCENT],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }),
    [loanAmount, totalInterest],
  );

  const resetAll = useCallback(() => {
    setLoanAmount(DEFAULT_LOAN);
    setCalculationMode(DEFAULT_CALCULATION_MODE);
    setInterestRate(DEFAULT_RATE);
    setInterestRateInput(formatRateValue(DEFAULT_RATE));
    setTenureYears(DEFAULT_TENURE_YEARS);
    setInterestFrequency(DEFAULT_FREQUENCY);
    setMoratoriumMonths(DEFAULT_MORATORIUM_MONTHS);
    setLoanStartDate(DEFAULT_LOAN_START_DATE);
    toast.success('Reset to defaults');
  }, []);

  const copySummary = useCallback(async () => {
    const freqLabel =
      INTEREST_FREQUENCIES.find((f) => f.id === interestFrequency)?.label ?? interestFrequency;
    const text = [
      `Mode: ${isFlatInterest ? 'Flat interest rate' : 'Reducing interest rate'}`,
      `${installmentLabel}: ${formatInr(emi)}`,
      `Loan: ${formatInr(loanAmount)} @ ${interestRate}% p.a. for ${tenureYears} years`,
      `Interest frequency: ${freqLabel} | Moratorium: ${moratoriumMonths} months`,
      `Loan start: ${loanStartDate}`,
      `Periods per year: ${periodsPerYear} | Total installments: ${totalInstallments}`,
      `Interest per period: ${formatInr(interestPerPeriod)} | Principal/period: ${formatInr(fixedPrincipalPerPeriod)}`,
      `Total interest: ${formatInr(totalInterest)}`,
      `Total amount: ${formatInr(totalAmount)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  }, [
    emi,
    installmentLabel,
    loanAmount,
    isFlatInterest,
    interestRate,
    tenureYears,
    interestFrequency,
    moratoriumMonths,
    loanStartDate,
    periodsPerYear,
    totalInstallments,
    interestPerPeriod,
    fixedPrincipalPerPeriod,
    totalInterest,
    totalAmount,
  ]);

  const handleExportExcel = useCallback(async () => {
    try {
      await downloadEmiScheduleExcel({
        enrichedRows: enrichedScheduleRows,
        loanAmount,
        interestRate,
        tenureYears,
        interestFrequency,
        periodsPerYear,
        totalInstallments,
        moratoriumMonths,
        moratoriumPeriods,
        emi,
        totalInterest,
        totalAmount,
        installmentLabel,
        calculationMode,
        loanStartDate,
        interestPerPeriod,
        fixedPrincipalPerPeriod,
      });
      toast.success('Excel downloaded');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Excel export failed:', err);
      toast.error('Could not download Excel');
    }
  }, [
    enrichedScheduleRows,
    loanAmount,
    interestRate,
    tenureYears,
    interestFrequency,
    periodsPerYear,
    totalInstallments,
    moratoriumMonths,
    moratoriumPeriods,
    emi,
    totalInterest,
    totalAmount,
    installmentLabel,
    calculationMode,
    loanStartDate,
    interestPerPeriod,
    fixedPrincipalPerPeriod,
  ]);

  const modeLabel = isFlatInterest ? 'Flat interest rate' : 'Reducing interest rate';

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',system-ui,sans-serif]">
      <style>{`
        .emi-range {
          height: 4px;
          border-radius: 9999px;
          background: #e5e7eb;
          appearance: none;
          width: 100%;
        }
        .emi-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 2px solid ${ACCENT};
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .emi-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 2px solid ${ACCENT};
        }
      `}</style>

      <Navbar />

      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              EMI Calculator
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Submit your name and phone number to access the EMI calculator.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 items-end bg-white border border-gray-200 rounded-2xl p-4 shadow-sm w-full md:w-auto">
            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingInfo}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 h-[38px] shrink-0 font-['Inter',system-ui,sans-serif]"
            >
              {savingInfo ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        {!calculatorUnlocked ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 sm:p-14 text-center">
            <Calculator className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Calculator locked</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Enter your name and phone number above, then click Submit to unlock the EMI
              calculator.
            </p>
          </div>
        ) : (
        <>
        <motion.div
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div layout className="grid lg:grid-cols-2 lg:items-stretch">
            <motion.div layout className="p-6 sm:p-8 lg:border-r border-gray-100 space-y-7">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Loan details
                </h2>
                <button
                  type="button"
                  onClick={resetAll}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <NumericInputField
                label="Loan amount"
                suffix="₹"
                displayValue={loanAmount.toLocaleString('en-IN')}
                onDisplayChange={(raw) => {
                  const n = parseInrInput(raw);
                  setLoanAmount(clamp(n, LOAN_MIN, LOAN_MAX));
                }}
                onBlur={() => {
                  setLoanAmount((v) => clamp(v, LOAN_MIN, LOAN_MAX));
                }}
              />
              <div className="flex flex-wrap gap-1.5 -mt-3">
                {QUICK_AMOUNTS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setLoanAmount(chip.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      loanAmount === chip.value
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Interest calculation</label>
                <div className="inline-flex w-full rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  {CALCULATION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setCalculationMode(mode.id)}
                      className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        calculationMode === mode.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                {/* <p className="text-xs text-gray-500">
                  {isFlatInterest
                    ? 'Flat rate: total interest = principal × rate × tenure; equal installments.'
                    : 'Reducing balance: interest on outstanding principal each period.'}
                </p> */}
              </div>

              <InterestRateField
                label="Interest rate (p.a.)"
                value={interestRate}
                inputValue={interestRateInput}
                min={RATE_MIN}
                max={RATE_MAX}
                onInputChange={(raw) => {
                  const text = sanitizeRateInput(raw);
                  setInterestRateInput(text);
                  if (text === '' || text === '.') return;
                  const n = parseFloat(text);
                  if (!Number.isFinite(n)) return;
                  setInterestRate(clamp(roundToDecimals(n, 2), RATE_MIN, RATE_MAX));
                }}
                onBlur={() => {
                  const rate = parseRateValue(
                    interestRateInput,
                    RATE_MIN,
                    RATE_MAX,
                    interestRate,
                  );
                  setInterestRate(rate);
                  setInterestRateInput(formatRateValue(rate));
                }}
                onSliderChange={(v) => {
                  const rate = clamp(roundToDecimals(v, 2), RATE_MIN, RATE_MAX);
                  setInterestRate(rate);
                  setInterestRateInput(formatRateValue(rate));
                }}
              />

              <SliderField
                label="Tenure (years)"
                suffix="Yr"
                value={tenureYears}
                min={TENURE_MIN}
                max={TENURE_MAX}
                step={1}
                onChange={(v) => {
                  const years = clamp(Math.round(v), TENURE_MIN, TENURE_MAX);
                  setTenureYears(years);
                  setMoratoriumMonths((m) => Math.min(m, years * 12));
                }}
                formatDisplay={(v) => String(v)}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Interest frequency</label>
                <select
                  value={interestFrequency}
                  onChange={(e) => setInterestFrequency(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  aria-label="Interest frequency"
                >
                  {INTEREST_FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Loan start date</label>
                <input
                  type="date"
                  value={loanStartDate}
                  onChange={(e) => setLoanStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  aria-label="Loan start date"
                />
                <p className="text-xs text-gray-500">
                  Used for period labels and Indian financial year (Apr–Mar) in the schedule.
                </p>
              </div>

              <SliderField
                label="Moratorium period"
                suffix="Mo"
                value={moratoriumMonths}
                min={0}
                max={moratoriumMax}
                step={1}
                onChange={(v) =>
                  setMoratoriumMonths(clamp(Math.round(v), 0, moratoriumMax))
                }
                formatDisplay={(v) => String(v)}
              />
              <p className="text-xs text-gray-500 -mt-4">
                During moratorium, only interest is paid (no principal). Max {moratoriumMax}{' '}
                months for selected tenure.
              </p>
            </motion.div>

            <motion.div layout className="p-6 sm:p-8 bg-gray-50/50 flex flex-col gap-4 lg:min-h-full">
              <motion.div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {installmentLabel}
                  </p>
                  <motion.p
                    key={Math.round(emi)}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl sm:text-4xl font-bold text-gray-900 mt-0.5 tabular-nums"
                  >
                    {formatInr(emi)}
                  </motion.p>
                  {moratoriumPeriods > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      After moratorium · interest-only before that
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={copySummary}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </motion.div>

              <motion.div layout className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <SummaryLine label="Principal amount" value={formatInr(loanAmount)} />
                <SummaryLine label="Total interest" value={formatInr(totalInterest)} />
                <SummaryLine label="Total amount" value={formatInr(totalAmount)} highlight />
              </motion.div>

              <motion.div
                layout
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-[132px] h-[132px] shrink-0">
                    <Doughnut
                      data={doughnutData}
                      options={{
                        cutout: '70%',
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => `${ctx.label}: ${formatInr(ctx.raw)}`,
                            },
                          },
                        },
                      }}
                    />
                    <motion.div layout className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-gray-500 uppercase">Interest</span>
                      <span className="text-base font-bold text-emerald-600">
                        {insights.interestShare.toFixed(0)}%
                      </span>
                    </motion.div>
                  </div>
                  <div className="flex-1 space-y-2 text-sm w-full">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-gray-600">Principal</span>
                      <span className="ml-auto font-medium text-gray-900">
                        {formatInrCompact(loanAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-gray-600">Interest</span>
                      <span className="ml-auto font-medium text-gray-900">
                        {formatInrCompact(totalInterest)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <span className="text-gray-600">Interest / principal</span>
                      <span className="ml-auto font-medium text-gray-900">
                        {(insights.interestToPrincipalRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                layout
                className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 flex-1 flex flex-col min-h-0"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Schedule details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 auto-rows-fr">
                  <ReadOnlyMetric label="Periods per year" value={String(periodsPerYear)} />
                  <ReadOnlyMetric
                    label="Interest per period"
                    value={formatInr(interestPerPeriod)}
                  />
                  <ReadOnlyMetric
                    label="Total installments"
                    value={String(totalInstallments)}
                  />
                  <ReadOnlyMetric
                    label="Fixed principal / period"
                    value={formatInr(fixedPrincipalPerPeriod)}
                  />
                  <ReadOnlyMetric label="Fixed EMI" value={formatInr(emi)} />
                  <ReadOnlyMetric label="Mode" value={modeLabel} />
                </div>
                {moratoriumPeriods > 0 && (
                  <p className="text-xs text-amber-700 mt-3 pt-3 border-t border-gray-100">
                    Moratorium: {moratoriumPeriods} of {totalInstallments} installments (
                    {repaymentPeriods} repayments).
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <motion.div layout>
              <h2 className="text-base font-semibold text-gray-900">Amortization schedule</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {schedulePeriodLabel}-wise schedule
                {interestFrequency === 'yearly'
                  ? ' · Month / Quarter / Half-Year / Year periods'
                  : ''}
              </p>
            </motion.div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="sticky top-0 bg-[#d9ead3] border-b border-gray-200">
                <tr className="text-xs text-gray-800 font-semibold">
                  <th className="py-3 px-3 text-center">Period</th>
                  <th className="py-3 px-3 text-left">{periodColumnTitle}</th>
                  <th className="py-3 px-3 text-center">Financial Year</th>
                  <th className="py-3 px-3 text-right">Opening Balance</th>
                  <th className="py-3 px-3 text-right">Interest</th>
                  <th className="py-3 px-3 text-right">Principal</th>
                  <th className="py-3 px-3 text-right">Installment</th>
                  <th className="py-3 px-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {enrichedScheduleRows.map((row) => (
                  <tr
                    key={row.period}
                    className={`border-b border-gray-50 hover:bg-gray-50/80 ${
                      row.phase === 'moratorium' ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-gray-900">
                      {row.period}
                      {row.phase === 'moratorium' && (
                        <span className="block text-[10px] font-medium text-amber-700 uppercase">
                          Moratorium
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-left text-gray-700 whitespace-nowrap">
                      {row.periodRange}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 whitespace-nowrap">
                      {row.financialYear}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums">
                      {formatInr(row.openingBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums">
                      {formatInr(row.interest)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums">
                      {formatInr(row.principal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-900 tabular-nums">
                      {formatInr(row.installment)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                      {formatInr(row.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EmiCalculatorPage;
