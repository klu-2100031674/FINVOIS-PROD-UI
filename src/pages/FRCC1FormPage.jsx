import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../hooks';
import finvoisLogo from '../assets/finvois.png';
import FRCC1Form from '../components/forms/FRCC1Form';
import toast from 'react-hot-toast';
import { selectFormData, applyFormData, setFormData, clearGeneratedExcel } from '../store/slices/reportSlice';
import { DocumentTextIcon, ArrowLeftIcon, ChartBarIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const FRCC1FormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const storedFormData = useSelector(selectFormData);
  const isEditMode = searchParams.get('mode') === 'edit';
  const reportId = searchParams.get('reportId');

  useEffect(() => {
    console.log('🔍 [FRCC1FormPage] Component mounted/updated');
    console.log('🔍 [FRCC1FormPage] isEditMode:', isEditMode);
    console.log('🔍 [FRCC1FormPage] reportId:', reportId);
    console.log('🔍 [FRCC1FormPage] storedFormData:', storedFormData);
    
    dispatch(clearGeneratedExcel());
  }, [isEditMode, reportId, storedFormData, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFormSubmit = async (formData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log('📝 [FRCC1FormPage] Submitting form data:', formData);
      
      await dispatch(applyFormData({ 
        templateId: templateId || 'frcc1', 
        formData 
      })).unwrap();
      
      toast.success(isEditMode ? 'Report updated successfully!' : 'Form submitted successfully!');
      
      setTimeout(() => {
        navigate(`/stage1?templateId=${templateId || 'frcc1'}&reportId=${reportId || 'temp'}`);
        setIsProcessing(false);
      }, 100);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form');
      setIsProcessing(false);
    }
  };

  const handleFormDataChange = (rawFormData) => {
    console.log('💾 [FRCC1FormPage] Saving raw form data to Redux:', rawFormData);
    dispatch(setFormData(rawFormData));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleMyReports = () => {
    navigate('/reports');
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8FF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Manrope', sans-serif;
        }
        
        body, input, select, textarea, button {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* Header - Matching Screenshot */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div className="max-w-full px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img
                src={finvoisLogo}
                alt="Finvois Logo"
                className="h-10 w-auto"
              />
  
            </button>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* My Reports Button */}
              <button
                onClick={handleMyReports}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
              >
                <ChartBarIcon className="w-4 h-4" />
                <span>My Reports</span>
              </button>

              {/* Credits Display */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <CreditCardIcon className="w-5 h-5 text-gray-700" />
                <span className="text-base font-bold text-gray-900">
                  {user?.credits || '99985'}
                </span>
                <span className="text-sm text-gray-600">Credits</span>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user?.name?.charAt(0) || 'R'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || 'Ramesh'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors px-3"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back Button */}
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Financial Report' : 'Create Financial Report'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEditMode 
              ? 'Update your financial data and regenerate the report' 
              : 'Fill in the financial data to generate your professional Excel report'}
          </p>
        </div>

        {/* Form Component */}
        <FRCC1Form 
          onSubmit={handleFormSubmit} 
          testMode={false}
          initialData={isEditMode ? storedFormData : null}
          isEditMode={isEditMode}
          reportId={reportId}
          isProcessing={isProcessing}
          onFormDataChange={handleFormDataChange}
        />
      </div>
    </div>
  );
};

export default FRCC1FormPage;
