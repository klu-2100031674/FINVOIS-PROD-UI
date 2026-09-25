import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadClients, downloadTemplate } from '../../../services/salesService';
import toast from 'react-hot-toast';

const SalesUploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef(null);

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
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadClients(file);
      setResult(res.data);
      setFile(null);
      if (res.data.successCount > 0) {
        toast.success(`${res.data.successCount} records imported successfully`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Import customer records from Excel</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-sm transition"
        >
          <Download size={15} />
          Download Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-violet-500 bg-purple-50'
            : file
            ? 'border-violet-500/50 bg-purple-50'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
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
              <FileSpreadsheet size={40} className="text-purple-600" />
              <p className="text-gray-900 font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <Upload size={36} className="text-gray-400" />
              <p className="text-gray-600 font-medium">Drop your Excel file here</p>
              <p className="text-gray-400 text-sm">or click to browse · .xlsx, .xls only</p>
            </>
          )}
        </div>
      </div>

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 transition shadow-lg shadow-purple-200"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload {file.name}
            </>
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {result.successCount > 0 && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
              <CheckCircle size={18} />
              <span className="font-medium">{result.successCount} records imported successfully</span>
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="w-full flex items-center justify-between p-4 text-red-600 hover:bg-red-100 transition"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} />
                  <span className="font-medium text-sm">{result.errors.length} rows had errors</span>
                </div>
                {showErrors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showErrors && (
                <div className="px-4 pb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-red-200">
                        <th className="text-left py-2 text-red-400">Row</th>
                        <th className="text-left py-2 text-red-400">Phone</th>
                        <th className="text-left py-2 text-red-400">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-b border-red-100 last:border-0">
                          <td className="py-1.5 text-red-500">{err.row}</td>
                          <td className="py-1.5 text-red-500">{err.phone || err.phoneNumber || '—'}</td>
                          <td className="py-1.5 text-red-500">{err.reason || err.message}</td>
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
  );
};

export default SalesUploadPage;
