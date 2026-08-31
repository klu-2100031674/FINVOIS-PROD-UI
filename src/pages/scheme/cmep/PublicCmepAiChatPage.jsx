import React from 'react';
import PublicSchemeAiChat from '../../../components/schemeFinder/PublicSchemeAiChat';
import { CMEP_SUGGESTIONS } from './cmepAiChatConfig';

export default function PublicCmepAiChatPage() {
  return (
    <PublicSchemeAiChat
      schemeName="CMEP"
      schemeKey="cmep"
      formSessionKey="cmepForm"
      suggestions={CMEP_SUGGESTIONS}
      hasAiButton={true}
    />
  );
}
