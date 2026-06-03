import React, { useState, useEffect, useMemo } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { apiGet } from '@/lib/api';
import { useTranslation } from '../../contexts/LanguageContext';

const formatAccountSize = (size) => {
  if (!size) return '';
  if (size >= 1_000_000) return `${size / 1_000_000}M`;
  if (size >= 1000) return `${size / 1000}K`;
  return String(size);
};

export default function DirectPurchaseLinkModal({ link, brands, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!link;

  // 'custom' = brand + name + custom destination URL
  // 'challenge' = brand + challenge (URL auto-built)
  const initialMode = isEdit
    ? link.challenge_id
      ? 'challenge'
      : 'custom'
    : 'custom';
  const [mode, setMode] = useState(initialMode);

  const [formData, setFormData] = useState({
    brand_id: link?.brand_id || '',
    challenge_id: link?.challenge_id || '',
    name: link?.name || '',
    custom_url: link?.custom_url || '',
    amount: link?.total_amount != null ? String(link.total_amount) : '',
    currency: link?.currency || 'USD',
    active: link?.is_active !== undefined ? link.is_active : true,
  });

  const [challenges, setChallenges] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChallenges();
    loadCurrencies();
  }, []);

  const loadChallenges = async () => {
    // Try the admin-console endpoint first (richer shape); fall back to the
    // public /challenges route so the dropdown still populates if the backend
    // hasn't been restarted to pick up the new admin route yet.
    try {
      const data = await adminConsoleApi.directPurchaseLinks.listChallenges();
      if (Array.isArray(data?.challenges) && data.challenges.length > 0) {
        setChallenges(data.challenges);
        return;
      }
    } catch (err) {
      console.warn('Admin challenges endpoint unavailable, falling back:', err?.message);
    }
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
            challenge_type: c.challengeType,
            account_size: c.accountSize,
            price: c.price,
            currency: c.currency,
          })),
      );
    } catch (err) {
      console.error('Failed to load challenges:', err);
    }
  };

  const loadCurrencies = async () => {
    try {
      const data = await adminConsoleApi.currencies.list();
      const list = (data?.currencies || []).filter((c) => c.active !== false);
      setCurrencies(list);
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
  };

  const selectedChallenge = useMemo(
    () => challenges.find((c) => c.id === formData.challenge_id),
    [challenges, formData.challenge_id],
  );

  useEffect(() => {
    // When the admin picks a challenge and hasn't typed an amount/name, prefill
    if (mode === 'challenge' && selectedChallenge) {
      setFormData((prev) => ({
        ...prev,
        amount: prev.amount === '' ? String(selectedChallenge.price ?? '') : prev.amount,
        name:
          prev.name === ''
            ? `${selectedChallenge.name} ($${selectedChallenge.price})`
            : prev.name,
      }));
    }
  }, [mode, selectedChallenge]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.brand_id) {
      setError(
        t('adminConsole.directLinks.modal.brandRequired', {
          defaultValue: 'Please select a brand',
        }),
      );
      return;
    }

    if (mode === 'custom' && !formData.custom_url.trim()) {
      setError(
        t('adminConsole.directLinks.modal.customUrlRequired', {
          defaultValue: 'Custom destination URL is required',
        }),
      );
      return;
    }

    if (mode === 'challenge' && !formData.challenge_id) {
      setError(
        t('adminConsole.directLinks.modal.challengeRequired', {
          defaultValue: 'Please select a challenge',
        }),
      );
      return;
    }

    const payload = {
      brand_id: formData.brand_id,
      name: formData.name?.trim() || null,
      currency: formData.currency,
      active: formData.active,
      amount: formData.amount !== '' ? Number(formData.amount) : null,
      challenge_id: mode === 'challenge' ? formData.challenge_id : null,
      custom_url: mode === 'custom' ? formData.custom_url.trim() : '',
      // null clears the override and falls the link back to the 50/50
      // router. Backend whitelist-validates the value so any garbage
      // becomes null too.
      provider: formData.provider || null,
    };

    setLoading(true);
    try {
      if (isEdit) {
        // Brand can't be changed on edit (would break existing analytics)
        const { brand_id, ...editPayload } = payload;
        await adminConsoleApi.directPurchaseLinks.update(link.id, editPayload);
      } else {
        await adminConsoleApi.directPurchaseLinks.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err?.message ||
          t('adminConsole.directLinks.modal.saveError', {
            defaultValue: 'Failed to save link',
          }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">
            {isEdit
              ? t('adminConsole.directLinks.modal.editTitle', {
                  defaultValue: 'Edit Direct Purchase Link',
                })
              : t('adminConsole.directLinks.modal.createTitle', {
                  defaultValue: 'Create Direct Purchase Link',
                })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode toggle (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('adminConsole.directLinks.modal.linkType', {
                  defaultValue: 'Link Type',
                })}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === 'custom'
                      ? 'border-orange-400 bg-orange-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    <i className="fas fa-link mr-2"></i>
                    {t('adminConsole.directLinks.modal.modeCustomTitle', {
                      defaultValue: 'Custom URL',
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t('adminConsole.directLinks.modal.modeCustomDesc', {
                      defaultValue:
                        'Point this link to any destination URL you provide.',
                    })}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('challenge')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    mode === 'challenge'
                      ? 'border-orange-400 bg-orange-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    <i className="fas fa-trophy mr-2"></i>
                    {t('adminConsole.directLinks.modal.modeChallengeTitle', {
                      defaultValue: 'Challenge Link',
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t('adminConsole.directLinks.modal.modeChallengeDesc', {
                      defaultValue:
                        'Auto-builds the URL from brand + challenge slug.',
                    })}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('adminConsole.directLinks.modal.brand', {
                defaultValue: 'Brand',
              })}{' '}
              <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.brand_id}
              onChange={(e) =>
                setFormData({ ...formData, brand_id: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
              disabled={isEdit}
              required
            >
              <option value="">
                {t('adminConsole.directLinks.modal.selectBrand', {
                  defaultValue: 'Select a brand…',
                })}
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">
                {t('adminConsole.directLinks.modal.brandLockedHint', {
                  defaultValue:
                    "Brand can't be changed after the link is created (analytics would break).",
                })}
              </p>
            )}
          </div>

          {/* Challenge picker (challenge mode only) */}
          {mode === 'challenge' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('adminConsole.directLinks.modal.challenge', {
                  defaultValue: 'Challenge',
                })}{' '}
                <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.challenge_id}
                onChange={(e) =>
                  setFormData({ ...formData, challenge_id: e.target.value })
                }
                className="search-input p-3 rounded-lg w-full"
                required
              >
                <option value="">
                  {t('adminConsole.directLinks.modal.selectChallenge', {
                    defaultValue: 'Select a challenge…',
                  })}
                </option>
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.account_size ? ` — ${formatAccountSize(c.account_size)}` : ''}
                    {c.price != null ? ` ($${c.price})` : ''}
                  </option>
                ))}
              </select>
              {challenges.length === 0 && (
                <p className="text-xs text-yellow-300 mt-1">
                  {t('adminConsole.directLinks.modal.noChallenges', {
                    defaultValue:
                      'No active challenges found. Create one in the Challenges section first.',
                  })}
                </p>
              )}
            </div>
          )}

          {/* Custom URL (custom mode only) */}
          {mode === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('adminConsole.directLinks.modal.customUrl', {
                  defaultValue: 'Destination URL',
                })}{' '}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={formData.custom_url}
                onChange={(e) =>
                  setFormData({ ...formData, custom_url: e.target.value })
                }
                className="search-input p-3 rounded-lg w-full font-mono text-sm"
                placeholder="https://prop-capitals.com/checkout?type=one_phase&size=30K"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('adminConsole.directLinks.modal.customUrlHint', {
                  defaultValue:
                    'Customers who open this link will be redirected here.',
                })}
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('adminConsole.directLinks.modal.name', {
                defaultValue: 'Name',
              })}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="search-input p-3 rounded-lg w-full"
              placeholder={t('adminConsole.directLinks.modal.namePlaceholder', {
                defaultValue: 'Optional display name',
              })}
            />
          </div>

          {/* Amount + currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('adminConsole.directLinks.modal.amount', {
                  defaultValue: 'Amount',
                })}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="search-input p-3 rounded-lg w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('adminConsole.directLinks.modal.currency', {
                  defaultValue: 'Currency',
                })}
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="search-input p-3 rounded-lg w-full"
              >
                {currencies.length === 0 && (
                  <option value={formData.currency || 'USD'}>
                    {formData.currency || 'USD'}
                  </option>
                )}
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol ? `${c.symbol} ` : ''}
                    {c.code}
                    {c.name ? ` — ${c.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-5 h-5"
              />
              <span className="text-sm">
                {t('adminConsole.directLinks.modal.activeLabel', {
                  defaultValue: 'Active (link accepts visits)',
                })}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="action-btn btn-secondary"
              disabled={loading}
            >
              {t('adminConsole.directLinks.modal.cancel', {
                defaultValue: 'Cancel',
              })}
            </button>
            <button
              type="submit"
              className="action-btn btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              {isEdit
                ? t('adminConsole.directLinks.modal.save', {
                    defaultValue: 'Save Changes',
                  })
                : t('adminConsole.directLinks.modal.create', {
                    defaultValue: 'Create Link',
                  })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
