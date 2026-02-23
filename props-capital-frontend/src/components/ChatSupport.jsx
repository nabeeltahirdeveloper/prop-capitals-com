import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Loader2, UserCheck } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatSupportStore } from '@/lib/stores/chat-support.store';

const ChatSupport = () => {
  const { isDark } = useTheme();
  const isOpen = useChatSupportStore((state) => state.isOpen);
  const isMinimized = useChatSupportStore((state) => state.isMinimized);
  const openChat = useChatSupportStore((state) => state.openChat);
  const closeChat = useChatSupportStore((state) => state.closeChat);
  const toggleMinimized = useChatSupportStore((state) => state.toggleMinimized);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm the Prop Capitals AI assistant. How can I help you today? Ask me about challenges, trading rules, payouts, or anything else!",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [humanFormData, setHumanFormData] = useState({ name: '', email: '', message: '' });
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen && !isMinimized && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: 'user',
      text: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: currentMessage
        })
      });

      const data = await response.json();

      setIsTyping(false);

      if (data.transfer_to_human) {
        setShowHumanForm(true);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: data.response,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: data.response,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I'm having trouble connecting right now. Please try again or contact support@prop-capitals.com directly.",
        timestamp: new Date()
      }]);
    }
  };

  const handleQuickReply = (reply) => {
    setMessage(reply);
    setTimeout(() => handleSend(), 100);
  };

  const handleHumanFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${BACKEND_URL}/chat/human-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...humanFormData
        })
      });

      const data = await response.json();

      setShowHumanForm(false);
      setHumanFormData({ name: '', email: '', message: '' });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: data.success
          ? `Thanks ${humanFormData.name}! Your request has been submitted. Our team will contact you at ${humanFormData.email} shortly.`
          : "There was an issue submitting your request. Please email us directly at support@prop-capitals.com.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Human support request error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Failed to submit your request. Please email us directly at support@prop-capitals.com.",
        timestamp: new Date()
      }]);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-4 right-4 sm:right-6 w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-110 z-[9999]"
          data-testid="chat-toggle-button"
        >
          <MessageCircle className="w-7 h-7 text-[#0a0d12]" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">1</span>
        </button>
      )}

      {/* Chat Window - Fully Responsive */}
      {isOpen && (
        <div
          className={`fixed z-[9999] shadow-2xl overflow-hidden transition-all duration-300 flex flex-col
            ${isMinimized
              ? 'bottom-28 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] h-[56px] rounded-2xl'
              : 'inset-4 sm:inset-auto sm:bottom-28 sm:right-6 sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-140px)] rounded-2xl'
            }
            ${isDark ? 'bg-[#0d1117] border border-white/10' : 'bg-white border border-slate-200'}
          `}
          style={{
            maxWidth: isMinimized ? undefined : 'calc(100vw - 2rem)',
          }}
          data-testid="chat-support-window"
        >
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between border-b flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-[#12161d] to-[#0d1117] border-white/10' : 'bg-gradient-to-r from-slate-50 to-white border-slate-200'
            }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#0a0d12]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Prop Capitals AI</h3>
                <p className="text-emerald-500 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMinimized}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                data-testid="chat-minimize-button"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={closeChat}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
                data-testid="chat-close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area - Scrollable */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'
                }`}>
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.type === 'bot' && (
                        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3.5 h-3.5 text-[#0a0d12]" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${msg.type === 'user'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-[#0a0d12] rounded-br-md'
                            : isDark
                              ? 'bg-[#12161d] text-gray-200 border border-white/10 rounded-bl-md'
                              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                            }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.text}</p>
                        </div>
                        <span className={`text-[10px] mt-1 block ${msg.type === 'user' ? 'text-right' : ''} ${isDark ? 'text-gray-600' : 'text-slate-400'
                          }`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      {msg.type === 'user' && (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'
                          }`}>
                          <User className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Human Support Form */}
                {showHumanForm && (
                  <div className={`rounded-xl p-3 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-amber-500" />
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Human Support</span>
                    </div>
                    <form onSubmit={handleHumanFormSubmit} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={humanFormData.name}
                        onChange={(e) => setHumanFormData({ ...humanFormData, name: e.target.value })}
                        required
                        className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                      />
                      <input
                        type="email"
                        placeholder="Your Email"
                        value={humanFormData.email}
                        onChange={(e) => setHumanFormData({ ...humanFormData, email: e.target.value })}
                        required
                        className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                      />
                      <textarea
                        placeholder="Describe your issue..."
                        value={humanFormData.message}
                        onChange={(e) => setHumanFormData({ ...humanFormData, message: e.target.value })}
                        required
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowHumanForm(false)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] rounded-lg text-xs font-bold hover:from-amber-500 hover:to-amber-600"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-[#0a0d12]" />
                      </div>
                      <div className={`px-3 py-2 rounded-2xl rounded-bl-md ${isDark ? 'bg-[#12161d] border border-white/10' : 'bg-white border border-slate-200 shadow-sm'
                        }`}>
                        <div className="flex items-center gap-2">
                          <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Static Action Bar - Always visible */}
              {!showHumanForm && (
                <div className={`px-3 py-2 border-t flex-shrink-0 ${isDark ? 'bg-[#0d1117] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Quick reply suggestions - show only early in conversation */}
                    {messages.length < 4 && (
                      <>
                        <button
                          onClick={() => handleQuickReply("What challenges do you offer?")}
                          className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                        >
                          Challenges
                        </button>
                        <button
                          onClick={() => handleQuickReply("How do payouts work?")}
                          className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                        >
                          Payouts
                        </button>
                        <button
                          onClick={() => handleQuickReply("Trading rules?")}
                          className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                        >
                          Rules
                        </button>
                      </>
                    )}
                    {/* Human Support button - ALWAYS visible */}
                    <button
                      onClick={() => setShowHumanForm(true)}
                      className={`text-xs px-2.5 py-1.5 rounded-full transition-colors border flex items-center gap-1.5 ml-auto ${isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      data-testid="human-support-button"
                    >
                      <UserCheck className="w-3 h-3" />
                      Human Support
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type your message..."
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark
                      ? 'bg-[#12161d] border border-white/10 text-white placeholder-gray-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    data-testid="chat-input"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isTyping}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${message.trim() && !isTyping
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12]'
                      : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-100 text-slate-400'
                      }`}
                    data-testid="chat-send-button"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {/* Safe area padding for mobile */}
                <div className="h-safe sm:hidden" />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatSupport;
