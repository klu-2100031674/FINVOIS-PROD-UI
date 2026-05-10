import React from 'react';
import AIAssistant from './AIAssistant';

/**
 * Shared AI-assisted template picker used on retail and org user dashboards.
 */
export default function DashboardAISection({ onSelectTemplate }) {
  return (
    <div className="py-2 sm:py-4">
      <div className="mb-12">
        <AIAssistant onSelectTemplate={onSelectTemplate} />
      </div>
    </div>
  );
}
