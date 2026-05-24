/**
 * AP IDP 4.0 AI chat config + preset prompts (grouped by topic).
 * Consumed by SchemeAiChatView via the AP IDP page wrappers.
 * UI shows `heading` only; `prompt` is sent to the API.
 */

export const AP_IDP_PRESET_PROMPT_TOPICS = [
  {
    topic: 'Ineligibility and conditions',
    prompts: [
      {
        heading: 'Whether the proposed business mentioned above falls in Ineligible Industries list.',
        prompt:
          'Whether the proposed business mentioned above falls in Ineligible Industries list. Explain in layman language.',
      },
      {
        heading: 'Whether the proposed business mentioned above falls in Food Processing policy 4.0.',
        prompt:
          'Whether the proposed business mentioned above falls in food processing policy 4.0 . Explain in layman language.',
      },
    ],
  },
  {
    topic: 'Fixed capital investment (FCI)',
    prompts: [
      {
        heading: 'Explain FCI documentation requirements',
        prompt: 'Explain FCI documentation requirements. Please explain in layman language.',
      },
    ],
  },
  {
    topic: 'Certifications required',
    prompts: [
      {
        heading: 'Certifications required from a CA',
        prompt:
          'What does a CA must certify on their letterhead. Please explain in layman language.',
        includeComputation: false,
      },
      {
        heading: 'CA Certificate format wording',
        prompt: 'Please provide sample CA Certification format wording.',
        includeComputation: false,
      },
      {
        heading: 'Combined Fixed Capital Investment + Employment Certificate format',
        prompt: 'Please provide me combined FCI + Employment Certificate format',
        includeComputation: false,
      },
      {
        heading: 'Chartered Engineer Certificate format for De-carbonization',
        prompt: 'Please provide Chartered Engineer Certificate format for De-carbonization',
      },
    ],
  },
  {
    topic: 'Documents / formats required',
    prompts: [
      {
        heading: 'Incentive-Specific Documents',
        prompt:
          'What are the Incentive-Specific Documents required ? Explain in layman language in tabular format.',
      },
      {
        heading: 'Project & Investment Related Documents',
        prompt:
          'What are the Project & Investment Related Documents required? Explain in layman language in tabular format.',
      },
      {
        heading: 'Core Documents Mandatorily required for All Claims',
        prompt:
          'What are the Core Documents Mandatorily required for All Claims? Explain in layman language.',
      },
      {
        heading: 'Documents and Compliances required for all incentive claims',
        prompt:
          'List of Documents needed, Deeds needed, Registration certificates needed, bills needed, Invoices needed, Certifications need to be obtained, Annexure-specific requirements, Forms required, any Other Compliances required for all incentive claims. Explain in layman language.',
      },
      {
        heading:
          'A separate Annexure format (for Land, Building, Machinery & Employment) to attach with this certificate',
        prompt:
          'Please provide A separate Annexure format (for Land, Building, Machinery & Employment) to attach with this certificate',
      },
      {
        heading: 'De-carbonization specific Annexure format',
        prompt: 'Please provide De-carbonization specific Annexure format',
      },
    ],
  },
  {
    topic: 'Incentives',
    prompts: [
      {
        heading: 'Common Rules Applicable to All Incentives.',
        prompt:
          'Common Rules Applicable to All Incentives - claim timelines, continuous production period, change of constitution/location approval, break in production rules, and other applicable rules, etc. Explain in layman language.',
        promptType: 'common_rules',
        includeComputation: false,
      },
      {
        heading: 'briefed list of all categories of Subsidies or all Incentives available',
        prompt:
          'please provide a briefed list of all categories of Subsidies or all Incentives or reimbursements available for the mentioned business, like investment subsidy, Power cost subsidy, Net SGST reimbursement, Skill upgradation costs, energy and water audit cost, local procurement subsidy, quality certification cost top up, Technology Upgradation cost subsidy, Employment subsidy, reimbursement of stamp duty, transfer duty& land conversion charges. And also incentive caps for each category, disbursement years. Explain in layman language.',
      },
      {
        heading: 'Incentive Eligibility amount and Caps for each category',
        prompt:
          'Please provide Incentive eligibility amount and cap for each category in tabular format in layman language.',
      },
      {
        heading: 'Incentive disbursement period for each category',
        prompt:
          'Please provide Incentive disbursement period for each category in tabular format in layman language.',
      },
      {
        heading:
          'Does my business falls under special category and are there any special category benefits/Incentives if any applicable?',
        prompt:
          'Does my business falls under special category and are there any special category benefits if any applicable. If yes, please provide me the list of incentives available and incentive caps for each category, disbursement years.',
      },
      {
        heading: 'Incentive Specific terms and conditions',
        prompt:
          'Incentive Specific terms and conditions related to investment, production capacity utilisation. Explain in layman language.',
      },
      {
        heading: 'Guidelines, Terms & Conditions, Compliance',
        prompt:
          'General Guidelines, Terms & Conditions, Compliance for your mentioned business, Plant and Machinery, Land, Building, Employment to be generated , production capacity milestones, Change of Constitution / Location / Management, Compliances linked with Date of Commercial production, Asset Transfer / Asset Sale / Asset Lease,. Explain in layman language.',
      },
    ],
  },
  {
    topic: 'Compliances and procedures',
    prompts: [
      {
        heading: 'Potential Red Flags for Incentive claim rejection',
        prompt:
          'What are the most common reasons or red flags why incentive claims get rejected, delayed, or recovered (with interest + penalty). Explain in layman language.',
      },
      {
        heading: 'Documents required for Bank manager for applying for Loan',
        prompt: 'What are the Documents required for Bank manager for applying for Loan under AP IDP.',
      },
      {
        heading: 'Common reasons for Bank rejection',
        prompt: 'Please explain the common reasons for rejection by bank in layman language.',
      },
      {
        heading: 'Common reasons for rejection by Implementing agency',
        prompt:
          'Please explain the common reasons for rejection by Implementing agency in layman language.',
      },
      {
        heading: 'Comprehensive comparison table of timelines for different categories.',
        prompt:
          'Please provide a Comprehensive comparison table of timelines for different categories (like Standard Investment Period from CFE, Claim Filing Deadline (Full Benefit), Continuous Production Requirement, Penalty for Delay in DCP, Asset Sale / Transfer Restriction) under Andhra Pradesh IDP 4.0 Policy.',
      },
      {
        heading: 'Mandatory Compliances required to be maintained throughout the incentive period .',
        prompt:
          'What are the Mandatory Compliances required to be maintained throughout the incentive period (6 or 8 years)',
      },
      {
        heading: 'Quick summary check list before filing Claim on Portal (AP Single Desk)',
        prompt:
          'Please provide quick summary check list before filing claim on portal AP Single desk in layman language.',
      },
      {
        heading: 'What are the Additional Documents required to be maintained by Special Category persons?',
        prompt:
          'What are the Additional Documents required to be maintained by Special Category persons? Explain in layman language.',
      },
      {
        heading: 'Other Terms & Conditions or Norms to be followed',
        prompt:
          'Any other Terms & Conditions or Norms to be followed not covered in above section. Explain in layman language.',
      },
      {
        heading: 'Procedure for Claiming Incentives',
        prompt: 'What is the Procedure for Claiming Various Incentives. Explain in layman language.',
      },
    ],
  },
];

export const AP_IDP_AI_CHAT_CONFIG = {
  headerTitle: 'AP IDP AI Chat',
  headerDescription:
    'Answers use the Finvois AP IDP 4.0 knowledge base plus the briefs you submitted in your AP IDP form.',
  composerPlaceholder: 'Ask about AP IDP 4.0',
  apiPath: '/ap-idp-ai/chat',
  formStateKey: 'apIdpForm',
  presetPromptTopics: AP_IDP_PRESET_PROMPT_TOPICS,
  emptyState: {
    title: 'AP-IDP AI Assistance',
    intro:
      'Ask questions and get answers strictly from the AP IDP 4.0 knowledge base and the briefs you submitted in your AP IDP form. Use the sparkles button next to Send to browse suggested questions by topic.',
    missingFormMessage:
      'AP IDP form data is missing. Please fill the AP IDP form first so the AI can answer using your briefs.',
    missingFormLinkLabel: 'Go to AP IDP Form',
    exampleQuestions: [
      'Which incentives under AP IDP 4.0 apply to my category and project size?',
      'Which documents are required based on my legal structure?',
      'What are the eligibility conditions that match my profile?',
    ],
  },
};
