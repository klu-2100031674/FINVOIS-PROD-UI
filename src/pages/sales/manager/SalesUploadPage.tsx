import { useState, useRef, type DragEvent } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { salesUploadAPI } from '../../../services/salesService';
import type { UploadResult } from '../../../types/sales.types';
import toast from 'react-hot-toast';

export default function SalesUploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const valid = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
    if (!valid) {
      toast.error('Only .xlsx or .xls files are accepted');
      return;
    }
    setFile(f);
    setResult(null);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await salesUploadAPI.uploadCustomers(file);
      setResult(res.data);
      if (res.data.errors.length === 0) {
        toast.success(`${res.data.imported} customers imported successfully`);
      } else {
        toast.success(`${res.data.imported} imported, ${res.data.skipped} skipped`);
      }
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function downloadTemplate() {
    try {
      const res = await salesUploadAPI.downloadTemplate();
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Customers</h1>
          <p className="text-gray-400 text-sm mt-0.5">Bulk import customers from an Excel file</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-violet-500 bg-violet-500/10'
            : file
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-white/10 bg-white/3 hover:border-violet-500/40 hover:bg-violet-500/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="w-12 h-12 text-emerald-400" />
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="text-gray-500 hover:text-red-400 flex items-center gap-1 text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-600" />
            <div>
              <p className="text-gray-300 font-medium">Drop your Excel file here</p>
              <p className="text-gray-500 text-sm mt-0.5">or click to browse • .xlsx / .xls</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {uploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-5 h-5" /> Upload & Import</>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Rows', value: result.totalRows, color: 'text-white' },
              { label: 'Imported', value: result.imported, color: 'text-emerald-300' },
              { label: 'Skipped', value: result.skipped, color: 'text-yellow-300' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Status banner */}
          {result.errors.length === 0 ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">All rows imported successfully</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-yellow-300 text-sm font-medium">{result.errors.length} rows had errors</p>
            </div>
          )}

          {/* Error table */}
          {result.errors.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-medium text-white">Error Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10">
                    <tr className="text-gray-500">
                      <th className="text-left px-4 py-2.5 font-medium">Row</th>
                      <th className="text-left px-4 py-2.5 font-medium">Phone</th>
                      <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-gray-400">#{err.row}</td>
                        <td className="px-4 py-2.5 text-gray-400">{err.phone || '—'}</td>
                        <td className="px-4 py-2.5 text-red-300">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={() => { setFile(null); setResult(null); }}
            className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Another File
          </button>
        </div>
      )}

      {/* Format guide */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Required Columns</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['name*', 'email*', 'phone*', 'company', 'city', 'state', 'source', 'notes'].map((col) => (
            <code key={col} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-violet-300 font-mono">
              {col}
            </code>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-2.5">* Required. Duplicate phone numbers are automatically rejected.</p>
      </div>
    </div>
  );
}
