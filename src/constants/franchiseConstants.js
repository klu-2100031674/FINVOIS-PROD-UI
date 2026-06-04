export const FRANCHISE_CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Education',
  'Healthcare',
  'Salon & Beauty',
  'Fitness',
  'Automobile',
  'Services',
  'Real Estate',
  'Other',
];

export const PREFERRED_LOCATIONS = [
  'Mall',
  'High Street',
  'Residential Area',
  'Highway',
  'Commercial Complex',
];

export const SUPPORT_OPTIONS = [
  'Training Support',
  'Marketing Support',
  'Store Setup Assistance',
  'Inventory Support',
  'Staff Training',
  'Technology / Software Support',
  'Operations Manual',
  'Launch Support',
  'Ongoing Business Support',
];

export const OWNERSHIP_TYPES = ['Individual', 'Partnership', 'Company'];

export const FUNDING_SOURCES = ['Self', 'Loan', 'Partner'];

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

export const formatCurrency = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
};

export const formatInvestmentRange = (min, max) => {
  const hasMin = Number(min) > 0;
  const hasMax = Number(max) > 0;
  if (hasMin && hasMax) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (hasMin) return `From ${formatCurrency(min)}`;
  if (hasMax) return `Up to ${formatCurrency(max)}`;
  return '—';
};

export const initialFranchiseFormState = {
  franchiseName: '',
  brandName: '',
  category: '',
  subCategory: '',
  shortDescription: '',
  detailedDescription: '',
  minInvestment: '',
  maxInvestment: '',
  franchiseFee: '',
  royaltyFeePercent: '',
  securityDeposit: '',
  setupCost: '',
  workingCapital: '',
  expectedRoi: '',
  paybackPeriod: '',
  requiredAreaSqFt: '',
  preferredLocation: '',
  cityPreference: '',
  state: '',
  country: 'India',
  avgMonthlyRevenue: '',
  avgMonthlyProfitMargin: '',
  breakEvenPeriod: '',
  yearsOfOperation: '',
  existingOutlets: '',
  franchiseUnitsRunning: '',
  supportProvided: [],
  experienceRequired: false,
  preferredExperience: '',
  minQualification: '',
  staffRequired: '',
  ownershipType: '',
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
};

export const initialApplicationFormState = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  city: '',
  state: '',
  preferredFranchiseLocation: '',
  availableBudget: '',
  fundingSource: 'Self',
  businessExperience: '',
  currentOccupation: '',
  whyInterested: '',
  hasSpaceAvailable: false,
  expectedStartTimeline: '',
  message: '',
};
