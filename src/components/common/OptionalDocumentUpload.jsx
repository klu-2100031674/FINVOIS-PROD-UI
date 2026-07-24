import React, { useRef } from 'react';
import { FileUp /*, Paperclip */ } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ACCEPT =
  '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,application/pdf,image/*';

/**
 * Document upload zone shown directly on the form.
 * Optional is highlighted. Collapsed "Add Documents" button code is kept commented below.
 */
export default function OptionalDocumentUpload({
  files = [],
  onChange,
  className = '',
}) {
  // const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  const addFiles = (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;

    const tooBig = list.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      toast.error(`"${tooBig.name}" exceeds 5 MB`);
      return;
    }

    const next = [...files, ...list];
    if (next.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      onChange(next.slice(0, MAX_FILES));
      return;
    }
    onChange(next);
  };

  const removeAt = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  // Collapsed "Add Documents" entry point — kept for easy restore.
  // if (!open) {
  //   return (
  //     <div className={`pt-2 border-t border-gray-100 ${className}`}>
  //       <div className="flex flex-wrap items-center gap-3">
  //         <button
  //           type="button"
  //           onClick={() => setOpen(true)}
  //           className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-colors"
  //         >
  //           <Paperclip size={16} />
  //           Add Documents
  //         </button>
  //         <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide border border-amber-200">
  //           Optional
  //         </span>
  //       </div>
  //       <p className="text-xs text-gray-500 mt-2">
  //         PDF, Word, images, Excel or CSV — up to {MAX_FILES} files, max 5 MB each.
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className={`pt-2 border-t border-gray-100 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Attach documents / images / Excel
        </label>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide border border-amber-200">
          Optional
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Up to {MAX_FILES} files, max 5 MB each. PDF, Word, images, Excel or CSV.
      </p>

      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-200 rounded-2xl cursor-pointer hover:bg-orange-50/50 transition-colors relative bg-orange-50/20">
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
          <FileUp className="w-8 h-8 text-orange-400 mb-2" />
          <p className="text-xs text-gray-600 font-semibold">
            {files.length ? `${files.length} file(s) selected` : 'Click to attach files'}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Max {MAX_FILES} files · 5 MB each
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                className="text-red-600 font-semibold ml-2 shrink-0"
                onClick={() => removeAt(idx)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
