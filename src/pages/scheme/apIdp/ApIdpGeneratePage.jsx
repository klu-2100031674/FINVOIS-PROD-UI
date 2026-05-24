import ApIdpSectionAForm from '../../../components/forms/scheme/ApIdp';
import ClientLayout from '../../../components/layouts/ClientLayout';
import { AP_IDP_GENERATE_PATH } from '../../../components/forms/scheme/apIdpSchemeMailConstants';

const ApIdpGeneratePage = () => {
  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">AP IDP 4.0 Form</h1>
              <p className="text-sm text-gray-600">
                This route is hidden for now. Open via manual URL:{' '}
                <span className="font-mono">{AP_IDP_GENERATE_PATH}</span>
              </p>
            </div>
          </div>
        </div>

        <ApIdpSectionAForm />
      </div>
    </ClientLayout>
  );
};

export default ApIdpGeneratePage;
