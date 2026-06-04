import { useParams } from 'react-router-dom';
import AdminFranchiseFormPage from './AdminFranchiseFormPage';

const AdminFranchiseEditPage = () => {
  const { id } = useParams();
  return <AdminFranchiseFormPage isEdit id={id} />;
};

export default AdminFranchiseEditPage;
