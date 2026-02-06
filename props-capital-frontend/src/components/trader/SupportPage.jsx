import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Send,
  FileText,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

const SupportPage = () => {
  const { isDark } = useTraderTheme();
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTicketForm({ subject: '', category: 'general', message: '' });
    }, 3000);
  };

  const supportCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'trading', label: 'Trading Issue' },
    { value: 'payout', label: 'Payout Request' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Question' },
  ];

  const recentTickets = [
    { id: 'TKT-001', subject: 'Payout Processing Time', status: 'resolved', date: '2025-02-10' },
    { id: 'TKT-002', subject: 'MT5 Connection Issue', status: 'open', date: '2025-02-12' },
  ];

  return (
    <div className="space-y-6" data-testid="support-page">
      {/* Header */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Support Center</h1>
        </div>
        <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Need help? Our support team is available 24/7 to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Methods */}
        <div className="lg:col-span-1 space-y-4">
          {/* Live Chat */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Chat</h3>
                <span className="text-xs text-emerald-500 font-medium">Online</span>
              </div>
            </div>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Get instant help from our AI assistant or connect with a live agent.
            </p>
            <button className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all">
              Start Chat
            </button>
          </div>

          {/* Email Support */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Support</h3>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Response within 24h</span>
              </div>
            </div>
            <a
              href="mailto:support@prop-capitals.com"
              className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} flex items-center gap-1`}
            >
              support@prop-capitals.com
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Business Hours */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Business Hours</h3>
            </div>
            <div className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>24 Hours</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday - Sunday</span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>24 Hours</span>
              </div>
              <p className="text-xs pt-2 text-emerald-500">
                ✓ Support available in your timezone
              </p>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <FileText className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Submit a Support Ticket</h2>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ticket Submitted!</h3>
              <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                We will respond to your inquiry within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Category
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                >
                  {supportCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Subject
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Message
                </label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Ticket
              </button>
            </form>
          )}

          {/* Recent Tickets */}
          {recentTickets.length > 0 && !submitted && (
            <div className="mt-8">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Recent Tickets</h3>
              <div className="space-y-2">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{ticket.id}</span>
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{ticket.date}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ticket.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
