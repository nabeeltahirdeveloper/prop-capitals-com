import React, { useState, useEffect } from 'react';
import { resellerApi } from '@/api/reseller';

export default function ResellerLinksSection() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await resellerApi.network.brands();
      setBrands(data.brands || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
      setError('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const selectBrand = async (brand) => {
    setSelectedBrand(brand);
    setLinksLoading(true);
    setLinks([]);
    setError('');
    try {
      const data = await resellerApi.links.listByBrand(brand.id);
      setLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load brand links:', err);
      setError('Failed to load links for this brand');
    } finally {
      setLinksLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Link copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const getTrackingUrl = (link) => {
    try {
      const url = new URL(link.destination_url);
      url.searchParams.set('link', link.link_id);
      return url.toString();
    } catch {
      return link.destination_url || '';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
        <p className="text-gray-600">Loading brands...</p>
      </div>
    );
  }

  const mainLink = links.find(l => l.is_main_link);
  const packageLinks = links.filter(l => !l.is_main_link);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Brand Links</h2>
          <p className="text-gray-600">
            Select a brand to view and copy its tracking links.
          </p>
        </div>
        <button
          onClick={() => { setSelectedBrand(null); setLinks([]); loadBrands(); }}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <i className="fas fa-check-circle mr-2"></i>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Brand selected — show back button + links */}
      {selectedBrand ? (
        <div>
          <button
            onClick={() => { setSelectedBrand(null); setLinks([]); }}
            className="mb-4 px-4 py-2 text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Brands
          </button>

          <div className="mb-6 flex items-center gap-4">
            {selectedBrand.logo_url ? (
              <img src={selectedBrand.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                {(selectedBrand.name || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedBrand.name}</h3>
              {selectedBrand.slug && (
                <p className="text-sm text-gray-500 font-mono">{selectedBrand.slug}</p>
              )}
            </div>
          </div>

          {linksLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
              <p className="text-gray-600">Loading links...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
              <i className="fas fa-link text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Links</h3>
              <p className="text-gray-600">No tracking links have been created for this brand yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Link */}
              {mainLink && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Main Link</h3>
                  <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <input
                      type="text"
                      value={getTrackingUrl(mainLink)}
                      readOnly
                      className="flex-1 bg-transparent text-gray-700 outline-none font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(getTrackingUrl(mainLink))}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <i className="fas fa-copy mr-2"></i>Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-eye mr-2"></i>Visits
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{mainLink.visits_count || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-receipt mr-2"></i>Transactions
                      </div>
                      <div className="text-3xl font-bold text-purple-600">{mainLink.transactions_count || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-percentage mr-2"></i>Conv. Rate
                      </div>
                      <div className={`text-3xl font-bold ${Number(mainLink.conversion_rate || 0) >= 50 ? 'text-green-600' : 'text-gray-600'}`}>
                        {Number(mainLink.conversion_rate || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Package Links */}
              {packageLinks.map((link) => (
                <div key={link.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{link.name}</h3>
                  <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <input
                      type="text"
                      value={getTrackingUrl(link)}
                      readOnly
                      className="flex-1 bg-transparent text-gray-700 outline-none font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(getTrackingUrl(link))}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <i className="fas fa-copy mr-2"></i>Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-eye mr-2"></i>Visits
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{link.visits_count || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-receipt mr-2"></i>Transactions
                      </div>
                      <div className="text-3xl font-bold text-purple-600">{link.transactions_count || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <i className="fas fa-percentage mr-2"></i>Conv. Rate
                      </div>
                      <div className={`text-3xl font-bold ${
                        Number(link.conversion_rate || 0) >= 50 ? 'text-green-600'
                          : Number(link.conversion_rate || 0) > 0 ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {Number(link.conversion_rate || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Brand list */
        brands.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
            <i className="fas fa-store text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Brands</h3>
            <p className="text-gray-600">You don't have any brands in your network yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => selectBrand(brand)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-left hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                      {(brand.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                      {brand.name}
                    </h4>
                    {brand.slug && (
                      <p className="text-xs text-gray-500 font-mono truncate">{brand.slug}</p>
                    )}
                  </div>
                  <i className="fas fa-chevron-right text-gray-400 group-hover:text-purple-500 transition-colors"></i>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {brand.status || 'active'}
                  </span>
                  <span className="text-gray-500">
                    {brand.total_orders || 0} orders
                  </span>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
