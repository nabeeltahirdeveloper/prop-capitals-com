import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Shield,
  Lock,
  Loader2,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { PaymentLogos } from '@/components/PaymentLogos';
import { getChallengeBySlug } from '@/api/challenges';
import { COUNTRIES } from '@/constants/countries';
import { createXoalaCardSession, submitXoalaCheckout } from '@/api/payments';

// Trader-side checkout destination. Reached when the user clicks
// "Continue to Payment" inside /traderdashboard/checkout. The route param
// here is a Challenge id (the trader-side picker hands it off), but the
// backend by-slug lookup also accepts ids — so whichever value is here,
// the right Challenge resolves.
//
// This page is intentionally a separate file from PayLink even though the
// UI mirrors it, so the merchant-facing /pay/:slug page stays untouched.

const formatCurrency = (amount, currency) => {
  if (amount === undefined || amount === null) return '';
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount}`.trim();
  }
};

const validatePhoneNumber = (value, t) => {
  const v = value.trim();
  const compact = v.replace(/[\s\-()]/g, '');
  if (!v) return t('payCheckout.errors.phoneRequired');
  if (!/^\+[1-9]\d{9,14}$/.test(compact)) {
    return t('payCheckout.errors.phoneInvalid');
  }
  return '';
};

const PayCheckout = () => {
  const { isDark } = useTheme();
  const { formatFee, cur, formatAmount } = useCurrency();
  const { t } = useTranslation();
  const { slug } = useParams();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    city: '',
  });

  const {
    data: challenge,
    isLoading: loadingChallenge,
    isError: challengeError,
    error: challengeErrObj,
  } = useQuery({
    queryKey: ['challenge-by-id-or-slug', slug],
    queryFn: () => getChallengeBySlug(slug),
    enabled: !!slug,
    retry: 0,
  });

  const sessionMutation = useMutation({
    mutationFn: createXoalaCardSession,
    onSuccess: (data) => {
      if (data?.checkoutUrl && data?.fields) {
        toast.success(t('payCheckout.toasts.redirecting'));
        submitXoalaCheckout(data);
      } else {
        toast.error(t('payCheckout.toasts.couldNotStart'));
      }
    },
    onError: (err) => {
      toast.error(err?.message || t('payCheckout.toasts.failedToStart'));
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'phone' ? value.replace(/[^\d+\s\-()]/g, '').slice(0, 24) : value,
    });
  };

  const validate = () => {
    if (!form.firstName.trim()) return t('payCheckout.errors.firstNameRequired');
    if (!form.lastName.trim()) return t('payCheckout.errors.lastNameRequired');
    if (!form.email.trim()) return t('payCheckout.errors.emailRequired');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return t('payCheckout.errors.emailInvalid');
    const phoneError = validatePhoneNumber(form.phone, t);
    if (phoneError) return phoneError;
    if (!form.country) return t('payCheckout.errors.countryRequired');
    if (!form.address.trim()) return t('payCheckout.errors.addressRequired');
    if (!form.city.trim()) return t('payCheckout.errors.cityRequired');
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    sessionMutation.mutate({
      // Always use the canonical Challenge.id from the fetched record so the
      // backend doesn't fall back to slug lookup. The form details are passed
      // through purely for the audit trail / UserProfile fill-in — WorldCard
      // collects the real billing on its hosted page.
      challengeId: challenge.id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      country: form.country,
      address: form.address.trim(),
      city: form.city.trim(),
    });
  };

  const inputClass = isDark
    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500/50';

  const cardClass = isDark
    ? 'bg-[#12161d] border border-white/10'
    : 'bg-white border border-slate-200';

  if (loadingChallenge) {
    return (
      <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (challengeError || !challenge) {
    return (
      <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center px-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className={`${cardClass} rounded-2xl p-12 text-center max-w-md`}>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('payCheckout.notFound.title')}
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
            {challengeErrObj?.message || t('payCheckout.notFound.description')}
          </p>
        </div>
      </div>
    );
  }

  const submitting = sessionMutation.isPending;

  return (
    <div className={`min-h-screen pt-20 pb-12 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2">
            <div className={`${cardClass} rounded-2xl p-6 lg:p-8`}>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('payCheckout.form.title')}
              </h1>
              <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t('payCheckout.form.subtitle')}
              </p>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.firstName')}</label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        autoComplete="given-name"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder={t('payCheckout.placeholders.firstName')}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.lastName')}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder={t('payCheckout.placeholders.lastName')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.email')}</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder={t('payCheckout.placeholders.email')}
                      required
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {t('payCheckout.fields.emailHelp')}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.phone')}</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder="+44 7700 900000"
                        maxLength={24}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.country')}</label>
                    <div className="relative">
                      <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        autoComplete="country"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        required
                      >
                        <option value="">{t('payCheckout.placeholders.selectCountry')}</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.address')}</label>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder={t('payCheckout.placeholders.address')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('payCheckout.fields.city')}</label>
                  <div className="relative">
                    <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder={t('payCheckout.placeholders.city')}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={`mt-6 rounded-xl p-4 flex items-start gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  {t('payCheckout.secureNotice')}
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 py-6 h-auto font-bold text-base disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('payCheckout.button.redirecting')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t('payCheckout.button.pay', { amount: formatFee(challenge.price) })}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`${cardClass} rounded-2xl p-6 sticky top-24`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('payCheckout.summary.title')}</h3>

              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <div className="text-amber-500 font-bold text-lg">{cur(challenge.name)}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {challenge.accountSize != null
                    ? t('payCheckout.summary.account', { size: formatAmount(challenge.accountSize) })
                    : ''}
                </div>
              </div>

              <div className={`border-t pt-4 space-y-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                {challenge.profitSplit !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('payCheckout.summary.profitSplit')}</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.profitSplit}%</span>
                  </div>
                )}
                {challenge.dailyDrawdownPercent !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('payCheckout.summary.dailyDrawdown')}</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.dailyDrawdownPercent}%</span>
                  </div>
                )}
                {challenge.overallDrawdownPercent !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('payCheckout.summary.maxDrawdown')}</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.overallDrawdownPercent}%</span>
                  </div>
                )}
              </div>

              <div className={`mt-4 pt-4 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('payCheckout.summary.total')}</span>
                <span className="text-3xl font-black text-amber-500">
                  {formatFee(challenge.price)}
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('payCheckout.trust.secureCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('payCheckout.trust.threeDSecure')}</span>
                </div>
              </div>

              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{t('payCheckout.acceptedPayments')}</p>
                <PaymentLogos />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayCheckout;
