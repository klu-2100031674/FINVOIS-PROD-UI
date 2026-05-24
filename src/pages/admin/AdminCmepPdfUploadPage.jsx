import { AdminLayout } from '../../components/layouts';
import AdminSchemePdfUploadPanel from './AdminSchemePdfUploadPanel';

const AdminCmepPdfUploadPage = () => (
  <AdminLayout>
    <AdminSchemePdfUploadPanel
      title="CMEP PDF Upload"
      description="Upload or replace the global CMEP PDF used for AI chat (extract → chunk → embed)."
      statusPath="/cmep-ai/knowledge/status"
      uploadPath="/cmep-ai/knowledge/upload"
    />
  </AdminLayout>
);

export default AdminCmepPdfUploadPage;
