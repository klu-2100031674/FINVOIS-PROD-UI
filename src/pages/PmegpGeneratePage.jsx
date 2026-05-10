import PmegpSectionAForm from '../components/forms/Pmegp';
import ClientLayout from '../components/layouts/ClientLayout';

const PmegpGeneratePage = () => {
  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">PMEGP Form</h1>
              <p className="text-sm text-gray-600">
                This route is hidden for now. Open via manual URL: <span className="font-mono">/generate/pmegp</span>
              </p>
            </div>
          </div>
        </div>

        <PmegpSectionAForm
          onSubmit={(formData) => {
            // TODO: connect this payload to backend once API contract is finalized.
            console.log('PMEGP payload:', formData);
          }}
        />
      </div>
    </ClientLayout>
  );
};

export default PmegpGeneratePage;

