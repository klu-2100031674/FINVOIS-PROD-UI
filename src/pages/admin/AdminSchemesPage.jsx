import { ExternalLink, FileUp, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts';
import registry from '../../data/schemeFormsRegistry.json';

/**
 * Admin list of scheme *forms* (by slug), not the public marketing schemes grid.
 * Add entries in `src/data/schemeFormsRegistry.json`.
 * Optional `adminPdfUploadPath` — when set, selecting the scheme opens the PDF knowledge upload page.
 */
const AdminSchemesPage = () => {
  const navigate = useNavigate();
  const { forms } = registry;

  const goToUploadForForm = (form) => {
    if (form?.adminPdfUploadPath) navigate(form.adminPdfUploadPath);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Schemes</h1>
          <Link
            to="/schemes/mail"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Manage Emails
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">Scheme forms</p>
            <p className="text-xs text-gray-500 mt-0.5">{forms.length} registered</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-100">
                  <th className="px-4 py-3 font-semibold">Form key</th>
                  <th className="px-4 py-3 font-semibold">Display name</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Links</th>
                  <th className="px-4 py-3 font-semibold">Knowledge PDF</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr
                    key={form.id}
                    role={form.adminPdfUploadPath ? 'button' : undefined}
                    tabIndex={form.adminPdfUploadPath ? 0 : undefined}
                    onClick={() => goToUploadForForm(form)}
                    onKeyDown={(e) => {
                      if (!form.adminPdfUploadPath) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToUploadForForm(form);
                      }
                    }}
                    className={`border-b border-gray-50 last:border-0 ${
                      form.adminPdfUploadPath
                        ? 'cursor-pointer hover:bg-purple-50/60 focus-visible:outline focus-visible:ring-2 focus-visible:ring-purple-300'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <code className="text-xs bg-purple-50 text-purple-900 px-2 py-1 rounded font-mono">
                        {form.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-gray-900">{form.title}</td>
                    <td className="px-4 py-3 align-top text-gray-600 max-w-md">{form.description}</td>
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-2 items-start">
                        {form.publicFormPath ? (
                          <Link
                            to={form.publicFormPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-purple-700 font-semibold hover:underline"
                          >
                            <span>Public form</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      {form.adminPdfUploadPath ? (
                        <Link
                          to={form.adminPdfUploadPath}
                          className="inline-flex items-center gap-1.5 text-gray-900 font-semibold hover:underline"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          Upload PDF
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">Not configured</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSchemesPage;
