/**
 * PMEGP AI chat config + preset prompts.
 * Consumed by SchemeAiChatView via the PMEGP page wrappers.
 */

export const PMEGP_PRESET_PROMPTS = [
  {
    heading: 'How much is own contribution (cash) required in the project?',
    prompt:
      'How much is own contribution (cash) required in the project considering my gender, caste and business locality? Please explain in layman language.',
  },
  {
    heading: 'How to apply for PMEGP online?',
    prompt:
      'Please explain step by step procedure and what are the documents required for applying in layman language.',
  },
  {
    heading: 'What are the documents required to apply for PMEGP online',
    prompt:
      'Please explain the documents required to apply for PMEGP portal online in layman language.',
  },
  {
    heading: 'Whether the proposed business mentioned above falls in Negative list',
    prompt:
      'Whether the proposed business mentioned above falls in Negative list. Explain in layman language.',
  },
  {
    heading: 'How much subsidy is applicable to my business',
    prompt:
      'How much subsidy is applicable to my business. Explain in layman language.',
  },
  {
    heading: 'Eligibility of my business under PMEGP',
    prompt:
      'Whether the proposed business mentioned above full fills all the conditions and norms applicable to PMEGP scheme. If No, Am I required to satisfy any other conditions for my eligibility. And If yes, What is the maximum eligible project cost allowed for my mentioned business. Explain in layman language.',
  },
  {
    heading: 'Potential Red Flags for Incentive claim rejection',
    prompt:
      'What are the most common reasons or red flags why incentive claims get rejected, delayed, or recovered. Explain in layman language.',
  },
  {
    heading: 'Common reasons for Bank rejection',
    prompt:
      'Please explain the common reasons for rejection by bank of my PMEGP file in layman language.',
  },
  {
    heading: 'Common reasons for rejection by Implementing agency',
    prompt:
      'Please explain the common reasons for rejection by Implementing agency of my PMEGP file in layman language.',
  },
  {
    heading: 'Expected Employment to be generated for the proposed project as per PMEGP norms',
    prompt:
      'What is the Expected Employment to be generated for the proposed project as per PMEGP norms. Explain in layman language.',
  },
  {
    heading: 'Documents required for Bank manager for applying for Loan',
    prompt:
      'What are the Documents required for Bank manager for applying for Loan under PMEGP scheme.',
  },
  {
    heading: 'Explain PMEGP Upgradation process',
    prompt: 'Explain PMEGP Upgradation process step by step in layman language.',
  },
  {
    heading: 'Minimum Qualification required for PMEGP',
    prompt: 'Minimum Qualification required for PMEGP basing upon project cost.',
  },
  {
    heading: 'Maximum Project cost allowed',
    prompt: 'Maximum Project cost allowed under PMEGP scheme.',
  },
  {
    heading: 'Maximum Term Loan and Working capital loan allowed',
    prompt:
      'Maximum Term Loan and Working capital loan allowed as per PMEGP Norms. Explain in layman language.',
  },
  {
    heading: 'EDP training certificate',
    prompt: 'Within how many days shall I complete my EDP training?',
  },
];

export const PMEGP_AI_CHAT_CONFIG = {
  headerTitle: 'PMEGP AI Chat',
  headerDescription:
    'Answers use the Finvois PMEGP knowledge base plus the briefs you submitted in your PMEGP form.',
  composerPlaceholder: 'Ask about PMEGP Scheme',
  apiPath: '/pmegp-ai/chat',
  formStateKey: 'pmegpForm',
  presetPrompts: PMEGP_PRESET_PROMPTS,
  emptyState: {
    title: 'PMEGP AI Assistance',
    intro:
      'Ask questions and get answers strictly from your uploaded PMEGP PDF knowledge base and your PMEGP form briefs.',
    missingFormMessage:
      'PMEGP form data is missing. Please fill the PMEGP form first so the AI can answer using your briefs.',
    missingFormLinkLabel: 'Go to PMEGP Form',
    exampleQuestions: [
      'What subsidy amount applies to my category and project cost?',
      'Which documents are required based on my situation?',
      'What are the eligibility conditions that match my profile?',
    ],
  },
};
