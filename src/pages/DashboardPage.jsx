import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ClientLayout from '../components/layouts/ClientLayout';
import DashboardAISection from '../components/dashboard/DashboardAISection';
import useGenerateHubPrep from '../hooks/useGenerateHubPrep';
import useAuth from '../hooks/useAuth';

/**
 * Retail Finvois user home (`/dashboard`) — standalone from company org users.
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getProfile } = useAuth();

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  useGenerateHubPrep(dispatch);

  const handleTemplateSelect = (templateId, opts = {}) => {
    const params = new URLSearchParams({
      templateId,
      newDraft: '1',
    });
    if (opts.presetSector) params.set('presetSector', opts.presetSector);
    if (opts.lockSector) params.set('lockSector', '1');
    navigate(`/generate?${params.toString()}`);
  };

  return (
    <ClientLayout>
      <DashboardAISection
        onSelectTemplate={handleTemplateSelect}
        showGenerationModeStep
      />
    </ClientLayout>
  );
};

export default DashboardPage;
