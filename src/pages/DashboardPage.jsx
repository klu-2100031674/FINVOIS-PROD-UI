import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectTemplateLoading } from '../store/slices/templateSlice';
import { Loading } from '../components/common';
import ClientLayout from '../components/layouts/ClientLayout';
import DashboardAISection from '../components/dashboard/DashboardAISection';
import useGenerateHubPrep from '../hooks/useGenerateHubPrep';

/**
 * Retail Finvois user home (`/dashboard`) — standalone from company org users.
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectTemplateLoading);

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

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center py-24">
          <Loading text="Loading dashboard..." />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <DashboardAISection onSelectTemplate={handleTemplateSelect} />
    </ClientLayout>
  );
};

export default DashboardPage;
