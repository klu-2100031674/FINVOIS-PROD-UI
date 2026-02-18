import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AgentLayout } from '../../components/layouts';
import AIAssistant from '../../components/dashboard/AIAssistant';
import { clearGeneratedExcel, clearFormData, clearRelatedDocuments } from '../../store/slices/reportSlice';

const AgentGeneratePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(clearGeneratedExcel());
        dispatch(clearFormData());
        dispatch(clearRelatedDocuments());
    }, [dispatch]);

    const handleTemplateSelect = (templateId) => {
        // Navigate to the generic generation page with the selected template
        navigate(`/generate?templateId=${templateId}`);
    };

    return (
        <AgentLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Report Generator</h1>
                    <p className="text-gray-500 mt-2">Use our AI Assistant to find the perfect report template for your client.</p>
                </div>

                <AIAssistant onSelectTemplate={handleTemplateSelect} />
            </div>
        </AgentLayout>
    );
};

export default AgentGeneratePage;
