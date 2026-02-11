/**
 * Stage 3 Page
 * Excel viewer/editor - View existing report or HTML content
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReportById, uploadReportJson, selectCurrentReport } from '../store/slices/reportSlice';
import { Button, Loading } from '../components/common';
import toast from 'react-hot-toast';

const Stage3Page = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const luckysheetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState('excel'); // 'excel' or 'html'
  
  const reportId = searchParams.get('id');
  const currentReport = useSelector(selectCurrentReport);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      
      // Fetch report details
      const report = await dispatch(fetchReportById(reportId)).unwrap();
      
      // Check if HTML content is available
      if (report.htmlContent) {
        console.log('✅ [Stage3Page] HTML content available - rendering HTML');
        setViewMode('html');
        displayHTMLContent(report.htmlContent);
      } else if (report.json_data) {
        console.log('✅ [Stage3Page] JSON data available - initializing Excel editor');
        setViewMode('excel');
        initializeLuckysheet(report.json_data);
      } else {
        console.log('❌ [Stage3Page] No content available');
        toast.error('Report data not found');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeLuckysheet = (data) => {
    if (window.luckysheet && luckysheetRef.current) {
      window.luckysheet.create({
        container: 'luckysheet',
        data: data,
        showinfobar: false,
        showtoolbar: true,
        showsheetbar: true,
        showstatisticBar: false,
        enableAddRow: true,
        enableAddCol: true,
        userInfo: false,
        myFolderUrl: '',
        title: `CA Report - ${currentReport?.template_name || 'View'}`,
        hook: {
          updated: function() {
            console.log('Data updated');
          }
        }
      });
    }
  };

  const displayHTMLContent = (htmlString) => {
    try {
      console.log('🌐 [displayHTMLContent] Starting HTML display');
      console.log('🌐 [displayHTMLContent] HTML content length:', htmlString?.length);

      if (!htmlString) {
        console.error('❌ [displayHTMLContent] No HTML content provided');
        return;
      }

      // Display HTML content directly in the viewer container
      const viewerContainer = document.getElementById('html-viewer');
      if (viewerContainer) {
        // Create a sandbox iframe to contain the HTML
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.title = 'Report Viewer';
        
        viewerContainer.innerHTML = '';
        viewerContainer.appendChild(iframe);
        
        // Write HTML content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlString);
        iframeDoc.close();

        console.log('✅ [displayHTMLContent] HTML content displayed successfully');
      } else {
        console.error('❌ [displayHTMLContent] Viewer container not found');
      }
    } catch (error) {
      console.error('❌ [displayHTMLContent] Error displaying HTML:', error);
      toast.error('Failed to display report');
    }
  };

  const handleUpdate = async () => {
    if (viewMode !== 'excel') {
      toast.error('Update is only available for Excel reports');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Get current Luckysheet data
      const currentData = window.luckysheet.getAllSheets();
      
      // Upload the updated JSON to backend
      await dispatch(
        uploadReportJson({
          reportId,
          jsonData: currentData,
        })
      ).unwrap();
      
      toast.success('Report updated successfully!');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoBack = () => {
    navigate('/reports');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Button
          onClick={handleGoBack}
          variant="secondary"
          size="md"
        >
          ← Back to Reports
        </Button>
        {viewMode === 'excel' && (
          <Button
            onClick={handleUpdate}
            variant="primary"
            size="md"
            loading={isUpdating}
          >
            Update Report
          </Button>
        )}
        <div className="flex-1"></div>
        <small className="text-gray-600">
          {viewMode === 'html' ? 'HTML Report Viewer' : 'Excel Editor - Edit Mode'}
        </small>
      </header>

      {/* Content Area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <Loading text="Loading Report" />
            <p className="mt-2 text-sm text-gray-600">Please wait...</p>
          </div>
        )}
        
        {isUpdating && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <Loading text="Updating Report" />
            <p className="mt-2 text-sm text-gray-600">Saving your changes...</p>
          </div>
        )}
        
        {viewMode === 'html' && (
          <div
            id="html-viewer"
            className="w-full h-full"
            style={{
              minHeight: '500px',
              overflow: 'hidden'
            }}
          ></div>
        )}
        
        {viewMode === 'excel' && (
          <div
            id="luckysheet"
            ref={luckysheetRef}
            className="w-full h-full"
          ></div>
        )}
      </div>
    </div>
  );
};

export default Stage3Page;
