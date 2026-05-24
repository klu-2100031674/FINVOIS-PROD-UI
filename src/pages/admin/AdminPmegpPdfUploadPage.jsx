import { AdminLayout } from '../../components/layouts';
import AdminSchemePdfUploadPanel from './AdminSchemePdfUploadPanel';

const AdminPmegpPdfUploadPage = () => (
  <AdminLayout>
    <AdminSchemePdfUploadPanel
      title="PMEGP PDF Upload"
      description="Upload or replace the global PMEGP PDF used for AI chat (extract → chunk → embed)."
      statusPath="/pmegp-ai/knowledge/status"
      uploadPath="/pmegp-ai/knowledge/upload"
    />
  </AdminLayout>
);

export default AdminPmegpPdfUploadPage;
