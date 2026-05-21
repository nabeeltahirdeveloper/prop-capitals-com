import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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
import { useCurrency } from '@/contexts/CurrencyContext';
import { PaymentLogos } from '@/components/PaymentLogos';
import { getChallengeBySlug } from '@/api/challenges';
import { chargeXoalaCard } from '@/api/payments';
import { readBrandAttribution } from '@/pages/CheckoutPage';

// ISO-3166 alpha-2 — never use a placeholder like "OTHER" because the
// gateway rejects anything that isn't a real country code.
const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
];

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
  if (s.length < 13 || s.length > 19) return false;
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

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
};

const validateField = (name, value) => {
  switch (name) {
    case 'firstName':
      if (!value.trim()) return 'First name is required';
      if (value.trim().length < 2) return 'First name must be at least 2 characters';
      return '';
    case 'lastName':
      if (!value.trim()) return 'Last name is required';
      if (value.trim().length < 2) return 'Last name must be at least 2 characters';
      return '';
    case 'email': {
      const v = value.trim();
      if (!v) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address';
      return '';
    }
    case 'phone': {
      const v = value.trim();
      if (!v) return ''; // optional
      if (!/^[+\d][\d\s\-()]{5,19}$/.test(v)) return 'Enter a valid phone number';
      return '';
    }
    case 'country':
      return value ? '' : 'Country is required';
    case 'address':
      if (!value.trim()) return 'Billing address is required';
      if (value.trim().length < 4) return 'Address looks too short';
      return '';
    case 'city':
      return value.trim() ? '' : 'City is required';
    case 'state':
      return ''; // optional
    case 'postalCode': {
      const v = value.trim();
      if (!v) return 'Postal / ZIP code is required';
      if (!/^[0-9A-Za-z\- ]{2,10}$/.test(v)) return 'Postal code must be 2-10 letters, digits or hyphens';
      return '';
    }
    case 'cardholderName':
      if (!value.trim()) return 'Cardholder name is required';
      if (!/^[A-Za-z\s.'-]{2,}$/.test(value.trim())) return 'Cardholder name has invalid characters';
      return '';
    case 'cardNumber': {
      const digits = (value || '').replace(/\D/g, '');
      if (!digits) return 'Card number is required';
      if (digits.length < 13) return 'Enter a valid card number';
      if (!luhnValid(digits)) return 'Card number is invalid';
      return '';
    }
    case 'expiry': {
      const [mm, yy] = (value || '').split('/');
      if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return 'Expiry must be MM/YY';
      const monthNum = parseInt(mm, 10);
      if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) return 'Invalid expiry month';
      const yearNum = parseInt(yy, 10);
      if (Number.isNaN(yearNum)) return 'Invalid expiry year';
      const expDate = new Date(2000 + yearNum, monthNum, 0, 23, 59, 59);
      if (expDate < new Date()) return 'Card has expired';
      return '';
    }
    case 'cvv':
      if (!value) return 'CVV is required';
      if (value.length < 3) return 'CVV must be 3 or 4 digits';
      return '';
    default:
      return '';
  }
};

const FieldError = ({ name, error }) =>
  error ? (
    <p
      id={`${name}-error`}
      role="alert"
      className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      {error}
    </p>
  ) : null;

const PayLink = () => {
  const { isDark } = useTheme();
  const { formatFee, cur } = useCurrency();
  const { slug } = useParams();
  const navigate = useNavigate();

  // Route is protected — anyone hitting /pay/:slug must be logged in. The
  // email used to provision the trading account comes from the JWT on the
  // backend, so we also autofill (and lock) the email field here to make
  // it obvious which account the user is paying for.
  const { status: authStatus, user: authUser } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Bounce unauthenticated users to sign-in; preserve where they came from
  // so they land back on this exact pay link after logging in.
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/SignIn?next=${next}`, { replace: true });
    }
  }, [authStatus, location.pathname, location.search, navigate]);

  // Pre-fill name + email from the logged-in user once we have them.
  useEffect(() => {
    if (authStatus !== 'authenticated' || !authUser) return;
    setForm((prev) => ({
      ...prev,
      email: prev.email || authUser.email || '',
      firstName: prev.firstName || authUser.firstName || authUser.profile?.firstName || '',
      lastName: prev.lastName || authUser.lastName || authUser.profile?.lastName || '',
    }));
  }, [authStatus, authUser]);

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
        // Xoala 3DS uses a POST redirect with parameters (e.g. TermUrl, MD).
        // For POST we build a hidden form and submit it; for GET we just
        // change location.
        if (data.redirectMethod === 'POST' && Array.isArray(data.redirectParams)) {
          const formEl = document.createElement('form');
          formEl.method = 'POST';
          formEl.action = data.redirectUrl;
          data.redirectParams.forEach(({ name, value }) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = String(name);
            input.value = value == null ? '' : String(value);
            formEl.appendChild(input);
          });
          document.body.appendChild(formEl);
          formEl.submit();
        } else {
          window.location.href = data.redirectUrl;
        }
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

  // Revalidate inline only if the user has already seen an error for this
  // field — keeps first-time typing quiet, but gives instant feedback once
  // they're trying to fix something.
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: validateField(name, value) } : prev));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);
  const handleCardNumberChange = (e) => setField('cardNumber', formatCardNumber(e.target.value));
  const handleExpiryChange = (e) => setField('expiry', formatExpiry(e.target.value));
  // Phone field allows only +, digits, spaces, hyphens and parentheses so
  // letters typed/pasted are silently stripped instead of just failing
  // validation on blur.
  const handlePhoneChange = (e) =>
    setField('phone', e.target.value.replace(/[^\d+\s\-()]/g, '').slice(0, 20));
  const handleCvvChange = (e) =>
    setField('cvv', e.target.value.replace(/\D/g, '').slice(0, 4));

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const brand = detectBrand(form.cardNumber);

  const validateAll = () => {
    const next = {};
    let firstError = '';
    let firstErrorField = '';
    Object.keys(INITIAL_FORM).forEach((k) => {
      const err = validateField(k, form[k]);
      if (err) {
        next[k] = err;
        if (!firstError) {
          firstError = err;
          firstErrorField = k;
        }
      }
    });
    setErrors(next);
    return { firstError, firstErrorField };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { firstError, firstErrorField } = validateAll();
    if (firstError) {
      toast.error(firstError);
      const el = document.getElementsByName(firstErrorField)[0];
      if (el && typeof el.focus === 'function') el.focus();
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
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim(),
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

  // Per-field error styling — appended after the base input class so the
  // red border overrides the theme border.
  const errClass = (name) =>
    errors[name] ? 'border-red-500 focus:border-red-500' : '';
  const ariaProps = (name) =>
    errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` }
      : { 'aria-invalid': false };

  // Hold render while auth status is still being checked (or unauth, during
  // the brief moment before the redirect effect fires) — stops the form
  // from flashing into view for users who shouldn't see it.
  if (loadingChallenge || authStatus === 'checking' || authStatus === 'unauthenticated') {
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
          <form onSubmit={handleSubmit} className="lg:col-span-2" autoComplete="on" noValidate>
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
                        onBlur={handleBlur}
                        autoComplete="given-name"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('firstName')}`}
                        placeholder="John"
                        required
                        {...ariaProps('firstName')}
                      />
                    </div>
                    <FieldError name="firstName" error={errors.firstName} />
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="family-name"
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none ${inputClass} ${errClass('lastName')}`}
                      placeholder="Doe"
                      required
                      {...ariaProps('lastName')}
                    />
                    <FieldError name="lastName" error={errors.lastName} />
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
                      readOnly
                      autoComplete="email"
                      className={`w-full rounded-xl pl-12 pr-12 py-3 focus:outline-none cursor-not-allowed opacity-90 ${inputClass}`}
                      placeholder="trader@example.com"
                      required
                      aria-readonly="true"
                    />
                    <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    Locked to your account email. Credentials and receipts go here.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Phone (Optional)</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handlePhoneChange}
                        onBlur={handleBlur}
                        autoComplete="tel"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('phone')}`}
                        placeholder="+1 555 0100"
                        maxLength={20}
                        {...ariaProps('phone')}
                      />
                    </div>
                    <FieldError name="phone" error={errors.phone} />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      Enter phone number with country code (e.g. +1 555 0100).
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Country *</label>
                    <div className="relative">
                      <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="country"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('country')}`}
                        required
                        {...ariaProps('country')}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <FieldError name="country" error={errors.country} />
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
                      onBlur={handleBlur}
                      autoComplete="street-address"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('address')}`}
                      placeholder="221B Baker Street"
                      required
                      {...ariaProps('address')}
                    />
                  </div>
                  <FieldError name="address" error={errors.address} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>City *</label>
                    <div className="relative">
                      <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="address-level2"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('city')}`}
                        placeholder="London"
                        required
                        {...ariaProps('city')}
                      />
                    </div>
                    <FieldError name="city" error={errors.city} />
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>State / Region (Optional)</label>
                    <div className="relative">
                      <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="address-level1"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
                        placeholder="England"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Postal / ZIP Code *</label>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="postal-code"
                      className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('postalCode')}`}
                      placeholder="SW1A 1AA"
                      maxLength={10}
                      required
                      {...ariaProps('postalCode')}
                    />
                  </div>
                  <FieldError name="postalCode" error={errors.postalCode} />
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
                        onBlur={handleBlur}
                        autoComplete="off"
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('cardholderName')}`}
                        placeholder="As shown on the card"
                        required
                        {...ariaProps('cardholderName')}
                      />
                    </div>
                    <FieldError name="cardholderName" error={errors.cardholderName} />
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
                        onBlur={handleBlur}
                        autoComplete="off"
                        data-sentry-mask
                        className={`w-full rounded-xl pl-12 pr-20 py-3 tracking-widest focus:outline-none ${inputClass} ${errClass('cardNumber')}`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={23}
                        required
                        {...ariaProps('cardNumber')}
                      />
                      {brand && (
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {brand}
                        </span>
                      )}
                    </div>
                    <FieldError name="cardNumber" error={errors.cardNumber} />
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
                          onBlur={handleBlur}
                          autoComplete="off"
                          data-sentry-mask
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('expiry')}`}
                          placeholder="07/27"
                          maxLength={5}
                          required
                          {...ariaProps('expiry')}
                        />
                      </div>
                      <FieldError name="expiry" error={errors.expiry} />
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
                          onBlur={handleBlur}
                          autoComplete="off"
                          data-sentry-mask
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('cvv')}`}
                          placeholder="123"
                          maxLength={4}
                          required
                          {...ariaProps('cvv')}
                        />
                      </div>
                      <FieldError name="cvv" error={errors.cvv} />
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
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay {formatFee(challenge.price)}
                  </>
                )}
              </Button>
              {submitting && (
                <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  Please don't close or refresh this window.
                </p>
              )}
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`${cardClass} rounded-2xl p-6 sticky top-24`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Order Summary</h3>

              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <div className="text-amber-500 font-bold text-lg">{cur(challenge.name)}</div>
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
                  {formatFee(challenge.price)}
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
