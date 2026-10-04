export const PMEGP_GENERATE_PATH = '/generate/pmegp';

/** Post–PMEGP form follow-up mail flow. */
export const PMEGP_SCHEME_MAIL_PATH = '/generate/pmegp/scheme-mail';

/** AI-powered PMEGP assistance chat. */
export const PMEGP_AI_CHAT_PATH = '/generate/pmegp/ai-chat';

/** Public PMEGP form (`/schemes/pmegp` — no login, no app sidebar). */
export const PUBLIC_PMEGP_FORM_PATH = '/schemes/pmegp';
export const PUBLIC_PMEGP_SCHEME_MAIL_PATH = '/schemes/pmegp/support';
export const PUBLIC_PMEGP_AI_CHAT_PATH = '/schemes/pmegp/ai-chat';

export {
  TOPIC_OPTIONS as CHALLENGE_OPTIONS,
  PRE_ESTABLISHMENT_TOPICS,
  POST_ESTABLISHMENT_TOPICS,
  topicsForStage,
  optionNameForMail,
} from '../../../constants/establishmentSupportTopics';
