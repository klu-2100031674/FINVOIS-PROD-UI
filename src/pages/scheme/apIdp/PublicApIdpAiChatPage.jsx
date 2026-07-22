import React from 'react';
import PublicSchemeAiChat from '../../../components/schemeFinder/PublicSchemeAiChat';

const APIDP_SUGGESTIONS = [
  {
    topic: 'General',
    questions: [
      {
        heading: 'Generate a Client and Business profile for bank analyses',
        prompt: 'Create a professional Client & Business Profile document with its complete structure for bank analysis purpose.',
      },
    ],
  },
  {
    topic: 'INELIGIBILITY AND CONDITIONS',
    questions: [
      {
        heading: 'Whether the proposed business mentioned above falls in Ineligible Industries list.',
        prompt: 'Whether the proposed business mentioned above falls in Ineligible Industries list. Explain in detail in layman language.',
      },
      {
        heading: 'Whether the proposed business mentioned above falls in Food Processing policy 4.0.',
        prompt: 'Whether the proposed business mentioned above falls in food processing policy 4.0 . Explain in detail in layman language.',
      },
      {
        heading: 'In case of Expansion project , Conditions for Expansion',
        prompt: 'What are the Conditions for Expansion as per AP IDP 4.0 ? Please explain in detail in layman language .',
      },
      {
        heading: 'In case of Diversification project, Conditions for Diversification',
        prompt: 'What are the Conditions for Diversification as per AP IDP 4.0? Please explain in detail in layman language.',
      },
    ],
  },
  {
    topic: 'FIXED CAPITAL INVESTMENT',
    questions: [
      {
        heading: 'Eligible Fixed Capital Investment for my Business',
        prompt: 'What is the Eligible Fixed Capital Investment in the mentioned business for computation of Incentives. Explain in detail in layman language.',
      },
      {
        heading: 'Items not to be included in Fixed Capital Investment',
        prompt: 'List of Items explicitly excluded from Fixed Capital Investment and not computable towards fixed capital investment in your business. Explain in detail in layman language.',
      },
      {
        heading: 'How to prepare FCI statement',
        prompt: 'Explain step-by-step guide on how to prepare FCI statement. Please explain in detail in layman language.',
      },
      {
        heading: 'Requirements of FCI file',
        prompt: 'What are the final requirements for FCI file ? Please explain in detail in layman language.',
      },
      {
        heading: 'Explain FCI documentation requirements',
        prompt: 'Explain FCI documentation requirements. Please explain in detail in layman language.',
      },
      {
        heading: 'In case of Expansion / Diversification projects, how to calculate Original Fixed Capital Investment?',
        prompt: 'How to calculate Original FCI and how much is such in my mentioned business? Please explain in detail in layman language.',
      },
    ],
  },
  {
    topic: 'CERTIFICATIONS REQUIRED',
    questions: [
      {
        heading: 'Certifications required from a CA',
        prompt: 'What does a CA must certify on their letterhead. Please explain in detail in layman language.',
      },
      {
        heading: 'CA Certificate format wording',
        prompt: 'Please provide sample CA Certification format wording.',
      },
      {
        heading: 'Combined Fixed Capital Investment + Employment Certificate format',
        prompt: 'Please provide me combined FCI + Employment Certificate format',
      },
      {
        heading: 'Chartered Engineer Certificate format for De-carbonization',
        prompt: 'Please provide Chartered Engineer Certificate format for De-carbonization',
      },
    ],
  },
  {
    topic: 'DOCUMENTS / FORMATS REQUIRED',
    questions: [
      {
        heading: 'Incentive-Specific Documents',
        prompt: 'What are the Incentive-Specific Documents required ? Explain in detail in layman language in tabular format.',
      },
      {
        heading: 'Project & Investment Related Documents',
        prompt: 'What are the Project & Investment Related Documents required? Explain in detail in layman language in tabular format.',
      },
      {
        heading: 'Core Documents Mandatorily required for All Claims',
        prompt: 'What are the Core Documents Mandatorily required for All Claims? Explain in detail in layman language.',
      },
      {
        heading: 'Documents and Compliances required for all incentive claims',
        prompt: 'List of Documents needed, Deeds needed, Registration certificates needed, bills needed, Invoices needed, Certifications need to be obtained, Annexure-specific requirements, Forms required, any Other Compliances required for all incentive claims. Explain in detail in layman language.',
      },
      {
        heading: 'A separate Annexure format (for Land, Building, Machinery & Employment) to attach with this certificate',
        prompt: 'Please provide A separate Annexure format (for Land, Building, Machinery & Employment) to attach with this certificate',
      },
      {
        heading: 'De-carbonization specific Annexure format',
        prompt: 'Please provide De-carbonization specific Annexure format',
      },
    ],
  },
  {
    topic: 'INCENTIVES',
    questions: [
      {
        heading: 'Common Rules Applicable to All Incentives.',
        prompt: 'Common Rules Applicable to All Incentives - claim timelines, continuous production period, change of constitution/location approval, break in production rules, and other applicable rules, etc. Explain in detail in layman language.',
      },
      {
        heading: 'Detailed list of all categories of Subsidies or all Incentives available',
        prompt: 'please provide a detailed list of all categories of Subsidies or all Incentives or reimbursements available for the mentioned business, like investment subsidy, Power cost subsidy, Net SGST reimbursement, Skill upgradation costs, energy and water audit cost, local procurement subsidy, quality certification cost top up, Technology Upgradation cost subsidy, Employment subsidy, reimbursement of stamp duty, transfer duty& land conversion charges. And also incentive caps for each category, disbursement years. Explain in detail in layman language.',
      },
      {
        heading: 'Incentive Eligibility amount and Caps for each category',
        prompt: 'Please provide Incentive eligibility amount and cap for each category in tabular format in layman language.',
      },
      {
        heading: 'Incentive disbursement period for each category',
        prompt: 'Please provide Incentive disbursement period for each category in tabular format in layman language.',
      },
      {
        heading: 'Does my business falls under special category and are there any special category benefits/Incentives if any applicable?',
        prompt: 'Does my business falls under special category and are there any special category benefits if any applicable. If yes, please provide me the list of incentives available and incentive caps for each category, disbursement years.',
      },
      {
        heading: 'Incentive Specific terms and conditions',
        prompt: 'Incentive Specific terms and conditions related to investment, production capacity utilisation. Explain in detail in layman language.',
      },
      {
        heading: 'Guidelines, Terms & Conditions, Compliance',
        prompt: 'General Guidelines, Terms & Conditions, Compliance for your mentioned business, Plant and Machinery, Land, Building, Employment to be generated , production capacity milestones, Change of Constitution / Location / Management, Compliances linked with Date of Commercial production, Asset Transfer / Asset Sale / Asset Lease,. Explain in detail in layman language.',
      },
      {
        heading: 'In case not achieved Date of Commencement of Commercial Production within the standard investment period.',
        prompt: 'How to calculate exact penalty amount in case not achieved Date of Commencement of Commercial Production within the standard investment period in layman language.',
      },
    ],
  },
  {
    topic: 'COMPLIANCES AND PROCEDURES',
    questions: [
      {
        heading: 'Potential Red Flags for Incentive claim rejection',
        prompt: 'What are the most common reasons or red flags why incentive claims get rejected, delayed, or recovered (with interest + penalty). Explain in detail in layman language.',
      },
      {
        heading: 'Comprehensive comparison table of timelines for different categories.',
        prompt: 'Please provide a Comprehensive comparison table of timelines for different categories (like Standard Investment Period from CFE, Claim Filing Deadline (Full Benefit), Continuous Production Requirement, Penalty for Delay in DCP, Asset Sale / Transfer Restriction) under Andhra Pradesh IDP 4.0 Policy.',
      },
      {
        heading: 'Mandatory Compliances required to be maintained throughout the incentive period .',
        prompt: 'What are the Mandatory Compliances required to be maintained throughout the incentive period (6 or 8 years)',
      },
      {
        heading: 'Quick summary check list before filing Claim on Portal (AP Single desk)',
        prompt: 'Please provide quick summary check list before filing claim on portal AP Single desk in layman language.',
      },
      {
        heading: 'What are the Additional Documents required to be maintained by Special Category persons?',
        prompt: 'What are the Additional Documents required to be maintained by Special Category persons? Explain in detail in layman language.',
      },
      {
        heading: 'Other Terms & Conditions or Norms to be followed',
        prompt: 'Any other Terms & Conditions or Norms to be followed not covered in above section. Explain in detail in layman language.',
      },
      {
        heading: 'Procedure for Claiming Incentives',
        prompt: 'What is the Procedure for Claiming Various Incentives. Explain in detail in layman language.',
      },
      {
        heading: 'What is the base consumption in case of Reimbursement of power cost ?',
        prompt: 'What is the base consumption in case of Reimbursement of power cost?',
      },
      {
        heading: 'How to calculate the Base Employment?',
        prompt: 'How to calculate Base Employment? Please explain in detail in layman language.',
      },
    ],
  },
];

export default function PublicApIdpAiChatPage() {
  return (
    <PublicSchemeAiChat
      schemeName="AP IDP 4.0"
      schemeKey="ap-idp"
      formSessionKey="apIdpForm"
      suggestions={APIDP_SUGGESTIONS}
      hasAiButton={true}
    />
  );
}
