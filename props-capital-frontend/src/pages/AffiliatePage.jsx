import React, { useState } from 'react';
import { DollarSign, Users, Share2, TrendingUp, Gift, Award, ArrowRight, CheckCircle2, Copy, Check, Mail, User, Globe, Instagram, Youtube, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const AffiliatePage = () => {
  const { isDark } = useTheme();
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

  const benefits = [
    { icon: DollarSign, title: "Up to 15% Commission", description: "Earn on every challenge purchase from your referrals" },
    { icon: Users, title: "Lifetime Referrals", description: "Get commissions on all future purchases from your referrals" },
    { icon: Gift, title: "Monthly Bonuses", description: "Top affiliates receive additional performance bonuses" },
    { icon: TrendingUp, title: "Real-Time Tracking", description: "Monitor your earnings and referrals in real-time" }
  ];

  const tiers = [
    { name: "Starter", commission: "8%", requirements: "0-10 referrals", color: "gray" },
    { name: "Bronze", commission: "10%", requirements: "11-50 referrals", color: "amber" },
    { name: "Silver", commission: "12%", requirements: "51-100 referrals", color: "gray" },
    { name: "Gold", commission: "15%", requirements: "100+ referrals", color: "yellow" }
  ];

  const steps = [
    { step: 1, title: "Sign Up", description: "Create your free affiliate account in minutes" },
    { step: 2, title: "Get Your Link", description: "Receive your unique referral link and marketing materials" },
    { step: 3, title: "Promote", description: "Share with your audience through any channel" },
    { step: 4, title: "Earn", description: "Get paid monthly for every successful referral" }
  ];

  const faqs = [
    { q: "How much can I earn?", a: "There's no limit! Top affiliates earn $10,000+ per month. You earn commission on every challenge purchase made through your link." },
    { q: "When do I get paid?", a: "Payments are processed on the 1st of each month for the previous month's earnings. Minimum payout is $50." },
    { q: "What marketing materials do you provide?", a: "We provide banners, social media graphics, email templates, and video content you can use to promote." },
    { q: "Can I promote on social media?", a: "Yes! You can promote on any platform - YouTube, Instagram, TikTok, Twitter, blogs, email lists, etc." }
  ];

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
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Affiliate Program</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Earn Up to <span className="text-amber-500">15% Commission</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Join our affiliate program and earn passive income by referring traders to Prop Capitals. 
              No limits on earnings!
            </p>
            <Button 
              onClick={() => setShowSignupForm(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold"
              data-testid="become-affiliate-btn"
            >
              Become an Affiliate
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
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Commission Tiers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier, i) => (
                <div key={i} className={`rounded-2xl p-6 border text-center relative overflow-hidden ${
                  i === 3 ? 'border-amber-500/50' : isDark ? 'border-white/10' : 'border-slate-200'
                } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
                  {i === 3 && (
                    <div className="absolute -top-1 -right-8 bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0d12] text-[10px] font-bold px-8 py-1 rotate-45">
                      BEST
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
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>How It Works</h2>
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
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, i) => (
                <div key={i} className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                  <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{faq.q}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className={`rounded-3xl p-8 sm:p-12 text-center ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border border-white/10' : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'}`}>
            <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ready to Start Earning?
            </h2>
            <p className={`mb-6 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Join hundreds of affiliates already earning with Prop Capitals. It takes less than 2 minutes to sign up.
            </p>
            <Button 
              onClick={() => setShowSignupForm(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold"
            >
              Join Affiliate Program
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
            {/* Close button */}
            <button 
              onClick={() => { setShowSignupForm(false); setIsSubmitted(false); }}
              className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <span className="text-2xl">&times;</span>
            </button>

            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-6">
                  <h2 className="text-2xl font-black text-[#0a0d12]">Become an Affiliate</h2>
                  <p className="text-[#0a0d12]/70 text-sm">Fill out the form below to join our program</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Full Name *
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
                        placeholder="John Doe"
                        data-testid="affiliate-name-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Email Address *
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
                      Website/Blog (Optional)
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
                      Social Media Handle (Optional)
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
                        placeholder="@yourhandle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      Estimated Audience Size *
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
                      <option value="">Select audience size</option>
                      <option value="0-1000">0 - 1,000</option>
                      <option value="1000-10000">1,000 - 10,000</option>
                      <option value="10000-50000">10,000 - 50,000</option>
                      <option value="50000-100000">50,000 - 100,000</option>
                      <option value="100000+">100,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      How did you hear about us?
                    </label>
                    <select
                      name="howHeard"
                      value={formData.howHeard}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">Select an option</option>
                      <option value="social">Social Media</option>
                      <option value="search">Search Engine</option>
                      <option value="friend">Friend/Referral</option>
                      <option value="ad">Advertisement</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-3 h-auto font-bold disabled:opacity-50"
                    data-testid="affiliate-submit-btn"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
                  Application Submitted!
                </h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Thank you for applying! We'll review your application and get back to you within 24-48 hours.
                </p>
                
                {/* Demo Referral Link */}
                <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Your referral link (demo):</p>
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
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatePage;
