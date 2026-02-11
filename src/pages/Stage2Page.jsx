/**
 * Stage 2 Page
 * Excel editor - Second stage for final edits
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { uploadReportJson } from '../store/slices/reportSlice';
import { Button, Loading } from '../components/common';
import toast from 'react-hot-toast';

const Stage2Page = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const luckysheetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excelData, setExcelData] = useState(null);
  
  const templateId = searchParams.get('templateId');
  const fileName = searchParams.get('fileName');
  const reportId = searchParams.get('reportId');

  useEffect(() => {
    if (reportId) {
      loadExcelData();
    }
  }, [reportId]);

  const loadExcelData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/reports/${reportId}/json-data`
      );
      
      if (!response.ok) throw new Error('Failed to load Excel data');
      
      const data = await response.json();
      setExcelData(data);
      
      initializeLuckysheet(data);
    } catch (error) {
      console.error('Error loading Excel:', error);
      toast.error('Failed to load Excel file');
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
        title: 'CA Report - Stage 2',
        hook: {
          updated: function() {
            console.log('Data updated');
          }
        }
      });
    }
  };

  const handleFinalize = async () => {
    try {
      setIsSubmitting(true);
      
      // Get current Luckysheet data
      const currentData = window.luckysheet.getAllSheets();
      
      if (!reportId) {
        toast.error('Report ID not found');
        return;
      }

      // Upload the final JSON to backend
      await dispatch(
        uploadReportJson({
          reportId,
          jsonData: currentData,
        })
      ).unwrap();
      
      toast.success('Report finalized successfully!');
      navigate('/reports');
    } catch (error) {
      console.error('Error finalizing report:', error);
      toast.error('Failed to finalize report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Button
          onClick={handleFinalize}
          variant="success"
          size="md"
          loading={isSubmitting}
        >
          Finalize & Submit Report
        </Button>
        <div className="flex-1"></div>
        <small className="text-gray-600">Excel Editor - Stage 2</small>
      </header>

      {/* Luckysheet Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <Loading text="Processing Excel Template" />
            <p className="mt-2 text-sm text-gray-600">Calculating formulas and optimizing display...</p>
          </div>
        )}
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <Loading text="Finalizing Report" />
            <p className="mt-2 text-sm text-gray-600">Saving your changes...</p>
          </div>
        )}
        
        <div
          id="luckysheet"
          ref={luckysheetRef}
          className="w-full h-full"
        ></div>
      </div>
    </div>
  );
};

export default Stage2Page;
