import React, { useEffect, useState } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { apiGet } from '@/lib/api';
import { COUNTRIES } from '@/constants/countries';

const CUSTOM_CHALLENGE_VALUE = '__custom__';

/**
 * QuickLinkModal
 * ──────────────
 * Admin pre-fills only the identity + commerce fields:
 *   - Customer email, phone, country
 *   - Brand, Challenge, Amount, Currency, Gateway, Platform
 *
 * Billing (first/last name, address, city, state opt, postal) and card
 * data are collected from the customer on the /q/<slug> page. The link
 * deactivates after the first successful charge and never emails the
 * customer (admin handles credentials hand-off privately).
 */
export default function QuickLinkModal({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    brand_id: '',
    challenge_id: '',
    name: '',
    amount: '',
    currency: 'EUR',
    provider: '',
    platform: '',
    customer_email: '',
    customer_phone: '',
    customer_country: '',
    active: true,
  });

  const [brands, setBrands] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isCustomChallenge, setIsCustomChallenge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedLink, setSavedLink] = useState(null);

  useEffect(() => {
    loadBrands();
    loadChallenges();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await adminConsoleApi.brands.list();
      const list = Array.isArray(data?.brands) ? data.brands : data || [];
      setBrands(list);
    } catch (err) {
      console.warn('Failed to load brands', err?.message);
    }
  };

  const loadChallenges = async () => {
    try {
      const data = await adminConsoleApi.directPurchaseLinks.listChallenges();
      if (Array.isArray(data?.challenges) && data.challenges.length > 0) {
        setChallenges(data.challenges);
        return;
      }
    } catch (_e) {}
    try {
      const raw = await apiGet('/challenges');
      const list = Array.isArray(raw) ? raw : raw?.challenges || [];
      setChallenges(
        list
          .filter((c) => c.isActive !== false)
          .map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            price: c.price,
            currency: c.currency,
            accountSize: c.accountSize,
            challengeType: c.challengeType,
          })),
      );
    } catch (err) {
      console.warn('Failed to load challenges', err?.message);
    }
  };

  const selectedChallenge = challenges.find(
    (c) => !isCustomChallenge && c.id === formData.challenge_id,
  );
  useEffect(() => {
    if (!selectedChallenge) return;
    setFormData((prev) => ({
      ...prev,
      amount: prev.amount === '' ? String(selectedChallenge.price ?? '') : prev.amount,
      currency:
        prev.currency === 'EUR' && selectedChallenge.currency
          ? selectedChallenge.currency
          : prev.currency,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChallenge?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const required = [
      ['brand_id', 'Brand'],
      ['customer_email', 'Customer email'],
      ['customer_country', 'Country'],
    ];
    if (!isCustomChallenge) {
      required.splice(1, 0, ['challenge_id', 'Challenge']);
    }
    for (const [key, label] of required) {
      if (!String(formData[key] ?? '').trim()) {
        setError(`${label} is required`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email.trim())) {
      setError('Customer email is invalid');
      return;
    }
    if (isCustomChallenge) {
      const amount = Number(formData.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Amount is required for CUSTOM challenge links');
        return;
      }
    }

    const payload = {
      brand_id: formData.brand_id,
      challenge_id: isCustomChallenge ? null : formData.challenge_id,
      name: formData.name?.trim() || null,
      amount: formData.amount !== '' ? Number(formData.amount) : null,
      currency: (formData.currency || 'EUR').toUpperCase(),
      provider: formData.provider || null,
      platform: formData.platform || null,
      customer_email: formData.customer_email.trim().toLowerCase(),
      customer_phone: formData.customer_phone?.trim() || null,
      customer_country: formData.customer_country.trim().toUpperCase(),
      active: formData.active,
    };

    setLoading(true);
    try {
      const res = await adminConsoleApi.quickLinks.create(payload);
      setSavedLink(res?.link || null);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  if (savedLink) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-lg w-full border border-gray-800">
          <h2 className="text-xl font-bold mb-3">Quick Link created</h2>
          <p className="text-sm text-gray-400 mb-4">
            Share this URL with the customer. The customer will fill their
            billing address + card details on the page. The link
            auto-deactivates after the first successful payment and never
            emails the customer.
          </p>
          <div className="bg-black/30 border border-gray-800 rounded-lg p-3 mb-4">
            <p className="font-mono text-xs break-all text-emerald-400">
              {savedLink.destination_url}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(savedLink.destination_url || '')
              }
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 text-white rounded-2xl p-6 max-w-2xl w-full border border-gray-800 my-8"
      >
        <h2 className="text-xl font-bold mb-1">Create Quick Link</h2>
        <p className="text-xs text-gray-400 mb-5">
          One-shot payment URL. You provide identity + commerce. The
          customer enters their name, billing address, and card details on
          the page.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Commerce — Brand + Challenge */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Brand</label>
            <select
              value={formData.brand_id}
              onChange={(e) =>
                setFormData({ ...formData, brand_id: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="">Select brand…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Challenge</label>
            <select
              value={isCustomChallenge ? CUSTOM_CHALLENGE_VALUE : formData.challenge_id}
              onChange={(e) => {
                if (e.target.value === CUSTOM_CHALLENGE_VALUE) {
                  setIsCustomChallenge(true);
                  setFormData({ ...formData, challenge_id: '', name: formData.name || 'CUSTOM' });
                  return;
                }
                setIsCustomChallenge(false);
                setFormData({ ...formData, challenge_id: e.target.value, amount: '' });
              }}
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="">Select challenge…</option>
              <option value={CUSTOM_CHALLENGE_VALUE}>CUSTOM — enter amount manually</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount + Currency + Provider + Platform */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
              placeholder={isCustomChallenge ? 'Required for CUSTOM' : ''}
              required={isCustomChallenge}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gateway</label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="">Auto</option>
              <option value="XOALA">Xoala</option>
              <option value="WORLDCARD">WorldCard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="">Ask</option>
              <option value="MT5">MT5</option>
              <option value="MT4">MT4</option>
              <option value="CTRADER">cTrader</option>
              <option value="DXTRADE">DXTrade</option>
              <option value="PT5">PT5</option>
              <option value="TRADELOCKER">TradeLocker</option>
              <option value="BYBIT">Bybit</option>
            </select>
          </div>
        </div>

        {/* Internal label */}
        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1">
            Internal label <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Premium customer Q3 deal"
            className="search-input p-3 rounded-lg w-full"
          />
        </div>

        {/* Customer identity — only what admin needs to bind */}
        <h3 className="text-sm font-semibold text-gray-300 mb-2 border-t border-gray-800 pt-4">
          Customer identity (used to bind the payment + acquirer routing)
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                setFormData({ ...formData, customer_email: e.target.value })
              }
              placeholder="customer@example.com"
              className="search-input p-3 rounded-lg w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) =>
                setFormData({ ...formData, customer_phone: e.target.value })
              }
              placeholder="+1 555 0100"
              className="search-input p-3 rounded-lg w-full"
            />
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1">Country</label>
          <select
            value={formData.customer_country}
            onChange={(e) =>
              setFormData({ ...formData, customer_country: e.target.value })
            }
            className="search-input p-3 rounded-lg w-full"
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            Name, billing address, city, state, and postal code are collected
            from the customer on the page itself.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create Quick Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
