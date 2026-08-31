import React from 'react';
import PublicSchemeAiChat from '../../../components/schemeFinder/PublicSchemeAiChat';
import { PMEGP_SUGGESTIONS } from './pmegpAiChatConfig';

export default function PublicPmegpAiChatPage() {
  return (
    <PublicSchemeAiChat
      schemeName="PMEGP"
      schemeKey="pmegp"
      formSessionKey="pmegpForm"
      suggestions={PMEGP_SUGGESTIONS}
      hasAiButton={true}
    />
  );
}
