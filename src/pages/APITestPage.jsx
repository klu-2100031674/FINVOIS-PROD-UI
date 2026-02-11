import { useMemo, useState } from 'react';
import api from '../api/api';

// Small helper to render a simple table from array-of-records
const SimpleTable = ({ rows = [], maxRows = 20, maxCols = 10 }) => {
  const headers = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0] || {});
    return keys.slice(0, maxCols);
  }, [rows, maxCols]);

  const sliced = useMemo(() => rows.slice(0, maxRows), [rows, maxRows]);

  if (!rows || rows.length === 0) return <div className="text-sm text-gray-500">No data</div>;

  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 text-left font-semibold text-gray-700 border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sliced.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {headers.map((h) => (
                <td key={h} className="px-2 py-1 border-b align-top whitespace-pre-wrap">{String(row?.[h] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * API Test Page
 * Test all API endpoints with proper authentication
 */
const APITestPage = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [templateId, setTemplateId] = useState('frcc1');
  const [sheetsData, setSheetsData] = useState(null); // latest calculated data from backend
  const [meta, setMeta] = useState(null);
  const [updateForm, setUpdateForm] = useState({ sheet: 'FinalWorkings', cell: '', value: '', recalc: true });

  const runTest = async (testName, apiCall) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await apiCall();
      setResults(prev => ({ 
        ...prev, 
        [testName]: { success: true, data: result } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { success: false, error: error.message || error } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'Health Check',
      key: 'health',
      call: () => api.health.check(),
    },
    {
      name: 'Login Test',
      key: 'login',
      call: () => api.auth.login({ 
        email: 'test@example.com', 
        password: 'testpassword' 
      }),
    },
    {
      name: 'Get Profile',
      key: 'profile',
      call: () => api.auth.getProfile(),
    },
    {
      name: 'Get Wallet Balance',
      key: 'wallet',
      call: () => api.wallet.getBalance(),
    },
    {
      name: 'Get Reports',
      key: 'reports',
      call: () => api.report.getReports(),
    },
  ];

  const handleApplySampleUpdates = async () => {
    setLoading((p) => ({ ...p, applyInitial: true }));
    try {
      // Minimal seed updates on Assumptions.1 (example cell I10)
      const updates = [
        { sheet: 'Assumptions.1', cell: 'I10', value: 1 },
      ];
      const resp = await api.report.applyFinalEdits(templateId, updates, true);
      // resp expected shape: { success, message, data: { ...sheets, _meta, ... } }
      const data = resp?.data || resp; // support both shapes
      setSheetsData(data);
      setMeta(data?._meta || null);
      setResults((prev) => ({ ...prev, applyInitial: { success: true, data: { meta: data?._meta, keys: Object.keys(data || {}) } } }));
    } catch (error) {
      setResults((prev) => ({ ...prev, applyInitial: { success: false, error: error?.message || String(error) } }));
    } finally {
      setLoading((p) => ({ ...p, applyInitial: false }));
    }
  };

  const handleApplyEdit = async (e) => {
    e?.preventDefault?.();
    setLoading((p) => ({ ...p, applyEdit: true }));
    try {
      const val = isNaN(Number(updateForm.value)) ? updateForm.value : Number(updateForm.value);
      const updates = [{ sheet: updateForm.sheet || 'FinalWorkings', cell: updateForm.cell, value: val }];
      const resp = await api.report.applyFinalEdits(templateId, updates, !!updateForm.recalc);
      const data = resp?.data || resp;
      setSheetsData(data);
      setMeta(data?._meta || null);
      setResults((prev) => ({ ...prev, applyEdit: { success: true, data: { meta: data?._meta, applied: data?._appliedUpdates } } }));
    } catch (error) {
      setResults((prev) => ({ ...prev, applyEdit: { success: false, error: error?.message || String(error) } }));
    } finally {
      setLoading((p) => ({ ...p, applyEdit: false }));
    }
  };

  const handleExport = async (type) => {
    if (!sheetsData) return;
    setLoading((p) => ({ ...p, [`export_${type}`]: true }));
    try {
      const resp = type === 'pdf'
        ? await api.report.exportToPdf(sheetsData)
        : await api.report.exportToJson(sheetsData);
      const data = resp?.data || resp;
      const fileName = data?.fileName;
      const url = api.report.getExportDownloadUrl(fileName);
      setResults((prev) => ({ ...prev, [`export_${type}`]: { success: true, data: { fileName, url } } }));
      // Open in new tab to download
      if (url) window.open(url, '_blank');
    } catch (error) {
      setResults((prev) => ({ ...prev, [`export_${type}`]: { success: false, error: error?.message || String(error) } }));
    } finally {
      setLoading((p) => ({ ...p, [`export_${type}`]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Integration Test</h1>
        
        {/* New: Excel flow harness */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Excel Engine Harness</h2>
          <div className="flex items-end gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Template ID</label>
              <input
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
                placeholder="frcc1"
              />
            </div>
            <button
              onClick={handleApplySampleUpdates}
              disabled={!!loading.applyInitial}
              className="btn btn-primary"
            >
              {loading.applyInitial ? 'Applying…' : 'Apply Sample Updates'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!sheetsData || !!loading.export_pdf}
              className="btn btn-secondary"
            >
              {loading.export_pdf ? 'Exporting…' : 'Export PDF'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={!sheetsData || !!loading.export_json}
              className="btn btn-secondary"
            >
              {loading.export_json ? 'Exporting…' : 'Export JSON'}
            </button>
          </div>

          <form onSubmit={handleApplyEdit} className="bg-gray-50 border rounded p-3 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Sheet</label>
              <input
                value={updateForm.sheet}
                onChange={(e) => setUpdateForm((s) => ({ ...s, sheet: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
                placeholder="FinalWorkings"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Cell</label>
              <input
                value={updateForm.cell}
                onChange={(e) => setUpdateForm((s) => ({ ...s, cell: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
                placeholder="e.g., B12"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Value</label>
              <input
                value={updateForm.value}
                onChange={(e) => setUpdateForm((s) => ({ ...s, value: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
                placeholder="123.45 or text"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!updateForm.recalc}
                onChange={(e) => setUpdateForm((s) => ({ ...s, recalc: e.target.checked }))}
              />
              Recalculate formulas (best-effort)
            </label>
            <button type="submit" disabled={!updateForm.cell || loading.applyEdit} className="btn btn-primary">
              {loading.applyEdit ? 'Applying…' : 'Apply Edit'}
            </button>
          </form>

          {meta && (
            <div className="text-xs text-gray-600 mb-3">
              <div>Formula recalculation: <span className="font-mono">{meta.formulaRecalculation}</span></div>
              {meta.formulaRecalculationError && (
                <div className="text-red-600">{meta.formulaRecalculationError}</div>
              )}
            </div>
          )}

          <div className="mb-2 font-medium text-gray-800">FinalWorkings (preview)</div>
          <SimpleTable rows={sheetsData?.FinalWorkings || []} />
        </div>

        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.key} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{test.name}</h2>
                <button
                  onClick={() => runTest(test.key, test.call)}
                  disabled={loading[test.key]}
                  className="btn btn-primary"
                >
                  {loading[test.key] ? 'Testing...' : 'Run Test'}
                </button>
              </div>
              
              {results[test.key] && (
                <div className="mt-4">
                  <div className={`p-4 rounded-lg ${
                    results[test.key].success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`font-medium ${
                      results[test.key].success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {results[test.key].success ? '✅ Success' : '❌ Error'}
                    </div>
                    <pre className={`mt-2 text-sm ${
                      results[test.key].success ? 'text-green-700' : 'text-red-700'
                    } whitespace-pre-wrap`}>
                      {JSON.stringify(
                        results[test.key].success 
                          ? results[test.key].data 
                          : results[test.key].error, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h2>
          <div className="space-y-2 text-sm">
            <div>Token: {api.getAuthToken() ? '✅ Present' : '❌ Missing'}</div>
            <div>API Base URL: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}</div>
            <div>Environment: {import.meta.env.MODE}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestPage;