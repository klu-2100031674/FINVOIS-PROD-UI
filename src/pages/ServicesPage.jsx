import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import { fetchTopServices, fetchLinkedServices } from '@/store/slices/serviceSlice';

const ServicesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { topServices, linkedServices, loading } = useSelector(state => state.services);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchTopServices());
    dispatch(fetchLinkedServices());
  }, [dispatch]);

  const displayedServices = showAll ? linkedServices : topServices;
  const hasMoreServices = linkedServices?.length > topServices?.length;

  const filteredServices = (displayedServices || []).filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#7e22ce] to-[#6b21a8] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">FIN CONNECT</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            FIN Connect is an AI-powered business networking platform that connects MSME's with verified suppliers, manufacturers, and financial partners. Discover the right business connections, receive qualified opportunities. and accelerate your business growth through a trusted ecosystem.
          </p>
          {/* Search bar inside hero */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
            />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredServices.map((service) => (
                <div
                  key={service._id || service.uuid}
                  onClick={() => navigate(`/services/${service.uuid || service._id}`)}
                  className="bg-white border rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                    {service.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {service.leadsCount || 0} leads
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {hasMoreServices && !showAll && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-8 py-3 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] transition-colors"
                >
                  View All Services ({linkedServices?.length})
                </button>
              </div>
            )}

            {/* Back to Top Button */}
            {showAll && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(false)}
                  className="px-8 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Show Top Services
                </button>
              </div>
            )}

            {/* Empty State */}
            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                {search
                  ? <p className="text-gray-500">No services match <strong>"{search}"</strong>. <button onClick={() => setSearch('')} className="text-[#7e22ce] underline">Clear search</button></p>
                  : <p className="text-gray-500">No services available at the moment.</p>
                }
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ServicesPage;