import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Calendar,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { PaymentLogos } from '@/components/PaymentLogos';
import { getChallengeBySlug } from '@/api/challenges';
import { chargeXoalaCard } from '@/api/payments';
import { readBrandAttribution } from '@/pages/CheckoutPage';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'OTHER', name: 'Other' },
];

const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

// ── Card helpers ───────────────────────────────────────────────────────
// Xoala's merchant config uses short brand codes:
//   Visa → VISA, Mastercard → MC, Amex → AMEX, Discover → DISCOVER.
const detectBrand = (num) => {
  const s = (num || '').replace(/\D/g, '');
  if (/^4/.test(s)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(s)) return 'MC';
  if (/^3[47]/.test(s)) return 'AMEX';
  if (/^6(?:011|5)/.test(s)) return 'DISCOVER';
  return '';
};

const luhnValid = (num) => {
  const s = (num || '').replace(/\D/g, '');
  if (s.length < 12 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const PayLink = () => {
  const { isDark } = useTheme();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    city: '',
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const {
    data: challenge,
    isLoading: loadingChallenge,
    isError: challengeError,
    error: challengeErrObj,
  } = useQuery({
    queryKey: ['challenge-by-slug', slug],
    queryFn: () => getChallengeBySlug(slug),
    enabled: !!slug,
    retry: 0,
  });

  const chargeMutation = useMutation({
    mutationFn: chargeXoalaCard,
    onSuccess: (data) => {
      if (data?.status === 'succeeded') {
        toast.success('Payment approved');
        navigate(`/pay/success?reference=${data.reference}`);
      } else if (data?.status === 'requires_action' && data?.redirectUrl) {
        toast.info('Verifying with your bank…');
        window.location.href = data.redirectUrl;
      } else if (data?.status === 'failed') {
        toast.error(data.message || 'Payment was declined. Please try a different card.');
      } else {
        toast.error('Unexpected response from payment processor.');
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Payment failed. Please try again.');
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCardNumberChange = (e) => {
    setForm({ ...form, cardNumber: formatCardNumber(e.target.value) });
  };

  const handleExpiryChange = (e) => {
    setForm({ ...form, expiry: formatExpiry(e.target.value) });
  };

  const handleCvvChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setForm({ ...form, cvv: digits });
  };

  const brand = detectBrand(form.cardNumber);

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email is not valid';
    if (!form.country) return 'Country is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.city.trim()) return 'City is required';

    if (!form.cardholderName.trim()) return 'Cardholder name is required';

    const cardDigits = form.cardNumber.replace(/\D/g, '');
    if (cardDigits.length < 12) return 'Enter a valid card number';
    if (!luhnValid(cardDigits)) return 'Card number is invalid';

    const [mm, yy] = form.expiry.split('/');
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return 'Expiry must be MM/YY';
    const monthNum = parseInt(mm, 10);
    if (monthNum < 1 || monthNum > 12) return 'Invalid expiry month';
    const expDate = new Date(2000 + parseInt(yy, 10), monthNum, 0, 23, 59, 59);
    if (expDate < new Date()) return 'Card has expired';

    if (form.cvv.length < 3) return 'CVV must be 3 or 4 digits';

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const attribution = readBrandAttribution();
    const cardDigits = form.cardNumber.replace(/\D/g, '');
    const [mm, yy] = form.expiry.split('/');

    chargeMutation.mutate({
      challengeId: challenge.id,
      slug,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      country: form.country,
      address: form.address.trim(),
      city: form.city.trim(),
      ...(attribution?.brandSlug ? { brandSlug: attribution.brandSlug } : {}),
      ...(attribution?.linkSlug ? { linkSlug: attribution.linkSlug } : {}),
      card: {
        number: cardDigits,
        expiryMonth: mm,
        expiryYear: `20${yy}`,
        cvv: form.cvv,
        holder: form.cardholderName.trim(),
        brand: brand || undefined,
      },
    });
  };

  const inputClass = isDark
    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500/50';

  const cardClass = isDark
    ? 'bg-[#12161d] border border-white/10'
    : 'bg-white border border-slate-200';

  const sectionHeaderClass = isDark
    ? 'text-xs font-semibold uppercase tracking-wider text-amber-500/80'
    : 'text-xs font-semibold uppercase tracking-wider text-amber-600';

  const dividerClass = isDark ? 'border-white/10' : 'border-slate-200';

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
            Payment Link Not Found
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
            {challengeErrObj?.message || 'This payment link is invalid or no longer active. Please contact the merchant who shared it with you.'}
          </p>
        </div>
      </div>
    );
  }

  const submitting = chargeMutation.isPending;

  return (
    <div className={`min-h-screen pt-20 pb-12 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2" autoComplete="on">
            <div className={`${cardClass} rounded-2xl p-6 lg:p-8`}>
              <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Complete Your Purchase
              </h1>
              <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Enter your billing and card details to complete your order.
              </p>

              {/* ── Billing details ── */}
              <div className={sectionHeaderClass}>Billing Details</div>
              <div className="mt-3 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>First Name *</label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        autoComplete="given-name"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Email Address *</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder="trader@example.com"
                      required
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    We'll send your account access and trading credentials here.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Phone (Optional)</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder="+44 7700 900000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Country *</label>
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
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Billing Address *</label>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder="221B Baker Street"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>City *</label>
                  <div className="relative">
                    <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                      placeholder="London"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ── Card details ── */}
              <div className={`mt-8 pt-6 border-t ${dividerClass}`}>
                <div className={sectionHeaderClass}>Payment Details</div>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Cardholder Name *</label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="cardholderName"
                        value={form.cardholderName}
                        onChange={handleChange}
                        autoComplete="cc-name"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder="As shown on the card"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Card Number *</label>
                    <div className="relative">
                      <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="tel"
                        inputMode="numeric"
                        name="cardNumber"
                        value={form.cardNumber}
                        onChange={handleCardNumberChange}
                        autoComplete="cc-number"
                        data-sentry-mask
                        className={`w-full rounded-xl pl-12 pr-20 py-3 tracking-widest focus:outline-none ${inputClass}`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={23}
                        required
                      />
                      {brand && (
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {brand}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Expiry (MM/YY) *</label>
                      <div className="relative">
                        <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        <input
                          type="tel"
                          inputMode="numeric"
                          name="expiry"
                          value={form.expiry}
                          onChange={handleExpiryChange}
                          autoComplete="cc-exp"
                          data-sentry-mask
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                          placeholder="07/27"
                          maxLength={5}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>CVV *</label>
                      <div className="relative">
                        <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        <input
                          type="tel"
                          inputMode="numeric"
                          name="cvv"
                          value={form.cvv}
                          onChange={handleCvvChange}
                          autoComplete="cc-csc"
                          data-sentry-mask
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-6 rounded-xl p-4 flex items-start gap-3 ${isDark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Your card is processed securely over TLS. We store only the last 4 digits for receipts — never the full number or CVV. 3-D Secure may be requested by your bank.
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
                    Processing payment…
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Pay {formatCurrency(challenge.price, challenge.currency)}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`${cardClass} rounded-2xl p-6 sticky top-24`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Order Summary</h3>

              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <div className="text-amber-500 font-bold text-lg">{challenge.name}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {challenge.accountSize.toLocaleString()} Account
                </div>
              </div>

              <div className={`border-t pt-4 space-y-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                {challenge.profitSplit !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Profit Split</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.profitSplit}%</span>
                  </div>
                )}
                {challenge.dailyDrawdownPercent !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Daily Drawdown</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.dailyDrawdownPercent}%</span>
                  </div>
                )}
                {challenge.overallDrawdownPercent !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Max Drawdown</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.overallDrawdownPercent}%</span>
                  </div>
                )}
              </div>

              <div className={`mt-4 pt-4 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Total</span>
                <span className="text-3xl font-black text-amber-500">
                  {formatCurrency(challenge.price, challenge.currency)}
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Secure card payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>3-D Secure protected</span>
                </div>
              </div>

              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>We accept</p>
                <PaymentLogos />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayLink;
