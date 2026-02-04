import React from 'react';
import { Briefcase, Users, Globe, TrendingUp, Heart, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const CareersPage = () => {
  const { isDark } = useTheme();

  const benefits = [
    { icon: Globe, title: "Remote First", description: "Work from anywhere in the world" },
    { icon: TrendingUp, title: "Growth", description: "Fast-track your career progression" },
    { icon: Heart, title: "Health", description: "Comprehensive health coverage" },
    { icon: Zap, title: "Equipment", description: "Latest tools and technology" }
  ];

  const openings = [
    { title: "Senior Full-Stack Developer", department: "Engineering", location: "Remote", type: "Full-time" },
    { title: "Risk Analyst", department: "Trading", location: "Dubai, UAE", type: "Full-time" },
    { title: "Customer Success Manager", department: "Support", location: "Remote", type: "Full-time" },
    { title: "Marketing Manager", department: "Marketing", location: "Remote", type: "Full-time" },
    { title: "Compliance Officer", department: "Legal", location: "Dubai, UAE", type: "Full-time" }
  ];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Careers</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Join the <span className="text-amber-500">Prop Capitals</span> Team
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Help us revolutionize the prop trading industry. We're looking for passionate individuals who want to make a difference.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {[
              { value: "50+", label: "Team Members" },
              { value: "15+", label: "Countries" },
              { value: "100%", label: "Remote Friendly" },
              { value: "4.8", label: "Glassdoor Rating" }
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-6 border text-center ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="text-amber-500 text-3xl font-black mb-1">{stat.value}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Why Work With Us</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          </div>

          {/* Open Positions */}
          <div>
            <h2 className={`text-2xl font-black text-center mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Open Positions</h2>
            <div className="space-y-4">
              {openings.map((job, i) => (
                <div key={i} className={`rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-all ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{job.department}</span>
                      <span className={isDark ? 'text-gray-600' : 'text-slate-300'}>•</span>
                      <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{job.location}</span>
                      <span className={isDark ? 'text-gray-600' : 'text-slate-300'}>•</span>
                      <span className="text-amber-500">{job.type}</span>
                    </div>
                  </div>
                  <Button variant="outline" className={`rounded-full ${
                    isDark 
                      ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' 
                      : 'border-amber-500/50 text-amber-600 hover:bg-amber-50'
                  }`}>
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
