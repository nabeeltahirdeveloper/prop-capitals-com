import React from 'react';
import { ArrowRight, Users, DollarSign, Globe, Award, Shield, TrendingUp, Clock, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const stats = [
  { icon: Users, value: '18,500+', label: 'Active Traders', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: DollarSign, value: '$15.2M+', label: 'Total Paid Out', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Globe, value: '120+', label: 'Countries', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Clock, value: '<90 min', label: 'Avg Payout Time', color: 'text-amber-400', bg: 'bg-amber-500/10' }
];

const values = [
  {
    icon: Shield,
    title: 'Transparency',
    description: 'Clear rules, no hidden conditions. What you see is what you get with our straightforward evaluation process.'
  },
  {
    icon: TrendingUp,
    title: 'Trader Success',
    description: 'Your success is our success. We provide the tools, education, and capital to help you reach your trading goals.'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We continuously improve our platform, services, and trading conditions to provide the best experience.'
  },
  {
    icon: Clock,
    title: 'Speed',
    description: 'From fast support responses to lightning-quick payouts, we value your time and act accordingly.'
  }
];

const timeline = [
  { year: '2022', title: 'Founded', description: 'Prop Capitals was founded with a mission to democratize prop trading.' },
  { year: '2023', title: 'Growth', description: 'Reached 5,000 funded traders and $3M in payouts.' },
  { year: '2024', title: 'Expansion', description: 'Expanded to 120+ countries with 15,000+ traders and $10M+ paid.' },
  { year: '2025', title: 'Today', description: 'Industry leader with 18,500+ traders and $15.2M+ in total payouts.' }
];

const team = [
  { name: 'Alex Thompson', role: 'CEO & Founder', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
  { name: 'Sarah Chen', role: 'Head of Trading', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  { name: 'Michael Roberts', role: 'CTO', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { name: 'Emma Wilson', role: 'Head of Support', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }
];

const About = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-12 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">About Us</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Empowering Traders <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Worldwide</span>
            </h1>
            <p className={`text-base lg:text-xl max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Prop Capitals was founded with a simple mission: to give talented traders access to the capital they need to succeed. 
              We believe that financial opportunity shouldn't be limited by your starting capital.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-5 lg:p-6 border text-center hover:border-amber-500/30 transition-all ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl lg:text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Our Mission</span>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Democratizing Access to <span className="text-amber-500">Trading Capital</span>
              </h2>
              <p className={`text-base lg:text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                We believe that your trading ability shouldn't be limited by your bank account. Too many talented traders 
                struggle to grow because they lack sufficient capital. Prop Capitals changes that.
              </p>
              <p className={`text-base lg:text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                By providing funding to skilled traders, we create a win-win situation: traders get the capital they need, 
                and we share in their success. It's a partnership built on trust, transparency, and mutual benefit.
              </p>
              <div className="space-y-3">
                {['Funded accounts up to $200,000', 'Keep up to 90% of your profits', 'No risk to your personal capital'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className={`rounded-3xl p-8 border ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 flex items-center justify-center ${isDark ? 'border-[#12161d]' : 'border-slate-50'}`}>
                        <span className="text-[#0a0d12] font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                      </div>
                    ))}
                  </div>
                  <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>+18,500 traders</span>
                </div>
                <blockquote className={`text-lg lg:text-xl font-medium mb-4 leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  "Our goal is simple: if you can trade, we'll give you the capital to do it at scale."
                </blockquote>
                <p className="text-amber-500 font-semibold">Alex Thompson</p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>CEO & Founder, Prop Capitals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Our Values</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              What We <span className="text-amber-500">Stand For</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-6 border hover:border-amber-500/30 transition-all group ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <value.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Our Journey</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              From Startup to <span className="text-amber-500">Industry Leader</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-amber-500/20 lg:-translate-x-0.5"></div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex items-start gap-6 lg:gap-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Dot */}
                  <div className="absolute left-4 lg:left-1/2 w-4 h-4 bg-amber-400 rounded-full -translate-x-1/2 mt-1.5 z-10 shadow-lg shadow-amber-500/30"></div>
                  
                  {/* Content */}
                  <div className={`ml-12 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12'}`}>
                    <div className={`rounded-2xl p-5 border inline-block ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-amber-500 font-bold text-xl">{item.year}</span>
                      <h3 className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Our Team</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Meet the <span className="text-amber-500">Leadership</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-6 border hover:border-amber-500/30 transition-all text-center group ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative inline-block mb-4">
                  <img 
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/50 group-hover:border-amber-400 transition-colors"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 ${isDark ? 'border-[#12161d]' : 'border-white'}`}></div>
                </div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{member.name}</h3>
                <p className="text-amber-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trustpilot Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 lg:p-12 border text-center ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-[#00b67a] px-3 py-1.5 rounded-lg flex items-center gap-2">
                <svg viewBox="0 0 126 31" className="h-5 w-auto">
                  <path fill="white" d="M15.5 0L19.1 9.8H29.4L21.1 15.9L24.7 25.7L15.5 19.2L6.3 25.7L9.9 15.9L1.6 9.8H11.9L15.5 0Z"/>
                </svg>
                <span className="text-white font-bold text-sm">Trustpilot</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-8 h-8 text-[#00b67a] fill-[#00b67a]" />
              ))}
            </div>
            <p className={`text-3xl lg:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8 out of 5</p>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Based on 2,340+ reviews</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Join Our <span className="text-amber-500">Community</span>?
          </h2>
          <p className={`text-base lg:text-lg mb-8 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Become part of a global community of funded traders. Start your journey with Prop Capitals today.
          </p>
          <Link to="/challenges">
            <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 group">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
