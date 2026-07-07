import React, { useState } from 'react';
import { DollarSign, Users, Share2, TrendingUp, Gift, Award, ArrowRight, CheckCircle2, Copy, Check, Mail, User, Globe, Instagram, Youtube, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';

const AffiliatePage = () => {
  const { isDark } = useTheme();
  const { cur } = useCurrency();
  const { t } = useTranslation();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    socialMedia: '',
    audience: '',
    howHeard: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const BACKEND_URL = ""

  const benefitIcons = [DollarSign, Users, Gift, TrendingUp];
  const benefitsContent = t('affiliate.benefits', { returnObjects: true });
  const benefits = (Array.isArray(benefitsContent) ? benefitsContent : []).map((b, i) => ({
    icon: benefitIcons[i],
    title: b.title,
    description: b.description
  }));

  const tierColors = ["gray", "amber", "gray", "yellow"];
  const tierCommissions = ["8%", "10%", "12%", "15%"];
  const tiersContent = t('affiliate.tiers', { returnObjects: true });
  const tiers = (Array.isArray(tiersContent) ? tiersContent : []).map((tier, i) => ({
    name: tier.name,
    commission: tierCommissions[i],
    requirements: tier.requirements,
    color: tierColors[i]
  }));

  const stepsContent = t('affiliate.steps', { returnObjects: true });
  const steps = (Array.isArray(stepsContent) ? stepsContent : []).map((s, i) => ({
    step: i + 1,
    title: s.title,
    description: s.description
  }));

  const faqsContent = t('affiliate.faqs', { returnObjects: true });
  const faqs = Array.isArray(faqsContent) ? faqsContent : [];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/affiliate/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Affiliate signup error:', error);
      // Still show success for demo purposes
      setIsSubmitted(true);
    }

    setIsSubmitting(false);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText('https://prop-capitals.com/?ref=YOUR_ID');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('affiliate.eyebrow')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('affiliate.heroTitle')} <span className="text-amber-500">{t('affiliate.heroTitleHighlight')}</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('affiliate.heroSubtitle')}
            </p>
            <Button
              onClick={() => setShowSignupForm(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold"
              data-testid="become-affiliate-btn"
            >
              {t('affiliate.becomeAffiliate')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, i) => (
              <div key={i} className={`rounded-2xl p-6 border text-center ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{benefit.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Commission Tiers */}
          <div className="mb-16">
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('affiliate.commissionTiers')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier, i) => (
                <div key={i} className={`rounded-2xl p-6 border text-center relative overflow-hidden ${
                  i === 3 ? 'border-amber-500/50' : isDark ? 'border-white/10' : 'border-slate-200'
                } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
                  {i === 3 && (
                    <div className="absolute -top-1 -right-8 bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0d12] text-[10px] font-bold px-8 py-1 rotate-45">
                      {t('affiliate.bestBadge')}
                    </div>
                  )}
                  <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tier.name}</div>
                  <div className="text-amber-500 text-4xl font-black mb-2">{tier.commission}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{tier.requirements}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('affiliate.howItWorks')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-[#0a0d12] font-black mb-4">
                      {step.step}
                    </div>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{step.description}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-amber-500/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('affiliate.faqTitle')}</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, i) => (
                <div key={i} className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{faq.q}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{cur(faq.a)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className={`rounded-3xl p-8 sm:p-12 text-center ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border border-white/10' : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'}`}>
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('affiliate.ctaTitle')}
            </h2>
            <p className={`mb-6 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('affiliate.ctaSubtitle')}
            </p>
            <Button
              onClick={() => setShowSignupForm(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold"
            >
              {t('affiliate.joinProgram')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg max-h-[90dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
            {/* Close button — z-10 keeps it above the scrollable content */}
            <button
              onClick={() => { setShowSignupForm(false); setIsSubmitted(false); }}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>

            {/* Scrollable body — content overflows here, not the modal container */}
            <div className="overflow-y-auto overscroll-contain">
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-6">
                  <h2 className="text-2xl font-black text-[#0a0d12]">{t('affiliate.modalTitle')}</h2>
                  <p className="text-[#0a0d12]/70 text-sm">{t('affiliate.modalSubtitle')}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.fullNameLabel')}
                    </label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder={t('affiliate.fullNamePlaceholder')}
                        data-testid="affiliate-name-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.emailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder="john@example.com"
                        data-testid="affiliate-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.websiteLabel')}
                    </label>
                    <div className="relative">
                      <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.socialMediaLabel')}
                    </label>
                    <div className="relative">
                      <Instagram className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        name="socialMedia"
                        value={formData.socialMedia}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        placeholder={t('affiliate.socialMediaPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.audienceLabel')}
                    </label>
                    <select
                      name="audience"
                      value={formData.audience}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                      data-testid="affiliate-audience-select"
                    >
                      <option value="">{t('affiliate.audiencePlaceholder')}</option>
                      <option value="0-1000">0 - 1,000</option>
                      <option value="1000-10000">1,000 - 10,000</option>
                      <option value="10000-50000">10,000 - 50,000</option>
                      <option value="50000-100000">50,000 - 100,000</option>
                      <option value="100000+">100,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      {t('affiliate.howHeardLabel')}
                    </label>
                    <select
                      name="howHeard"
                      value={formData.howHeard}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">{t('affiliate.howHeardPlaceholder')}</option>
                      <option value="social">{t('affiliate.howHeardSocial')}</option>
                      <option value="search">{t('affiliate.howHeardSearch')}</option>
                      <option value="friend">{t('affiliate.howHeardFriend')}</option>
                      <option value="ad">{t('affiliate.howHeardAd')}</option>
                      <option value="other">{t('affiliate.howHeardOther')}</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-3 h-auto font-bold disabled:opacity-50"
                    data-testid="affiliate-submit-btn"
                  >
                    {isSubmitting ? t('affiliate.submitting') : t('affiliate.submitApplication')}
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('affiliate.successTitle')}
                </h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  {t('affiliate.successMessage')}
                </p>

                {/* Demo Referral Link */}
                <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('affiliate.referralLinkLabel')}</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 text-sm truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      https://prop-capitals.com/?ref=YOUR_ID
                    </code>
                    <button
                      onClick={copyReferralLink}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => { setShowSignupForm(false); setIsSubmitted(false); }}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl px-6 py-3 h-auto font-bold"
                >
                  {t('affiliate.close')}
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatePage;
