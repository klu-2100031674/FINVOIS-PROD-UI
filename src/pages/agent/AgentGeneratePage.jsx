import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AgentLayout } from '../../components/layouts';
import AIAssistant from '../../components/dashboard/AIAssistant';
import { clearGeneratedExcel, clearFormData, clearRelatedDocuments } from '../../store/slices/reportSlice';

const AgentGeneratePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const assistedUserId = searchParams.get('assistedUserId') || '';
    const reportHelpId = searchParams.get('reportHelpId') || '';

    useEffect(() => {
        dispatch(clearGeneratedExcel());
        dispatch(clearFormData());
        dispatch(clearRelatedDocuments());
    }, [dispatch]);

    const handleTemplateSelect = (templateId, opts = {}) => {
        const params = new URLSearchParams({
            templateId,
            newDraft: '1',
        });
        if (opts.presetSector) params.set('presetSector', opts.presetSector);
        if (opts.lockSector) params.set('lockSector', '1');
        if (assistedUserId) params.set('assistedUserId', assistedUserId);
        if (reportHelpId) params.set('reportHelpId', reportHelpId);
        navigate(`/generate?${params.toString()}`);
    };

    return (
        <AgentLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Report Generator</h1>
                    <p className="text-gray-500 mt-2">
                        {assistedUserId
                            ? 'Select a template to generate a report for your referred client.'
                            : 'Use our AI Assistant to find the perfect report template for your client.'}
                    </p>
                </div>

                <AIAssistant onSelectTemplate={handleTemplateSelect} showHeader={false} />
            </div>
        </AgentLayout>
    );
};

export default AgentGeneratePage;
