/** Logged-in AP IDP form flow (mirror of PMEGP `/generate/pmegp` flow). */
export const AP_IDP_GENERATE_PATH = '/generate/ap-idp';

/** Post–AP IDP form follow-up mail flow. */
export const AP_IDP_SCHEME_MAIL_PATH = '/generate/ap-idp/scheme-mail';

/** AI-powered AP IDP assistance chat. */
export const AP_IDP_AI_CHAT_PATH = '/generate/ap-idp/ai-chat';

/** Public AP IDP form (`/schemes/ap-idp` — no login, no app sidebar). */
export const PUBLIC_AP_IDP_FORM_PATH = '/schemes/ap-idp';
export const PUBLIC_AP_IDP_SCHEME_MAIL_PATH = '/schemes/ap-idp/support';
export const PUBLIC_AP_IDP_AI_CHAT_PATH = '/schemes/ap-idp/ai-chat';

export {
  TOPIC_OPTIONS as CHALLENGE_OPTIONS,
  PRE_ESTABLISHMENT_TOPICS,
  POST_ESTABLISHMENT_TOPICS,
  topicsForStage,
  optionNameForMail,
} from '../../../constants/establishmentSupportTopics';
