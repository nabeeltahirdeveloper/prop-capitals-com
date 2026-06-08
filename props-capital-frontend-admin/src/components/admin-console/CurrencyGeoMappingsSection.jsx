import { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function CurrencyGeoMappingsSection() {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMapping, setEditingMapping] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMappingsAndCurrencies();
  }, []);

  const loadMappingsAndCurrencies = async () => {
    try {
      setLoading(true);
      const [mappingsData, currenciesData] = await Promise.all([
        adminConsoleApi.currencyGeoMappings.list(),
        adminConsoleApi.currencies.list()
      ]);
      setMappings(mappingsData.mappings || []);
      setCurrencies(currenciesData.currencies || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (countryCode, currencyCode) => {
    try {
      if (editingMapping) {
        await adminConsoleApi.currencyGeoMappings.update(countryCode, { currency_code: currencyCode });
      } else {
        await adminConsoleApi.currencyGeoMappings.create({ country_code: countryCode, currency_code: currencyCode });
      }
      await loadMappingsAndCurrencies();
      setEditingMapping(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert(t("adminConsole.currencyGeo.saveFailed", { defaultValue: "Failed to save mapping. Please check the country code format (2 letters)." }));
    }
  };

  const handleDelete = async (countryCode) => {
    if (!confirm(t("adminConsole.currencyGeo.deleteConfirm", { defaultValue: "Are you sure you want to delete the mapping for {{countryCode}}?", countryCode }))) {
      return;
    }
    try {
      await adminConsoleApi.currencyGeoMappings.delete(countryCode);
      await loadMappingsAndCurrencies();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const filteredMappings = mappings.filter(m => 
    m.country_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.currency_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.currency_name && m.currency_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">{t("adminConsole.currencyGeo.loading", { defaultValue: "Loading geo mappings..." })}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">{t("adminConsole.currencyGeo.title", { defaultValue: "Currency Geo Mappings" })}</h2>
          <p className="text-gray-400 mt-2">
            {t("adminConsole.currencyGeo.subtitle", { defaultValue: "Configure which currency is automatically selected based on user location" })}
          </p>
        </div>
        <button 
          className="action-btn btn-primary w-full sm:w-auto"
          onClick={() => setIsAddingNew(true)}
        >
          <i className="fas fa-plus mr-2"></i>
          {t("adminConsole.currencyGeo.addMapping", { defaultValue: "Add Mapping" })}
        </button>
      </div>

      <div className="glass-card p-4 md:p-6 rounded-xl mb-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-search text-cyan-400"></i>
            <input
              type="text"
              placeholder={t("adminConsole.currencyGeo.searchPlaceholder", { defaultValue: "Search by country code or currency..." })}
              className="search-input flex-1 max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">{t("adminConsole.currencyGeo.colCountryCode", { defaultValue: "Country Code" })}</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">{t("adminConsole.currencyGeo.colCurrency", { defaultValue: "Currency" })}</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">{t("adminConsole.currencyGeo.colSymbol", { defaultValue: "Symbol" })}</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">{t("adminConsole.currencyGeo.colUpdated", { defaultValue: "Updated" })}</th>
                <th className="text-right py-3 px-4 text-gray-400 font-semibold">{t("adminConsole.currencyGeo.colActions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {isAddingNew && (
                <MappingRow
                  isNew={true}
                  currencies={currencies}
                  onSave={handleSave}
                  onCancel={() => setIsAddingNew(false)}
                />
              )}
              {filteredMappings.map((mapping) => (
                <MappingRow
                  key={mapping.country_code}
                  mapping={mapping}
                  currencies={currencies}
                  isEditing={editingMapping === mapping.country_code}
                  onEdit={() => setEditingMapping(mapping.country_code)}
                  onSave={handleSave}
                  onCancel={() => setEditingMapping(null)}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isAddingNew && (
            <MappingRowMobile
              isNew={true}
              currencies={currencies}
              onSave={handleSave}
              onCancel={() => setIsAddingNew(false)}
            />
          )}
          
          {filteredMappings.length === 0 && !isAddingNew ? (
            <div className="text-center py-8 text-gray-400">
              {t("adminConsole.currencyGeo.noMappings", { defaultValue: "No mappings found." })} {searchQuery && t("adminConsole.currencyGeo.tryDifferentSearch", { defaultValue: "Try a different search term." })}
            </div>
          ) : (
            filteredMappings.map((mapping) => (
              <MappingRowMobile
                key={mapping.country_code}
                mapping={mapping}
                currencies={currencies}
                isEditing={editingMapping === mapping.country_code}
                onEdit={() => setEditingMapping(mapping.country_code)}
                onSave={handleSave}
                onCancel={() => setEditingMapping(null)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6 rounded-xl">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">
          <i className="fas fa-info-circle text-cyan-400 mr-2"></i>
          {t("adminConsole.currencyGeo.aboutTitle", { defaultValue: "About Currency Geo Mappings" })}
        </h3>
        <div className="space-y-4 text-gray-300 text-sm md:text-base">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p>
                <strong className="text-white block mb-1">{t("adminConsole.currencyGeo.aboutAutoLabel", { defaultValue: "Automatic Detection:" })}</strong>
                {t("adminConsole.currencyGeo.aboutAutoText", { defaultValue: "When users visit your site, their currency is automatically set based on their country location (detected via IP address)." })}
              </p>
              <p>
                <strong className="text-white block mb-1">{t("adminConsole.currencyGeo.aboutCountryLabel", { defaultValue: "Country Codes:" })}</strong>
                {t("adminConsole.currencyGeo.aboutCountryText", { defaultValue: "Use ISO 3166-1 alpha-2 country codes (2 letters, e.g., US, GB, DE, FR)." })}
              </p>
            </div>
            <div className="space-y-3">
              <p>
                <strong className="text-white block mb-1">{t("adminConsole.currencyGeo.aboutFallbackLabel", { defaultValue: "Fallback:" })}</strong>
                {t("adminConsole.currencyGeo.aboutFallbackText", { defaultValue: "If no mapping exists for a country, USD is used as the default currency." })}
              </p>
              <p>
                <strong className="text-white block mb-1">{t("adminConsole.currencyGeo.aboutOverrideLabel", { defaultValue: "User Override:" })}</strong>
                {t("adminConsole.currencyGeo.aboutOverrideText", { defaultValue: "Users can manually change their currency, but it will reset to their geo-based currency on page reload." })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MappingRow({ mapping, currencies, isEditing, isNew, onEdit, onSave, onCancel, onDelete }) {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState(mapping?.country_code || '');
  const [currencyCode, setCurrencyCode] = useState(mapping?.currency_code || '');

  const handleSave = () => {
    if (!countryCode || !currencyCode) {
      alert(t("adminConsole.currencyGeo.fillAllFields", { defaultValue: "Please fill in all fields" }));
      return;
    }
    onSave(countryCode.toUpperCase(), currencyCode);
  };

  if (isNew || isEditing) {
    return (
      <>
        {/* Desktop table row */}
        <tr className="border-b border-gray-800 bg-gray-800/30 hidden md:table-row">
          <td className="py-4 px-4">
            <input
              type="text"
              maxLength="2"
              placeholder="US"
              className="search-input p-2 rounded w-20 uppercase"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              disabled={!isNew}
            />
          </td>
          <td className="py-4 px-4" colSpan="2">
            <select
              className="search-input p-2 rounded w-full max-w-xs"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              <option value="">{t("adminConsole.currencyGeo.selectCurrency", { defaultValue: "Select Currency" })}</option>
              {currencies.filter(c => c.active).map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </td>
          <td className="py-4 px-4"></td>
          <td className="py-4 px-4 text-right">
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSave}
                className="action-btn btn-primary px-3 py-1 text-sm"
              >
                <i className="fas fa-save mr-1"></i>
                {t("adminConsole.currencyGeo.save", { defaultValue: "Save" })}
              </button>
              <button
                onClick={onCancel}
                className="action-btn btn-secondary px-3 py-1 text-sm"
              >
                {t("adminConsole.currencyGeo.cancel", { defaultValue: "Cancel" })}
              </button>
            </div>
          </td>
        </tr>

        {/* Mobile card */}
        <tr className="md:hidden">
          <td colSpan="5" className="p-0">
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 m-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    {t("adminConsole.currencyGeo.colCountryCode", { defaultValue: "Country Code" })}
                  </label>
                  <input
                    type="text"
                    maxLength="2"
                    placeholder="US"
                    className="search-input p-3 rounded w-full uppercase text-center font-mono text-lg"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    disabled={!isNew}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    {t("adminConsole.currencyGeo.colCurrency", { defaultValue: "Currency" })}
                  </label>
                  <select
                    className="search-input p-3 rounded w-full"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                  >
                    <option value="">{t("adminConsole.currencyGeo.selectCurrency", { defaultValue: "Select Currency" })}</option>
                    {currencies.filter(c => c.active).map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-600">
                  <button
                    onClick={handleSave}
                    className="action-btn btn-primary flex-1 py-3"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {t("adminConsole.currencyGeo.saveMapping", { defaultValue: "Save Mapping" })}
                  </button>
                  <button
                    onClick={onCancel}
                    className="action-btn btn-secondary flex-1 py-3"
                  >
                    <i className="fas fa-times mr-2"></i>
                    {t("adminConsole.currencyGeo.cancel", { defaultValue: "Cancel" })}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      {/* Desktop table row */}
      <tr className="border-b border-gray-800 hover:bg-gray-800/30 hidden md:table-row">
        <td className="py-4 px-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getCountryFlag(mapping.country_code)}</span>
            <span className="font-semibold text-white font-mono">{mapping.country_code}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div>
            <div className="font-semibold text-white">{mapping.currency_code}</div>
            <div className="text-sm text-gray-400">{mapping.currency_name}</div>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className="text-xl text-cyan-400">{mapping.symbol}</span>
        </td>
        <td className="py-4 px-4 text-sm text-gray-400">
          {mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : t("adminConsole.currencyGeo.never", { defaultValue: "Never" })}
        </td>
        <td className="py-4 px-4 text-right">
          <div className="flex justify-end gap-2">
            <button
              onClick={onEdit}
              className="action-btn btn-primary px-3 py-1 text-sm"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => onDelete(mapping.country_code)}
              className="action-btn btn-danger px-3 py-1 text-sm"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>

      {/* Mobile card */}
      <tr className="md:hidden">
        <td colSpan="5" className="p-0">
          <div className="bg-gray-800/20 hover:bg-gray-800/40 border border-gray-700 rounded-lg p-4 m-2 transition-colors">
            <div className="space-y-3">
              {/* Country header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getCountryFlag(mapping.country_code)}</span>
                  <div>
                    <div className="font-semibold text-white font-mono text-lg">{mapping.country_code}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">{t("adminConsole.currencyGeo.colCountryCode", { defaultValue: "Country Code" })}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onEdit}
                    className="action-btn btn-primary px-3 py-2 text-sm"
                    title={t("adminConsole.currencyGeo.editMapping", { defaultValue: "Edit mapping" })}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => onDelete(mapping.country_code)}
                    className="action-btn btn-danger px-3 py-2 text-sm"
                    title={t("adminConsole.currencyGeo.deleteMapping", { defaultValue: "Delete mapping" })}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Currency info */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-600">
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.colCurrency", { defaultValue: "Currency" })}</div>
                  <div className="font-semibold text-white">{mapping.currency_code}</div>
                  <div className="text-sm text-gray-400">{mapping.currency_name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.colSymbol", { defaultValue: "Symbol" })}</div>
                  <div className="text-2xl text-cyan-400">{mapping.symbol}</div>
                </div>
              </div>

              {/* Updated info */}
              <div className="pt-2 border-t border-gray-700">
                <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.lastUpdated", { defaultValue: "Last Updated" })}</div>
                <div className="text-sm text-gray-300">
                  {mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : t("adminConsole.currencyGeo.never", { defaultValue: "Never" })}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// Mobile-only card component (no table structure)
function MappingRowMobile({ mapping, currencies, isEditing, isNew, onEdit, onSave, onCancel, onDelete }) {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState(mapping?.country_code || '');
  const [currencyCode, setCurrencyCode] = useState(mapping?.currency_code || '');

  const handleSave = () => {
    if (!countryCode || !currencyCode) {
      alert(t("adminConsole.currencyGeo.fillAllFields", { defaultValue: "Please fill in all fields" }));
      return;
    }
    onSave(countryCode.toUpperCase(), currencyCode);
  };

  if (isNew || isEditing) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              {t("adminConsole.currencyGeo.colCountryCode", { defaultValue: "Country Code" })}
            </label>
            <input
              type="text"
              maxLength="2"
              placeholder="US"
              className="search-input p-3 rounded w-full uppercase text-center font-mono text-lg"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              disabled={!isNew}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              {t("adminConsole.currencyGeo.colCurrency", { defaultValue: "Currency" })}
            </label>
            <select
              className="search-input p-3 rounded w-full"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              <option value="">{t("adminConsole.currencyGeo.selectCurrency", { defaultValue: "Select Currency" })}</option>
              {currencies.filter(c => c.active).map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-600">
            <button
              onClick={handleSave}
              className="action-btn btn-primary flex-1 py-3"
            >
              <i className="fas fa-save mr-2"></i>
              {t("adminConsole.currencyGeo.saveMapping", { defaultValue: "Save Mapping" })}
            </button>
            <button
              onClick={onCancel}
              className="action-btn btn-secondary flex-1 py-3"
            >
              <i className="fas fa-times mr-2"></i>
              {t("adminConsole.currencyGeo.cancel", { defaultValue: "Cancel" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/20 hover:bg-gray-800/40 border border-gray-700 rounded-lg p-4 transition-colors">
      <div className="space-y-3">
        {/* Country header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{getCountryFlag(mapping.country_code)}</span>
            <div>
              <div className="font-semibold text-white font-mono text-lg">{mapping.country_code}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">{t("adminConsole.currencyGeo.colCountryCode", { defaultValue: "Country Code" })}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="action-btn btn-primary px-3 py-2 text-sm"
              title={t("adminConsole.currencyGeo.editMapping", { defaultValue: "Edit mapping" })}
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => onDelete(mapping.country_code)}
              className="action-btn btn-danger px-3 py-2 text-sm"
              title={t("adminConsole.currencyGeo.deleteMapping", { defaultValue: "Delete mapping" })}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {/* Currency info */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-600">
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.colCurrency", { defaultValue: "Currency" })}</div>
            <div className="font-semibold text-white">{mapping.currency_code}</div>
            <div className="text-sm text-gray-400">{mapping.currency_name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.colSymbol", { defaultValue: "Symbol" })}</div>
            <div className="text-2xl text-cyan-400">{mapping.symbol}</div>
          </div>
        </div>

        {/* Updated info */}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{t("adminConsole.currencyGeo.lastUpdated", { defaultValue: "Last Updated" })}</div>
          <div className="text-sm text-gray-300">
            {mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : t("adminConsole.currencyGeo.never", { defaultValue: "Never" })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

