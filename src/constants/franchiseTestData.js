import { SUPPORT_OPTIONS } from './franchiseConstants';

/** Sample franchise listing for admin create/edit form testing */
export function getFranchiseTestFormData() {
  return {
    franchiseName: 'Paradise Biryani Franchise',
    brandName: 'Paradise Food Ventures Pvt Ltd',
    category: 'Food & Beverage',
    subCategory: 'Biryani, Quick Service Restaurant',
    shortDescription:
      'Award-winning biryani brand with proven dine-in and delivery model. Ideal for entrepreneurs seeking a scalable F&B franchise in high-footfall locations.',
    detailedDescription:
      'Paradise Biryani has operated since 2008 with standardized kitchen processes, centralized supply for spices and bases, and strong brand recall in South India.\n\n'
      + 'Franchise partners receive end-to-end support: site evaluation, kitchen layout, staff hiring assistance, launch marketing, and ongoing operations audits.\n\n'
      + 'Typical unit formats include mall food courts (800–1,200 sq ft) and high-street standalone outlets (1,200–2,000 sq ft).',
    minInvestment: 2500000,
    maxInvestment: 4500000,
    franchiseFee: 500000,
    royaltyFeePercent: 6,
    securityDeposit: 200000,
    setupCost: 1800000,
    workingCapital: 500000,
    expectedRoi: '22–28% annually',
    paybackPeriod: '12–18 Months',
    requiredAreaSqFt: 1200,
    preferredLocation: 'Mall',
    cityPreference: 'Hyderabad, Bengaluru, Chennai',
    state: 'Telangana',
    country: 'India',
    avgMonthlyRevenue: 850000,
    avgMonthlyProfitMargin: '18–22%',
    breakEvenPeriod: '14–16 months',
    yearsOfOperation: 16,
    existingOutlets: 85,
    franchiseUnitsRunning: 42,
    supportProvided: [
      SUPPORT_OPTIONS[0],
      SUPPORT_OPTIONS[1],
      SUPPORT_OPTIONS[2],
      SUPPORT_OPTIONS[4],
      SUPPORT_OPTIONS[6],
      SUPPORT_OPTIONS[7],
      SUPPORT_OPTIONS[8],
    ],
    experienceRequired: true,
    preferredExperience: '2+ years in F&B operations or retail management',
    minQualification: 'Graduate; hospitality diploma preferred',
    staffRequired: 12,
    ownershipType: 'Individual',
    displayOrder: 1,
    isActive: true,
  };
}

/** Sample franchise application for public apply form testing */
export function getFranchiseApplicationTestData(options = {}) {
  const franchiseName = options.franchiseName || 'this franchise';
  return {
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma.test@example.com',
    phone: '+91 98765 43210',
    location: 'Hitech City, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    preferredFranchiseLocation: 'Mall / High Street — Kukatpally or Gachibowli',
    availableBudget: 3500000,
    fundingSource: 'Self',
    businessExperience:
      'Managed a cloud kitchen for 3 years with monthly revenue of ₹12–15 lakhs. Familiar with inventory, staffing, and aggregator operations.',
    currentOccupation: 'Restaurant Operations Manager',
    whyInterested:
      `I want to partner with ${franchiseName} because of the brand strength, standardized playbook, and support for first-time franchise owners in the F&B segment.`,
    hasSpaceAvailable: true,
    expectedStartTimeline: 'Within 4–6 months after agreement',
    message:
      'I have shortlisted two commercial spaces (approx. 1,100 sq ft). Happy to share floor plans and locality footfall data on request.',
  };
}
