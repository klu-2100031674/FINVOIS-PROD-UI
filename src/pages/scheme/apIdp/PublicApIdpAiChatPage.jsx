import React from 'react';
import PublicSchemeAiChat from '../../../components/schemeFinder/PublicSchemeAiChat';
import { APIDP_SUGGESTIONS } from './apIdpAiChatConfig';

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
