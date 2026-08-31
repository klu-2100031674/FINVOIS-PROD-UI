/**
 * CMEP AI chat suggestion prompts.
 *
 * Shape:
 * - heading: chip label shown in the UI
 * - prompt: full question sent to the API
 * - ids: optional form question numbers whose answers are packed with the prompt.
 *        Uncomment and fill per suggestion when you want scoped RAG context.
 *        If omitted / commented, the complete form is sent (same as a typed question).
 *
 * Question map (form labels): 1–43 main Qs, 44 Document Readiness, 45 Additional info.
 * Q30 = Estimated Total Project Cost (assets + working capital + totals).
 * Consumed by PublicCmepAiChatPage.
 */

export const CMEP_SUGGESTIONS = [
  {
    heading: 'Generate a Client and Business profile for bank analyses',
    prompt:
      'Create a professional Client & Business Profile document with its complete structure for bank analysis purpose.',
    // ids: [],
  },
  {
    heading: 'How much is own contribution (cash) required in the project ?',
    prompt:
      'How much is own contribution (cash) required in the project considering my gender , caste and business locality? Please explain in layman language.',
    // ids: [],
  },
  {
    heading: 'How to apply for CMEP online?',
    prompt:
      'Please explain step by step procedure and what are the documents required for applying in layman language.',
    // ids: [],
  },
  {
    heading: 'What are the documents required to apply for CMEP online',
    prompt: 'Please explain the documents required to apply for CMEP portal online in layman language.',
    // ids: [],
  },
  {
    heading: 'Whether the proposed business mentioned above falls in Negative list.',
    prompt:
      'Whether the proposed business mentioned above falls in Negative list. Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'How much subsidy is applicable to my business.',
    prompt: 'How much subsidy is applicable to my business. Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'Eligibility of my business under CMEP.',
    prompt:
      'Whether the proposed business mentioned above full fills all the conditions and norms applicable to CMEP scheme. If No, Am I required to satisfy any other conditions for my eligibility. And If yes, What is the maximum eligible project cost allowed for my mentioned business. Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'Potential Red Flags for Incentive claim rejection',
    prompt:
      'What are the most common reasons or red flags why incentive claims get rejected, delayed, or recovered . Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'Common reasons for Bank rejection',
    prompt: 'Please explain the common reasons for rejection by bank of my CMEP file in layman language.',
    // ids: [],
  },
  {
    heading: 'Common reasons for rejection by Implementing agency',
    prompt:
      'Please explain the common reasons for rejection by Implementing agency of my CMEP file in layman language.',
    // ids: [],
  },
  {
    heading: 'Expected Employment to be generated for the proposed project as per CMEP norms.',
    prompt:
      'What is the Expected Employment to be generated for the proposed project as per CMEP norms. Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'Documents required for Bank manager for applying for Loan',
    prompt: 'What are the Documents required for Bank manager for applying for Loan under CMEP scheme.',
    // ids: [],
  },
  {
    heading: 'Explain CMEP Upgradation process.',
    prompt: 'Explain CMEP Upgradation process step by step in layman language.',
    // ids: [],
  },
  {
    heading: 'Minimum Qualification required for CMEP',
    prompt: 'Minimum Qualification required for CMEP basing upon project cost.',
    // ids: [],
  },
  {
    heading: 'Maximum Project cost allowed',
    prompt: 'Maximum Project cost allowed under CMEP scheme .',
    // ids: [],
  },
  {
    heading: 'Maximum Term Loan and Working capital loan allowed',
    prompt:
      'Maximum Term Loan and Working capital loan allowed as per CMEP Norms. Explain in detail in layman language.',
    // ids: [],
  },
  {
    heading: 'EDP training certificate',
    prompt: 'Within how many days shall I complete my EDP training?',
    // ids: [],
  },
];
