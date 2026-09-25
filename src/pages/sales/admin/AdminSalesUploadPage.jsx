import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  Loader2, Download, ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../../components/layouts';
import SalesCrmSubNav from './SalesCrmSubNav';
import { adminUploadClients, adminDownloadTemplate, adminListManagers } from '../../../services/salesService';

const AdminSalesUploadPage = () => {
  const [managers,   setManagers]   = useState([]);
  const [managerId,  setManagerId]  = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const [file,       setFile]       = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef(null);

  // Load active managers for the selector
  useEffect(() => {
    adminListManagers({ isActive: 'true' })
      .then((res) => {
        const d = res.data?.data || res.data;
        setManagers(d?.managers || d || []);
      })
      .catch(() => toast.error('Failed to load managers'));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped);
      setResult(null);
    } else {
      toast.error('Only .xlsx and .xls files are accepted');
    }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!file)      return toast.error('Please select a file');
    if (!managerId) return toast.error('Please select a manager to upload for');

    setUploading(true);
    try {
      const res = await adminUploadClients(file, managerId);
      const data = res.data?.data || res.data;
      setResult(data);
      setFile(null);
      if (data.successCount > 0) {
        toast.success(`${data.successCount} records imported for ${data.uploadedForManager}`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await adminDownloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'sales_clients_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <SalesCrmSubNav />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Clients</h1>
            <p className="text-muted-foreground mt-1">
              Import customer records from Excel on behalf of a manager
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition"
          >
            <Download size={15} />
            Download Template
          </button>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Step 1 — Select manager */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#7e22ce] text-white text-xs font-bold flex items-center justify-center">1</div>
              <h2 className="text-base font-semibold text-gray-900">Select Manager</h2>
            </div>

            {managers.length === 0 ? (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                <AlertCircle size={15} />
                No active managers found. Create a manager first before uploading.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Uploaded leads will be assigned to this manager's pool (stage: Available).
                </p>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none bg-white"
                >
                  <option value="">— Choose a manager —</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                {managerId && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[#7e22ce] text-xs font-bold">
                      {managers.find(m => m._id === managerId)?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#7e22ce]">
                      {managers.find(m => m._id === managerId)?.name}
                    </span>
                    <CheckCircle size={14} className="ml-auto text-[#7e22ce]" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2 — Upload file */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#7e22ce] text-white text-xs font-bold flex items-center justify-center">2</div>
              <h2 className="text-base font-semibold text-gray-900">Choose Excel File</h2>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#7e22ce] bg-purple-50'
                  : file
                  ? 'border-[#7e22ce]/50 bg-purple-50/30'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                {file ? (
                  <>
                    <FileSpreadsheet size={40} className="text-[#7e22ce]" />
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload size={36} className="text-gray-300" />
                    <p className="font-medium text-gray-500">Drop your Excel file here</p>
                    <p className="text-sm text-gray-400">or click to browse · .xlsx, .xls only</p>
                  </>
                )}
              </div>
            </div>

            {/* Upload button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading || !managerId}
                className="mt-4 w-full py-3 rounded-lg bg-[#7e22ce] hover:bg-[#6b21a8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition"
              >
                {uploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={16} /> Upload {file.name}</>
                )}
              </button>
            )}
            {file && !managerId && (
              <p className="mt-2 text-xs text-center text-amber-600">Please select a manager above before uploading</p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Rows</p>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-100 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                  <p className="text-xs text-green-500 mt-1">Imported</p>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-100 p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.failedCount}</p>
                  <p className="text-xs text-red-400 mt-1">Failed</p>
                </div>
              </div>

              {result.successCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle size={18} />
                  <span className="font-medium text-sm">
                    {result.successCount} records imported for <strong>{result.uploadedForManager}</strong>
                  </span>
                </div>
              )}

              {/* Error list */}
              {result.errors?.length > 0 && (
                <div className="bg-white border border-red-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between px-4 py-3 text-red-600 hover:bg-red-50 transition text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} />
                      {result.errors.length} rows had errors
                    </div>
                    {showErrors ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {showErrors && (
                    <div className="overflow-x-auto border-t border-red-100">
                      <table className="w-full text-xs">
                        <thead className="bg-red-50">
                          <tr>
                            {['Row', 'Phone', 'Reason'].map((h) => (
                              <th key={h} className="text-left px-4 py-2 text-red-400 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, i) => (
                            <tr key={i} className="border-t border-red-50">
                              <td className="px-4 py-2 text-gray-500">{err.row}</td>
                              <td className="px-4 py-2 text-gray-500">{err.phone || '—'}</td>
                              <td className="px-4 py-2 text-red-500">{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSalesUploadPage;
