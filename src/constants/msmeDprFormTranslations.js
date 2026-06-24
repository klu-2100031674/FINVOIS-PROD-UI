/** MSME DPR lead form — UI copy and Telugu dropdown labels (values stay English for API). */

export const MSME_WEBSITE_URL = 'https://apmsmeone.ap.gov.in';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
];

export const FORM_COPY = {
  en: {
    microLabel: 'Data Submission Form',
    formTitle: 'AI DPR PREPARATION',
    languageLabel: 'Language:',
    fillTestData: 'Fill test data',
    selectGender: 'Select gender',
    selectScheme: 'Select scheme',
    selectLoanType: 'Select loan type',
    selectCategory: 'Select category',
    applicantName: 'Name of Applicant',
    gender: 'Gender',
    mobileNumber: 'Mobile Number',
    natureOfBusiness: 'Nature of Business',
    schemeAppliedUnder: 'Scheme Applied Under',
    loanType: 'Loan Type',
    ruralUrbanCategory: 'Rural / Urban Category',
    villageCity: 'Village / City',
    mandal: 'Mandal',
    district: 'District',
    needCaStamp: 'Need CA Stamp?',
    selectNeedCaStamp: 'Select option',
    description: 'Description',
    submit: 'Submit',
    submitting: 'Submitting...',
    successTitle: 'Thank you! Your submission has been received.',
    successBody: 'We will get back to you as soon as possible.',
    submitAnother: 'Submit Another Response',
    redirectMsmeWebsite: 'Redirect to MSME website',
    disclaimer: 'Your details will be shared with the Finvois team for follow up.',
    placeholderApplicantName: 'Enter applicant name',
    placeholderMobile: '10-digit mobile number',
    placeholderNatureOfBusiness: 'Enter nature of business',
    placeholderVillageCity: 'Enter village or city',
    placeholderMandal: 'Enter mandal',
    placeholderDistrict: 'Enter district',
    placeholderDescription: 'Enter description',
    submitError: 'Failed to submit form',
  },
  te: {
    microLabel: 'డేటా సమర్పణ ఫారమ్',
    formTitle: 'ఏఐ డిపిఆర్ ప్రిపరేషన్',
    languageLabel: 'భాష:',
    fillTestData: 'పరీక్ష డేటా నింపండి',
    selectGender: 'లింగం ఎంచుకోండి',
    selectScheme: 'పథకం ఎంచుకోండి',
    selectLoanType: 'రుణ రకం ఎంచుకోండి',
    selectCategory: 'వర్గం ఎంచుకోండి',
    applicantName: 'దరఖాస్తుదారు పేరు',
    gender: 'లింగం',
    mobileNumber: 'మొబైల్ నంబర్',
    natureOfBusiness: 'వ్యాపార స్వరూపం',
    schemeAppliedUnder: 'దరఖాస్తు చేసిన పథకం',
    loanType: 'రుణ రకం',
    ruralUrbanCategory: 'గ్రామీణ / నగర వర్గం',
    villageCity: 'గ్రామం / నగరం',
    mandal: 'మండలం',
    district: 'జిల్లా',
    needCaStamp: 'CA స్టాంప్ అవసరమా?',
    selectNeedCaStamp: 'ఎంపికను ఎంచుకోండి',
    description: 'వివరణ',
    submit: 'సమర్పించండి',
    submitting: 'సమర్పిస్తోంది...',
    successTitle: 'ధన్యవాదాలు! మీ సమర్పణ అందుకుంది.',
    successBody: 'మేము వీలైనంత త్వరగా మీకు తిరిగి సంప్రదిస్తాము.',
    submitAnother: 'మరొక సమర్పణ చేయండి',
    redirectMsmeWebsite: 'ఎంఎస్ఎంఈ వెబ్‌సైట్‌కు వెళ్లండి',
    disclaimer:
      'మీ వివరాలు తదుపరి చర్య కోసం ఫిన్వాయిస్ బృందంతో పంచబడతాయి.',
    placeholderApplicantName: 'దరఖాస్తుదారు పేరు నమోదు చేయండి',
    placeholderMobile: '10 అంకెల మొబైల్ నంబర్',
    placeholderNatureOfBusiness: 'వ్యాపార స్వరూపం నమోదు చేయండి',
    placeholderVillageCity: 'గ్రామం లేదా నగరం నమోదు చేయండి',
    placeholderMandal: 'మండలం నమోదు చేయండి',
    placeholderDistrict: 'జిల్లా నమోదు చేయండి',
    placeholderDescription: 'వివరణ నమోదు చేయండి',
    submitError: 'ఫారమ్ సమర్పించడం విఫలమైంది',
  },
};

const GENDER_LABELS_TE = {
  Male: 'పురుషుడు',
  Female: 'స్త్రీ',
  Other: 'ఇతర',
};

const SCHEME_LABELS_TE = {
  'AP IDP 4.0': 'ఏపీ ఐడిపి 4.0',
  'Industrial park Land Allotment': 'ఇండస్ట్రియల్ పార్క్ భూమి కేటాయింపు',
  PMEGP: 'పిఎంఈజిపి',
  Mudra: 'ముద్రా',
  PMFME: 'పిఎంఎఫ్ఎంఈ',
  PMMSY: 'పిఎంఎంఎస్వై',
  'Startup India': 'స్టార్టప్ ఇండియా',
  'NLM scheme': 'ఎన్ఎల్ఎం పథకం',
  CMEP: 'సిఎంఈపి',
  'Other MSME': 'ఇతర ఎంఎస్ఎంఈ',
};

const LOAN_TYPE_LABELS_TE = {
  'Term Loan': 'టర్మ్ లోన్',
  'Term Loan and working capital loan': 'టర్మ్ లోన్ మరియు వర్కింగ్ క్యాపిటల్ లోన్',
  'Working capital or OD Loan': 'వర్కింగ్ క్యాపిటల్ లేదా ఓడి లోన్',
};

const RURAL_URBAN_LABELS_TE = {
  'Rural(Panchayat)': 'గ్రామీణ (పంచాయతీ)',
  'Urban(Other than Panchayat)': 'నగర (పంచాయతీ కాకుండా)',
};

const YES_NO_LABELS_TE = {
  Yes: 'అవును',
  No: 'కాదు',
};

const LABEL_MAPS = {
  gender: GENDER_LABELS_TE,
  scheme: SCHEME_LABELS_TE,
  loanType: LOAN_TYPE_LABELS_TE,
  ruralUrban: RURAL_URBAN_LABELS_TE,
  needCaStamp: YES_NO_LABELS_TE,
};

/**
 * @param {'en'|'te'} lang
 * @param {'gender'|'scheme'|'loanType'|'ruralUrban'|'needCaStamp'} group
 * @param {string} value — English enum value stored in form state
 */
export function getOptionLabel(lang, group, value) {
  if (!value) return '';
  if (lang === 'en') return value;
  return LABEL_MAPS[group]?.[value] || value;
}

export const MSME_DPR_TEST_FORM = {
  applicantName: 'P Balaji',
  gender: 'Male',
  mobileNumber: '9876543210',
  natureOfBusiness: 'Manufacturing',
  schemeAppliedUnder: 'PMEGP',
  loanType: 'Term Loan',
  ruralUrbanCategory: 'Rural(Panchayat)',
  villageCity: 'Vijayawada',
  mandal: 'Penamaluru',
  district: 'Krishna',
  needCaStamp: 'No',
  description: 'Test MSME DPR lead submission.',
};
