import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import {
  chargeXoalaCard,
  chargeWorldCardCard,
  createWorldCardSession,
  resolvePaymentProvider,
  submitPaymentRedirect,
} from '@/api/payments';
import { readBrandAttribution } from '@/pages/CheckoutPage';
import { COUNTRIES } from '@/constants/countries';

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

// Card-entry fields. Skipped during validation in the hosted WorldCard flow,
// where the card is captured on WorldCard's own page rather than here.
const CARD_FIELDS = ['cardholderName', 'cardNumber', 'expiry', 'cvv'];

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
      const compact = v.replace(/[\s\-()]/g, '');
      if (!v) return 'Phone number is required';
      if (!/^\+[1-9]\d{9,14}$/.test(compact)) {
        return 'Enter a valid phone number with country code (e.g. +1 202 555 0100)';
      }
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
  const { currency, setCurrency, formatFee, cur, formatAmount } = useCurrency();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Forwarded from /checkout when the user picked a platform in that wizard.
  // If not set, the backend falls back to challenge.platform.
  const platformFromQuery = searchParams.get('platform') || undefined;
  const brandSlugFromQuery = searchParams.get('brand') || undefined;
  const linkSlugFromQuery = searchParams.get('link') || undefined;
  const customPriceFromQuery = (() => {
    const v = searchParams.get('customPrice');
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  // Logged-in users keep the normal locked-account flow. Guests can complete
  // checkout with their billing email; the backend creates an account after
  // payment and sends the set-password link on successful provisioning.
  const { status: authStatus, user: authUser } = useAuth();
  const isAuthenticated = authStatus === 'authenticated';

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  // Required acknowledgements before submit. The Pay button stays disabled
  // until both are ticked; the T&C link goes to the public Terms page, and
  // the age confirmation is a hard regulatory gate.
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);

  // Payment provider routing.
  // /payments/provider tells us which gateway to use AND, for WorldCard,
  // which flow ('hosted' vs 's2s'). The route param /pay/<slug> can
  // itself be a brand-link slug — the backend checks both.
  const [provider, setProvider] = useState('xoala');
  const [worldCardFlow, setWorldCardFlow] = useState('hosted');
  const [providerResolved, setProviderResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const attribution = readBrandAttribution();
    const linkSlug = linkSlugFromQuery || attribution?.linkSlug || slug;
    resolvePaymentProvider({ linkSlug, challengeSlug: slug })
      .then((res) => {
        if (cancelled) return;
        if (res?.provider) setProvider(res.provider);
        if (res?.worldCardFlow) setWorldCardFlow(res.worldCardFlow);
      })
      .catch(() => { /* fall back to default 'xoala' / 'hosted' */ })
      .finally(() => {
        if (!cancelled) setProviderResolved(true);
      });
    return () => { cancelled = true; };
  }, [slug, linkSlugFromQuery]);

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
        submitPaymentRedirect(data);
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

  // WorldCard hosted-page session: backend returns redirectUrl; the
  // browser follows it and the customer enters card on WorldCard's
  // own domain. No PAN/CVV ever touches our backend in this flow.
  const worldCardSessionMutation = useMutation({
    mutationFn: createWorldCardSession,
    onSuccess: (data) => {
      if (data?.status === 'requires_action' && data?.redirectUrl) {
        toast.success('Redirecting to secure payment…');
        window.location.href = data.redirectUrl;
      } else if (data?.status === 'failed') {
        toast.error(data.message || 'Could not start checkout. Please try again.');
      } else {
        toast.error('Unexpected response from payment processor.');
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to start checkout. Please try again.');
    },
  });

  // WorldCard S2S charge (opt-in via WORLDCARD_FLOW=s2s on the backend).
  // Same response shape as Xoala S2S; reuses the shared redirect/success
  // handling pattern.
  const worldCardMutation = useMutation({
    mutationFn: chargeWorldCardCard,
    onSuccess: (data) => {
      if (data?.status === 'succeeded') {
        toast.success('Payment approved');
        navigate(`/pay/success?reference=${data.reference}`);
      } else if (data?.status === 'requires_action' && data?.redirectUrl) {
        toast.info('Verifying with your bank…');
        submitPaymentRedirect(data);
      } else if (data?.status === 'pending') {
        toast.info('Payment received — confirming with the bank…');
        navigate(`/pay/success?reference=${data.reference}`);
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

  // Card fields are only collected when we're processing the SALE on
  // our domain. For the WorldCard hosted-page flow the card is entered
  // on WorldCard's site, so we skip card validation and hide the card
  // inputs (see JSX below).
  const CARD_FIELDS = ['cardholderName', 'cardNumber', 'expiry', 'cvv'];
  const isHostedWorldCard = provider === 'worldcard' && worldCardFlow === 'hosted';
  // Turkish Lira is display-only for now: the page shows ₺ prices, but no
  // payment provider can settle TRY yet, so the Pay button is disabled until a
  // Turkish provider is wired up. Users must switch to EUR/GBP to check out.
  const isTry = currency === 'TRY';

  const validateAll = () => {
    const next = {};
    let firstError = '';
    let firstErrorField = '';
    const fieldsToCheck = Object.keys(INITIAL_FORM).filter(
      (k) => !isHostedWorldCard || !CARD_FIELDS.includes(k),
    );
    fieldsToCheck.forEach((k) => {
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
    if (isTry) {
      toast.error('Turkish Lira payments are coming soon. Please switch to EUR or GBP to complete your purchase.');
      return;
    }
    const { firstError, firstErrorField } = validateAll();
    if (firstError) {
      toast.error(firstError);
      const el = document.getElementsByName(firstErrorField)[0];
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }

    // Mirrors the server-side check: only VISA/MC route to a terminal.
    // Skipped for hosted WorldCard — the card isn't entered here.
    if (!isHostedWorldCard && brand && brand !== 'VISA' && brand !== 'MC') {
      toast.error('We only accept Visa and Mastercard payments.');
      const el = document.getElementsByName('cardNumber')[0];
      if (el && typeof el.focus === 'function') el.focus();
      return;
    }

    if (!agreedTerms) {
      toast.error('Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }
    if (!confirmedAge) {
      toast.error('You must confirm you are over 18 years old.');
      return;
    }

    const attribution = readBrandAttribution();
    const effectiveBrandSlug = brandSlugFromQuery || attribution?.brandSlug;
    const effectiveLinkSlug = linkSlugFromQuery || attribution?.linkSlug || slug;
    const cardDigits = form.cardNumber.replace(/\D/g, '');
    const [mm, yy] = form.expiry.split('/');

    const baseBody = {
      challengeId: challenge.id,
      slug,
      ...(platformFromQuery ? { platform: platformFromQuery } : {}),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      country: form.country,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim(),
      ...(effectiveBrandSlug ? { brandSlug: effectiveBrandSlug } : {}),
      ...(effectiveLinkSlug ? { linkSlug: effectiveLinkSlug } : {}),
    };

    if (provider === 'worldcard' && worldCardFlow === 'hosted') {
      // Hosted flow: send billing only; the card form is hidden in this
      // mode because card data is captured on WorldCard's own page.
      worldCardSessionMutation.mutate(baseBody);
    } else if (provider === 'worldcard') {
      // S2S flow: include card data.
      worldCardMutation.mutate({
        ...baseBody,
        card: {
          number: cardDigits,
          expiryMonth: mm,
          expiryYear: `20${yy}`,
          cvv: form.cvv,
          holder: form.cardholderName.trim(),
          brand: brand || undefined,
        },
      });
    } else {
      // Xoala S2S — also needs the EUR/GBP display currency. TRY is blocked at
      // the Pay button (and rejected server-side), so currency is only ever
      // EUR or GBP here.
      chargeMutation.mutate({
        ...baseBody,
        currency,
        card: {
          number: cardDigits,
          expiryMonth: mm,
          expiryYear: `20${yy}`,
          cvv: form.cvv,
          holder: form.cardholderName.trim(),
          brand: brand || undefined,
        },
      });
    }
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

  // Hold render while auth status is still being checked. Without a token the
  // status is immediately unauthenticated, which is allowed for guest checkout.
  if (loadingChallenge || authStatus === 'checking' || !providerResolved) {
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

  const submitting = chargeMutation.isPending || worldCardMutation.isPending || worldCardSessionMutation.isPending;
  const displayPrice = customPriceFromQuery ?? challenge.price;

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
                      onChange={handleChange}
                      onBlur={handleBlur}
                      readOnly={isAuthenticated}
                      autoComplete="email"
                      className={`w-full rounded-xl pl-12 ${isAuthenticated ? 'pr-12 cursor-not-allowed opacity-90' : 'pr-4'} py-3 focus:outline-none ${inputClass} ${errClass('email')}`}
                      placeholder="trader@example.com"
                      required
                      aria-readonly={isAuthenticated ? 'true' : 'false'}
                      {...ariaProps('email')}
                    />
                    {isAuthenticated && (
                      <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <FieldError name="email" error={errors.email} />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {isAuthenticated
                      ? 'Locked to your account email. Credentials and receipts go here.'
                      : 'We will create your dashboard account with this email after payment.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Phone *</label>
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
                        required
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass} ${errClass('phone')}`}
                        placeholder="+1 202 555 0100"
                        maxLength={24}
                        {...ariaProps('phone')}
                      />
                    </div>
                    <FieldError name="phone" error={errors.phone} />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      Use international format with + country code (e.g. +1 202 555 0100).
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
                        <option value="">Select country...</option>
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

              {/* ── Card details (S2S flows only — hosted collects them off-site) ── */}
              {!isHostedWorldCard && (
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
              )}

              <div className={`mt-6 rounded-xl p-4 flex items-start gap-3 ${isDark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  {isHostedWorldCard
                    ? 'After you click Pay, you\u2019ll be redirected to our secure payment processor to enter your card details. We never see or store your card number.'
                    : 'Your card is processed securely over TLS. We store only the last 4 digits for receipts — never the full number or CVV. 3-D Secure may be requested by your bank.'}
                </p>
              </div>

              <div className={`mt-6 rounded-xl p-4 flex items-start gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <input
                  id="agreedTerms"
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-amber-500 cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="agreedTerms"
                  className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-slate-700'}`}
                >
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-500 hover:text-amber-600 underline"
                  >
                    Terms &amp; Conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href="/Privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-500 hover:text-amber-600 underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div className={`mt-3 rounded-xl p-4 flex items-start gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <input
                  id="confirmedAge"
                  type="checkbox"
                  checked={confirmedAge}
                  onChange={(e) => setConfirmedAge(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-amber-500 cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="confirmedAge"
                  className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-slate-700'}`}
                >
                  I confirm I am over 18 years old <span className="text-red-500">*</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={submitting || !agreedTerms || !confirmedAge || isTry}
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
                    Pay {formatFee(displayPrice)}
                  </>
                )}
              </Button>
              {isTry && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-amber-500">
                    Turkish Lira payments are coming soon. Choose EUR or GBP to
                    complete your purchase.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrency('EUR')}
                    className="mt-2 text-xs font-semibold text-amber-500 underline hover:text-amber-400"
                  >
                    Switch to EUR and continue
                  </button>
                </div>
              )}
              {submitting && (
                <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  Please don&apos;t close or refresh this window.
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
                  {formatAmount(challenge.accountSize)} Account
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
                  {formatFee(displayPrice)}
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
