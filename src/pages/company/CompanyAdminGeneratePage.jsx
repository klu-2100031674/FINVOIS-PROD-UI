import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectTemplateLoading } from '../../store/slices/templateSlice';
import { Loading } from '../../components/common';
import { AdminLayout } from '../../components/layouts';
import DashboardAISection from '../../components/dashboard/DashboardAISection';
import useGenerateHubPrep from '../../hooks/useGenerateHubPrep';

/**
 * Company admin generate hub (`/company/generate`) — separate file from retail dashboard.
 */
const CompanyAdminGeneratePage = () => {
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
      <AdminLayout>
        <div className="flex justify-center py-24">
          <Loading text="Loading..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <DashboardAISection onSelectTemplate={handleTemplateSelect} />
    </AdminLayout>
  );
};

export default CompanyAdminGeneratePage;
