import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';

export default function PaymentGatewayGeoSection() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [bulkGateway, setBulkGateway] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const data = await adminConsoleApi.paymentGatewayMappings.list();
      setMappings(data.mappings || []);
    } catch (error) {
      console.error('Failed to load payment gateway mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (countryCode, gateway) => {
    try {
      const exists = mappings.some(m => m.country_code === countryCode);
      if (exists) {
        await adminConsoleApi.paymentGatewayMappings.update(countryCode, { gateway });
      } else {
        await adminConsoleApi.paymentGatewayMappings.create({ country_code: countryCode, gateway });
      }
      await loadMappings();
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert('Failed to save mapping. Please check the country code format (2 letters).');
    }
  };

  const handleBulkAdd = async (countryCodes, gateway) => {
    try {
      const mappingsToCreate = countryCodes.map(cc => ({ country_code: cc, gateway }));
      await adminConsoleApi.paymentGatewayMappings.bulk(mappingsToCreate);
      await loadMappings();
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to bulk add:', error);
      alert('Failed to add mappings. Please check country code formats.');
    }
  };

  const handleDelete = async (countryCode) => {
    if (!confirm(`Are you sure you want to delete the gateway mapping for ${countryCode}?`)) {
      return;
    }
    try {
      await adminConsoleApi.paymentGatewayMappings.delete(countryCode);
      await loadMappings();
      setSelectedCountries(prev => {
        const next = new Set(prev);
        next.delete(countryCode);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const toggleSelectCountry = (countryCode) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(countryCode)) next.delete(countryCode);
      else next.add(countryCode);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCountries.size === filteredMappings.length) {
      setSelectedCountries(new Set());
    } else {
      setSelectedCountries(new Set(filteredMappings.map(m => m.country_code)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkGateway) {
      alert('Please select a gateway first');
      return;
    }
    if (selectedCountries.size === 0) {
      alert('Please select at least one country');
      return;
    }
    setBulkLoading(true);
    try {
      const bulkMappings = Array.from(selectedCountries).map(cc => ({
        country_code: cc,
        gateway: bulkGateway,
      }));
      await adminConsoleApi.paymentGatewayMappings.bulk(bulkMappings);
      await loadMappings();
      setSelectedCountries(new Set());
      setBulkGateway('');
    } catch (error) {
      console.error('Failed to bulk update:', error);
      alert('Failed to update mappings.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCountries.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCountries.size} gateway mapping(s)?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedCountries).map(cc => adminConsoleApi.paymentGatewayMappings.delete(cc))
      );
      await loadMappings();
      setSelectedCountries(new Set());
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      alert('Failed to delete some mappings.');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredMappings = mappings.filter(m =>
    (m.country_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.gateway || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">Loading payment gateway mappings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Geolocation Payment Gateway</h2>
          <p className="text-gray-400 mt-2">
            Assign Paragon, PavoPay, Gigadat (Interac), or Finaxis payment gateway to countries
          </p>
        </div>
        <button
          className="action-btn btn-primary w-full sm:w-auto"
          onClick={() => setIsAddingNew(true)}
        >
          <i className="fas fa-plus mr-2"></i>
          Add Mapping
        </button>
      </div>

      {/* Bulk Edit Bar */}
      {selectedCountries.size > 0 && (
        <div className="glass-card p-4 rounded-xl mb-4 border border-purple-500/30 bg-purple-500/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <i className="fas fa-check-square text-purple-400"></i>
              <span>{selectedCountries.size} countr{selectedCountries.size === 1 ? 'y' : 'ies'} selected</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <select
                className="search-input p-2 rounded"
                value={bulkGateway}
                onChange={(e) => setBulkGateway(e.target.value)}
              >
                <option value="">Change gateway to...</option>
                <option value="paragon">Paragon</option>
                <option value="pavopay">PavoPay</option>
                <option value="gigadat">Gigadat (Interac)</option>
                <option value="finaxis">Finaxis</option>
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkGateway || bulkLoading}
                className="action-btn btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                <i className={`fas ${bulkLoading ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
                {bulkLoading ? 'Updating...' : 'Apply to Selected'}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="action-btn btn-danger px-4 py-2 text-sm disabled:opacity-50"
              >
                <i className={`fas ${bulkLoading ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
                Delete Selected
              </button>
              <button
                onClick={() => { setSelectedCountries(new Set()); setBulkGateway(''); }}
                className="action-btn btn-secondary px-4 py-2 text-sm"
              >
                <i className="fas fa-times mr-2"></i>
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4 md:p-6 rounded-xl mb-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-search text-cyan-400"></i>
            <input
              type="text"
              placeholder="Search by country code or gateway..."
              className="search-input flex-1 max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Add Form */}
        {isAddingNew && (
          <BulkAddForm
            existingCodes={new Set(mappings.map(m => m.country_code))}
            onSave={handleBulkAdd}
            onSaveSingle={handleSave}
            onCancel={() => setIsAddingNew(false)}
          />
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold w-10">
                  <input
                    type="checkbox"
                    checked={filteredMappings.length > 0 && selectedCountries.size === filteredMappings.length}
                    onChange={toggleSelectAll}
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Country Code</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Payment Gateway</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Updated</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <GatewayMappingRow
                  key={mapping.country_code}
                  mapping={mapping}
                  isSelected={selectedCountries.has(mapping.country_code)}
                  onToggleSelect={() => toggleSelectCountry(mapping.country_code)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredMappings.length === 0 && !isAddingNew ? (
            <div className="text-center py-8 text-gray-400">
              No mappings found. {searchQuery && 'Try a different search term.'}
            </div>
          ) : (
            filteredMappings.map((mapping) => (
              <GatewayMappingMobile
                key={mapping.country_code}
                mapping={mapping}
                isSelected={selectedCountries.has(mapping.country_code)}
                onToggleSelect={() => toggleSelectCountry(mapping.country_code)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6 rounded-xl">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">
          <i className="fas fa-info-circle text-cyan-400 mr-2"></i>
          About Payment Gateway Mapping
        </h3>
        <div className="space-y-4 text-gray-300 text-sm md:text-base">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p>
                <strong className="text-white block mb-1">Dynamic Routing:</strong>
                Payments are automatically routed to the assigned gateway based on the user's country (detected via IP address).
              </p>
              <p>
                <strong className="text-white block mb-1">Country Codes:</strong>
                Use ISO 3166-1 alpha-2 country codes (2 letters, e.g., US, GB, DE, FR).
              </p>
            </div>
            <div className="space-y-3">
              <p>
                <strong className="text-white block mb-1">Fallback:</strong>
                Countries without a mapping here fall back to the default static rules (European countries use Paragon, others use Paragon with USD).
              </p>
              <p>
                <strong className="text-white block mb-1">Bulk Operations:</strong>
                Use checkboxes to select multiple countries, then change their gateway at once. When adding, enter multiple comma-separated country codes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkAddForm({ existingCodes = new Set(), onSave, onSaveSingle, onCancel }) {
  const [tags, setTags] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [gateway, setGateway] = useState('');
  const inputRef = React.useRef(null);

  const addTag = (value) => {
    const code = value.trim().toUpperCase();
    if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return;
    if (tags.includes(code)) return;
    if (existingCodes.has(code)) {
      alert(`${code} is already assigned a gateway`);
      setInputValue('');
      return;
    }
    setTags(prev => [...prev, code]);
    setInputValue('');
  };

  const removeTag = (code) => {
    setTags(prev => prev.filter(t => t !== code));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const codes = pasted.toUpperCase().split(/[\s,;]+/).map(c => c.trim()).filter(c => /^[A-Z]{2}$/.test(c));
    const newCodes = codes.filter(c => !existingCodes.has(c));
    const skipped = codes.filter(c => existingCodes.has(c));
    if (newCodes.length > 0) {
      setTags(prev => [...new Set([...prev, ...newCodes])]);
      setInputValue('');
    }
    if (skipped.length > 0) {
      alert(`Skipped already assigned: ${skipped.join(', ')}`);
    }
  };

  const handleSubmit = () => {
    if (!gateway) {
      alert('Please select a gateway');
      return;
    }
    if (tags.length === 0) {
      alert('Please add at least one country code');
      return;
    }
    if (tags.length === 1) {
      onSaveSingle(tags[0], gateway);
    } else {
      onSave(tags, gateway);
    }
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-white font-semibold mb-3">
        <i className="fas fa-plus-circle text-cyan-400 mr-2"></i>
        Add Country Mappings
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            Country Codes
            <span className="normal-case text-gray-500 ml-2">(type a 2-letter code and press Enter to add)</span>
          </label>
          <div
            className="search-input rounded w-full min-h-[48px] p-2 flex flex-wrap items-center gap-2 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {tags.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              >
                {code}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTag(code); }}
                  className="hover:text-red-400 transition-colors ml-0.5 text-xs"
                >
                  <i className="fas fa-times"></i>
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              maxLength="2"
              placeholder={tags.length === 0 ? 'Type country code, press Enter...' : ''}
              className="bg-transparent border-none outline-none text-white font-mono uppercase flex-1 min-w-[120px] p-1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
              autoFocus
            />
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span>{tags.length} countr{tags.length === 1 ? 'y' : 'ies'} added</span>
              <button
                onClick={() => setTags([])}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            Payment Gateway
          </label>
          <select
            className="search-input p-3 rounded w-full max-w-xs"
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
          >
            <option value="">Select Gateway</option>
            <option value="paragon">Paragon</option>
            <option value="pavopay">PavoPay</option>
            <option value="gigadat">Gigadat (Interac)</option>
            <option value="finaxis">Finaxis</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-600">
          <button onClick={handleSubmit} className="action-btn btn-primary flex-1 sm:flex-none px-6 py-3">
            <i className="fas fa-save mr-2"></i>
            {tags.length > 1 ? `Add ${tags.length} Countries` : 'Add Mapping'}
          </button>
          <button onClick={onCancel} className="action-btn btn-secondary flex-1 sm:flex-none px-6 py-3">
            <i className="fas fa-times mr-2"></i> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function GatewayMappingRow({ mapping, isSelected, onToggleSelect, onSave, onDelete }) {
  const [gateway, setGateway] = useState(mapping?.gateway || '');
  const isDirty = gateway !== (mapping?.gateway || '');

  const handleSave = () => {
    if (!gateway) return;
    onSave(mapping?.country_code, gateway);
  };

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/30 ${isSelected ? 'bg-purple-500/10' : ''}`}>
      <td className="py-4 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="accent-purple-500 w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center">
          <span className="font-semibold text-white font-mono">{mapping?.country_code}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <select
          className="search-input p-2 rounded w-full max-w-[180px]"
          value={gateway}
          onChange={(e) => setGateway(e.target.value)}
        >
          <option value="paragon">Paragon</option>
          <option value="pavopay">PavoPay</option>
          <option value="gigadat">Gigadat (Interac)</option>
          <option value="finaxis">Finaxis</option>
        </select>
      </td>
      <td className="py-4 px-4 text-sm text-gray-400">
        {mapping?.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : 'Never'}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`action-btn px-3 py-1 text-sm ${isDirty ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
            title={isDirty ? 'Save changes' : 'No changes to save'}
          >
            <i className="fas fa-save"></i>
          </button>
          <button onClick={() => onDelete(mapping?.country_code)} className="action-btn btn-danger px-3 py-1 text-sm">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}

function GatewayMappingMobile({ mapping, isSelected, onToggleSelect, onSave, onDelete }) {
  const [gateway, setGateway] = useState(mapping?.gateway || '');
  const isDirty = gateway !== (mapping?.gateway || '');

  const handleSave = () => {
    if (!gateway) return;
    onSave(mapping?.country_code, gateway);
  };

  return (
    <div className={`hover:bg-gray-800/40 border border-gray-700 rounded-lg p-4 transition-colors ${
      isSelected ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-800/20'
    }`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="accent-purple-500 w-4 h-4 cursor-pointer mr-3"
            />
            <div>
              <div className="font-semibold text-white font-mono text-lg">{mapping?.country_code}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Country Code</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`action-btn px-3 py-2 text-sm ${isDirty ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              title={isDirty ? 'Save changes' : 'No changes to save'}
            >
              <i className="fas fa-save"></i>
            </button>
            <button onClick={() => onDelete(mapping?.country_code)} className="action-btn btn-danger px-3 py-2 text-sm" title="Delete mapping">
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-600">
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Payment Gateway</div>
          <select
            className="search-input p-2 rounded w-full"
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
          >
            <option value="paragon">Paragon</option>
            <option value="pavopay">PavoPay</option>
            <option value="gigadat">Gigadat (Interac)</option>
            <option value="finaxis">Finaxis</option>
          </select>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Last Updated</div>
          <div className="text-sm text-gray-300">
            {mapping?.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}

