import React from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ContactPage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Contact Us</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Get in <span className="text-amber-500">Touch</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Have questions? Our support team is here to help you 24/7. Reach out through any of our channels.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Us</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>For general inquiries and support</p>
                    <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:text-amber-400 font-medium">
                      support@prop-capitals.com
                    </a>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Chat</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Average response time under 60 seconds</p>
                    <span className="text-emerald-400 font-medium">Available 24/7</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Business Hours</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Support available around the clock</p>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>24 hours / 7 days a week</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Headquarters</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Prop Capitals Ltd.<br />
                      International Business Center<br />
                      Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={`rounded-2xl p-6 lg:p-8 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Send us a Message</h2>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>First Name</label>
                    <input 
                      type="text" 
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                        isDark 
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Last Name</label>
                    <input 
                      type="text" 
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                        isDark 
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Email</label>
                  <input 
                    type="email" 
                    className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                      isDark 
                        ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Subject</label>
                  <select className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                    isDark 
                      ? 'bg-[#0a0d12] border border-white/10 text-white' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}>
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Message</label>
                  <textarea 
                    rows={4}
                    className={`w-full rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-amber-500/50 ${
                      isDark 
                        ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold">
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
