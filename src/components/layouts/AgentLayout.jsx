/**
 * Agent Layout Component
 * Provides sidebar navigation for agent users
 */

import React, { useState } from 'react';
import AgentSidebar from '../../pages/agent/AgentSidebar';

const AgentLayout = ({ children, activeTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
      />

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        {children}
      </main>
    </div>
  );
};

export default AgentLayout;
