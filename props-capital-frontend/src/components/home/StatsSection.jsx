import React from 'react';
import { TrendingUp, Users, DollarSign, Star, Clock, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { stats } from './data/mockData';

const StatsSection = () => {
  const { isDark } = useTheme();

  const statItems = [
    { icon: Users, label: 'Active Traders', value: stats.tradersCount, color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-100' },
    { icon: DollarSign, label: 'Total Paid Out', value: stats.totalPaid, color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-100' },
    { icon: TrendingUp, label: 'Avg. Payout', value: stats.avgPayout, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-100' },
    { icon: Clock, label: 'Payout Speed', value: stats.payoutTime, color: 'text-purple-500', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-100' },
    { icon: Star, label: 'Trustpilot', value: stats.trustpilotRating, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-100' },
    { icon: Award, label: 'Success Rate', value: stats.successRate, color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-100' }
  ];

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-20">
          {statItems.map((stat, index) => (
            <div 
              key={index}
              className={`rounded-2xl p-5 border text-center transition-all duration-300 ${
                isDark 
                  ? 'bg-[#12161d] border-white/10 hover:border-amber-500/30' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300'
              }`}
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-10"></div>
          
          <div className="relative z-10 p-8 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0a0d12] mb-4">
              Ready to Get Funded?
            </h2>
            <p className="text-[#0a0d12]/80 text-lg max-w-2xl mx-auto mb-8">
              Join thousands of successful traders who trust Prop Capitals. Get funded today and start your journey to financial freedom.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/challenges">
                <Button 
                  className="bg-[#0a0d12] hover:bg-[#12161d] text-white rounded-full px-8 py-6 h-auto text-lg font-bold transition-all hover:scale-105 group"
                >
                  Start Trading NOW
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/challenges">
                <Button 
                  variant="outline"
                  className="bg-transparent border-[#0a0d12]/30 text-[#0a0d12] hover:bg-[#0a0d12]/10 rounded-full px-8 py-6 h-auto text-lg font-semibold"
                >
                  View All Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
