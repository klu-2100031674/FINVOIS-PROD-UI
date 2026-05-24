/**
 * CMEP AI chat config + preset prompts.
 * Consumed by SchemeAiChatView via the CMEP page wrappers.
 */

export const CMEP_PRESET_PROMPTS = [
  {
    heading: 'How much is own contribution (cash) required in the project ?',
    prompt:
      'How much is own contribution (cash) required in the project considering my gender , caste and business locality? Please explain in layman language.',
  },
  {
    heading: 'How to apply for CMEP online?',
    prompt:
      'Please explain step by step procedure and what are the documents required for applying in layman language.',
  },
  {
    heading: 'What are the documents required to apply for CMEP online',
    prompt:
      'Please explain the documents required to apply for CMEP portal online in layman language.',
  },
  {
    heading: 'Whether the proposed business mentioned above falls in Negative list.',
    prompt:
      'Whether the proposed business mentioned above falls in Negative list. Explain in detail in layman language.',
  },
  {
    heading: 'How much subsidy is applicable to my business.',
    prompt: 'How much subsidy is applicable to my business. Explain in detail in layman language.',
  },
  {
    heading: 'Eligibility of my business under CMEP.',
    prompt:
      'Whether the proposed business mentioned above full fills all the conditions and norms applicable to CMEP scheme. If No, Am I required to satisfy any other conditions for my eligibility. And If yes, What is the maximum eligible project cost allowed for my mentioned business. Explain in detail in layman language.',
  },
  {
    heading: 'Potential Red Flags for Incentive claim rejection',
    prompt:
      'What are the most common reasons or red flags why incentive claims get rejected, delayed, or recovered . Explain in detail in layman language.',
  },
  {
    heading: 'Common reasons for Bank rejection',
    prompt:
      'Please explain the common reasons for rejection by bank of my PMEGP file in layman language.',
  },
  {
    heading: 'Common reasons for rejection by Implementing agency',
    prompt:
      'Please explain the common reasons for rejection by Implementing agency of my CMEP file in layman language.',
  },
  {
    heading: 'Expected Employment to be generated for the proposed project as per CMEP norms.',
    prompt:
      'What is the Expected Employment to be generated for the proposed project as per CMEP norms. Explain in detail in layman language.',
  },
  {
    heading: 'Documents required for Bank manager for applying for Loan',
    prompt: 'What are the Documents required for Bank manager for applying for Loan under CMEP scheme.',
  },
  {
    heading: 'Explain CMEP Upgradation process.',
    prompt: 'Explain CMEP Upgradation process step by step in layman language.',
  },
  {
    heading: 'Minimum Qualification required for CMEP',
    prompt: 'Minimum Qualification required for CMEP basing upon project cost.',
  },
  {
    heading: 'Maximum Project cost allowed',
    prompt: 'Maximum Project cost allowed under CMEP scheme .',
  },
  {
    heading: 'Maximum Term Loan and Working capital loan allowed',
    prompt:
      'Maximum Term Loan and Working capital loan allowed as per CMEP Norms. Explain in detail in layman language.',
  },
  {
    heading: 'EDP training certificate',
    prompt: 'Within how many days shall I complete my EDP training?',
  },
  {
    heading: 'Ask your own question',
    prompt: '',
    composerOnly: true,
  },
];

export const CMEP_AI_CHAT_CONFIG = {
  headerTitle: 'CMEP AI Chat',
  headerDescription:
    'Answers use the Finvois CMEP knowledge base plus the briefs you submitted in your CMEP form.',
  composerPlaceholder: 'Ask about CMEP Scheme',
  apiPath: '/cmep-ai/chat',
  formStateKey: 'cmepForm',
  presetPrompts: CMEP_PRESET_PROMPTS,
  emptyState: {
    title: 'CMEP AI Assistance',
    intro:
      'Ask questions and get answers strictly from your uploaded CMEP PDF knowledge base and your CMEP form briefs.',
    missingFormMessage:
      'CMEP form data is missing. Please fill the CMEP form first so the AI can answer using your briefs.',
    missingFormLinkLabel: 'Go to CMEP Form',
    exampleQuestions: [
      'What subsidy amount applies to my category and project cost?',
      'Which documents are required based on my situation?',
      'What are the eligibility conditions that match my profile?',
    ],
  },
};
