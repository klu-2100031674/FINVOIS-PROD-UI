import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceById, selectCurrentService, selectServicesLoading, selectServicesError, clearCurrentService } from '@/store/slices/serviceSlice';
import { submitServiceForm, resetFormState, selectFormSubmitting, selectFormSubmitSuccess, selectFormError } from '@/store/slices/formSlice';
import ServiceContentRenderer from '@/components/services/ServiceContentRenderer';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentService = useSelector(selectCurrentService);
  const loading = useSelector(selectServicesLoading);
  const error = useSelector(selectServicesError);
  const submitting = useSelector(selectFormSubmitting);
  const submitSuccess = useSelector(selectFormSubmitSuccess);
  const formError = useSelector(selectFormError);

  const [formData, setFormData] = useState({ name: '', email: '' });
  const [additionalFields, setAdditionalFields] = useState({});

  useEffect(() => {
    dispatch(fetchServiceById(id));
    return () => {
      dispatch(clearCurrentService());
      dispatch(resetFormState());
    };
  }, [id, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'email') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setAdditionalFields((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const completeFormData = { ...formData, ...additionalFields };
    await dispatch(submitServiceForm({ serviceId: id, formData: completeFormData }));
  };

  const handleResetForm = () => {
    setFormData({ name: '', email: '' });
    setAdditionalFields({});
    dispatch(resetFormState());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
      </div>
    );
  }

  if (error || !currentService) {
    return (
      <div className="text-center py-12 px-4">
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Service Not Found</h2>
        <p className="text-gray-500 mb-4">The service you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/services')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button onClick={() => navigate('/services')} className="mb-6 text-[#7e22ce] hover:underline flex items-center gap-2">
        ← Back to Services
      </button>

      {/* Service Content */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">{currentService.content?.title || currentService.name}</h1>
        {currentService.content?.sections && (
          <ServiceContentRenderer sections={currentService.content.sections} />
        )}
      </div>

      {/* Service Form */}
      {currentService.formConfig && (
        <div className="max-w-2xl mx-auto bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">{currentService.formConfig.title || 'Contact Us'}</h2>

          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                ✓
              </div>
              <p className="text-green-600 font-medium text-lg mb-2">Thank you! Your submission has been received.</p>
              <p className="text-gray-500 mb-6">We'll get back to you as soon as possible.</p>
              <button onClick={handleResetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Submit Another Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{formError}</div>
              )}

              {/* Mandatory Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>

              {/* Additional Fields */}
              {currentService.formConfig.fields?.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}{field.required && ' *'}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      onChange={handleInputChange}
                      placeholder={field.label}
                      required={field.required}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] min-h-[100px]"
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      name={field.name}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce]"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      onChange={handleInputChange}
                      placeholder={field.label}
                      required={field.required}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce]"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#7e22ce] text-white py-2 rounded-lg hover:bg-[#6b21a8] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Submitting...</>
                ) : 'Submit'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;