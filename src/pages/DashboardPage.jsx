import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');

  const handleTemplateSelect = (templateId, opts = {}) => {
    const params = new URLSearchParams({
      templateId,
      newDraft: '1',
    });
    if (opts.presetSector) params.set('presetSector', opts.presetSector);
    // Sector stays editable after auto-select.
    // if (opts.lockSector) params.set('lockSector', '1');
    if (requestId) params.set('requestId', requestId);
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
