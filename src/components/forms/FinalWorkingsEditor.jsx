import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { applyFinalEdits } from '../../store/slices/reportSlice';
import { reportAPI } from '../../api/api';

const FinalWorkingsEditor = ({ 
  templateId, 
  initialData, 
  onDataChange, 
  onProceed 
}) => {
  const dispatch = useDispatch();
  const [finalWorkingsData, setFinalWorkingsData] = useState(null);
  const [editedCells, setEditedCells] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData && initialData.FinalWorkings) {
      setFinalWorkingsData(initialData.FinalWorkings);
    }
  }, [initialData]);

  const handleCellEdit = (cellRef, newValue) => {
    setEditedCells(prev => ({
      ...prev,
      [cellRef]: newValue
    }));
    
    // Notify parent component of changes
    if (onDataChange) {
      onDataChange({ ...editedCells, [cellRef]: newValue });
    }
  };

  const applyChanges = async () => {
    if (Object.keys(editedCells).length === 0) {
      if (onProceed) onProceed(finalWorkingsData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert edited cells to updates format
      const updates = Object.entries(editedCells).map(([cellRef, value]) => ({
        sheet: 'FinalWorkings',
        cell: cellRef.replace('FinalWorkings!', ''),
        value: value
      }));

      // Apply the updates via Redux action
      const result = await dispatch(applyFinalEdits({
        templateId,
        updates,
        recalculate: true
      })).unwrap();

      if (result.success) {
        setFinalWorkingsData(result.data.FinalWorkings);
        setEditedCells({});
        if (onProceed) onProceed(result.data);
      } else {
        setError('Failed to apply changes');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      setError('Error applying changes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsLoading(true);
      const response = await reportAPI.exportToPdf(finalWorkingsData);
      if (response.success) {
        // Download the PDF
        const downloadUrl = reportAPI.getExportDownloadUrl(response.fileName);
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = async () => {
    try {
      setIsLoading(true);
      const response = await reportAPI.exportToJson(finalWorkingsData);
      if (response.success) {
        // Download the JSON
        const downloadUrl = reportAPI.getExportDownloadUrl(response.fileName);
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error exporting JSON:', error);
      setError('Failed to export JSON');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditableTable = () => {
    if (!finalWorkingsData) return null;

    // Handle new format with cells data
    if (finalWorkingsData.cells) {
      return renderCellBasedTable(finalWorkingsData.cells);
    }

    // Handle old format with table array
    if (finalWorkingsData.table || Array.isArray(finalWorkingsData)) {
      const tableData = finalWorkingsData.table || finalWorkingsData;
      return renderArrayBasedTable(tableData);
    }

    return <div className="text-gray-500">No data available for FinalWorkings sheet</div>;
  };

  const renderCellBasedTable = (cells) => {
    // Extract row and column information
    const rowsData = {};
    let maxRow = 0;
    let maxCol = 0;

    Object.entries(cells).forEach(([cellRef, value]) => {
      const match = cellRef.match(/([A-Z]+)(\d+)/);
      if (match) {
        const [, colLetters, rowNum] = match;
        const rowIdx = parseInt(rowNum);
        const colIdx = columnLetterToNumber(colLetters);
        
        if (!rowsData[rowIdx]) rowsData[rowIdx] = {};
        rowsData[rowIdx][colIdx] = value;
        
        maxRow = Math.max(maxRow, rowIdx);
        maxCol = Math.max(maxCol, colIdx);
      }
    });

    // Create table structure
    const rows = [];
    for (let rowIdx = 1; rowIdx <= Math.min(maxRow, 50); rowIdx++) {
      const row = [];
      for (let colIdx = 1; colIdx <= Math.min(maxCol, 20); colIdx++) {
        const cellValue = rowsData[rowIdx]?.[colIdx] || '';
        const cellRef = `${numberToColumnLetter(colIdx)}${rowIdx}`;
        const editedValue = editedCells[`FinalWorkings!${cellRef}`];
        
        row.push({
          cellRef,
          value: editedValue !== undefined ? editedValue : cellValue,
          isEdited: editedValue !== undefined,
          isEditable: shouldCellBeEditable(rowIdx, colIdx, cellValue)
        });
      }
      rows.push({ rowIdx, cells: row });
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs">Row</th>
              {Array.from({ length: Math.min(maxCol, 20) }, (_, i) => (
                <th key={i} className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs">
                  {numberToColumnLetter(i + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rowIdx, cells }) => (
              <tr key={rowIdx}>
                <td className="border border-gray-300 px-2 py-1 bg-gray-50 text-xs font-medium">
                  {rowIdx}
                </td>
                {cells.map(({ cellRef, value, isEdited, isEditable }) => (
                  <td key={cellRef} className="border border-gray-300 p-1">
                    {isEditable ? (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleCellEdit(`FinalWorkings!${cellRef}`, e.target.value)}
                        className={`w-full px-1 py-1 text-xs border-none outline-none ${
                          isEdited ? 'bg-yellow-100' : 'bg-white'
                        }`}
                        placeholder=""
                      />
                    ) : (
                      <div className={`px-1 py-1 text-xs ${
                        isEdited ? 'bg-yellow-100' : ''
                      }`}>
                        {value || ''}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderArrayBasedTable = (tableData) => {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return <div className="text-gray-500">No table data available</div>;
    }

    const headers = Object.keys(tableData[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="border border-gray-300 px-2 py-1 bg-gray-100 text-xs">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 50).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((header, colIdx) => {
                  const cellRef = `${numberToColumnLetter(colIdx + 1)}${rowIdx + 1}`;
                  const value = row[header];
                  const editedValue = editedCells[`FinalWorkings!${cellRef}`];
                  const isEditable = shouldCellBeEditable(rowIdx + 1, colIdx + 1, value);
                  
                  return (
                    <td key={header} className="border border-gray-300 p-1">
                      {isEditable ? (
                        <input
                          type="text"
                          value={editedValue !== undefined ? editedValue : (value || '')}
                          onChange={(e) => handleCellEdit(`FinalWorkings!${cellRef}`, e.target.value)}
                          className={`w-full px-1 py-1 text-xs border-none outline-none ${
                            editedValue !== undefined ? 'bg-yellow-100' : 'bg-white'
                          }`}
                        />
                      ) : (
                        <div className={`px-1 py-1 text-xs ${
                          editedValue !== undefined ? 'bg-yellow-100' : ''
                        }`}>
                          {editedValue !== undefined ? editedValue : (value || '')}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to determine if a cell should be editable
  const shouldCellBeEditable = (row, col, value) => {
    // Make cells editable if they contain numeric data or are in specific ranges
    // You can customize this logic based on your requirements
    
    // Row 6 indicates "All Items Editable"
    if (row >= 6 && row <= 25) {
      // Columns C through G (3-7) are typically data columns
      if (col >= 3 && col <= 7) {
        return true;
      }
    }
    
    // Allow editing of cells that already have numeric values
    if (typeof value === 'number' || !isNaN(parseFloat(value))) {
      return true;
    }
    
    return false;
  };

  // Helper functions for column conversion
  const columnLetterToNumber = (letters) => {
    let result = 0;
    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 64);
    }
    return result;
  };

  const numberToColumnLetter = (num) => {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  };

  if (!finalWorkingsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading FinalWorkings data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Final Workings - Financial Projections
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit the highlighted cells to adjust your projections. Changes are highlighted in yellow.
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="p-6">
          {renderEditableTable()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={exportToJSON}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>

          <div className="flex space-x-3">
            {Object.keys(editedCells).length > 0 && (
              <div className="text-sm text-gray-600">
                {Object.keys(editedCells).length} changes pending
              </div>
            )}
            <button
              onClick={applyChanges}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Apply Changes & Proceed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalWorkingsEditor;
