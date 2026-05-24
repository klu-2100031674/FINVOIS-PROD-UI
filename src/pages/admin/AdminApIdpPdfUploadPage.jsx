import { AdminLayout } from '../../components/layouts';
import AdminSchemePdfUploadPanel from './AdminSchemePdfUploadPanel';

const AdminApIdpPdfUploadPage = () => (
  <AdminLayout>
    <AdminSchemePdfUploadPanel
      title="AP IDP 4.0 PDF Upload"
      description="Upload or replace the global AP IDP 4.0 PDF used for AI chat (extract → chunk → embed)."
      statusPath="/ap-idp-ai/knowledge/status"
      uploadPath="/ap-idp-ai/knowledge/upload"
    />
  </AdminLayout>
);

export default AdminApIdpPdfUploadPage;
