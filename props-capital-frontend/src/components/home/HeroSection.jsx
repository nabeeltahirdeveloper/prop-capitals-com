import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowRight, Star, Play, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import Globe from 'react-globe.gl';

const HeroSection = () => {
  const { isDark } = useTheme();
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(false);

  const stats = [
    { icon: Users, value: '18,500+', label: 'Active Traders' },
    { icon: DollarSign, value: '$15.2M+', label: 'Total Paid Out' },
    { icon: Clock, value: '<90 min', label: 'Avg Payout' },
  ];

  // Trading hub locations with live trader counts per country (25 countries)
  const tradingHubs = useMemo(() => [
    // AMERICAS (5)
    { lat: 40.7128, lng: -74.006, name: 'USA', traders: 4850, size: 1.4 },
    { lat: 43.6532, lng: -79.3832, name: 'Canada', traders: 1250, size: 1.0 },
    { lat: 19.4326, lng: -99.1332, name: 'Mexico', traders: 680, size: 0.8 },
    { lat: -23.5505, lng: -46.6333, name: 'Brazil', traders: 920, size: 0.9 },
    { lat: -34.6037, lng: -58.3816, name: 'Argentina', traders: 420, size: 0.7 },
    
    // EUROPE (6)
    { lat: 51.5074, lng: -0.1278, name: 'UK', traders: 3200, size: 1.3 },
    { lat: 48.8566, lng: 2.3522, name: 'France', traders: 1450, size: 1.05 },
    { lat: 52.52, lng: 13.405, name: 'Germany', traders: 1680, size: 1.1 },
    { lat: 40.4168, lng: -3.7038, name: 'Spain', traders: 650, size: 0.75 },
    { lat: 52.3676, lng: 4.9041, name: 'Netherlands', traders: 580, size: 0.75 },
    { lat: 52.2297, lng: 21.0122, name: 'Poland', traders: 890, size: 0.85 },
    
    // MIDDLE EAST (2)
    { lat: 25.2048, lng: 55.2708, name: 'UAE', traders: 1850, size: 1.1 },
    { lat: 24.7136, lng: 46.6753, name: 'Saudi Arabia', traders: 720, size: 0.8 },
    
    // SOUTH ASIA (2)
    { lat: 28.6139, lng: 77.209, name: 'India', traders: 2100, size: 1.15 },
    { lat: 24.8607, lng: 67.0011, name: 'Pakistan', traders: 980, size: 0.9 },
    
    // EAST ASIA (3)
    { lat: 35.6762, lng: 139.6503, name: 'Japan', traders: 1580, size: 1.1 },
    { lat: 37.5665, lng: 126.978, name: 'South Korea', traders: 890, size: 0.85 },
    { lat: 39.9042, lng: 116.4074, name: 'China', traders: 1850, size: 1.1 },
    
    // SOUTHEAST ASIA (2)
    { lat: 1.3521, lng: 103.8198, name: 'Singapore', traders: 980, size: 0.9 },
    { lat: -6.2088, lng: 106.8456, name: 'Indonesia', traders: 680, size: 0.78 },
    
    // OCEANIA (2)
    { lat: -33.8688, lng: 151.2093, name: 'Australia', traders: 1350, size: 1.0 },
    { lat: -36.8485, lng: 174.7633, name: 'New Zealand', traders: 380, size: 0.65 },
    
    // AFRICA (3)
    { lat: 30.0444, lng: 31.2357, name: 'Egypt', traders: 720, size: 0.8 },
    { lat: -26.2041, lng: 28.0473, name: 'South Africa', traders: 920, size: 0.88 },
    { lat: 6.5244, lng: 3.3792, name: 'Nigeria', traders: 780, size: 0.82 },
  ], []);

  // Arc data for connections between major trading hubs
  const arcsData = useMemo(() => {
    const arcs = [];
    // Get top 12 hubs by trader count for arc connections
    const majorHubs = [...tradingHubs].sort((a, b) => b.traders - a.traders).slice(0, 12);
    
    for (let i = 0; i < majorHubs.length; i++) {
      for (let j = i + 1; j < majorHubs.length; j++) {
        if (Math.random() > 0.4) {
          arcs.push({
            startLat: majorHubs[i].lat,
            startLng: majorHubs[i].lng,
            endLat: majorHubs[j].lat,
            endLng: majorHubs[j].lng,
            color: ['rgba(251, 191, 36, 0.6)', 'rgba(251, 191, 36, 0.2)'],
          });
        }
      }
    }
    return arcs;
  }, [tradingHubs]);

  // Ring data for animated pulse effect - top 15 hubs by trader count
  const ringsData = useMemo(() => {
    return [...tradingHubs].sort((a, b) => b.traders - a.traders).slice(0, 15).map(hub => ({
      lat: hub.lat,
      lng: hub.lng,
      maxR: hub.size * 4,
      propagationSpeed: 2 + Math.random(),
      repeatPeriod: 1500 + Math.random() * 1000,
    }));
  }, [tradingHubs]);

  // Initialize globe settings
  useEffect(() => {
    if (globeRef.current && globeReady) {
      // Set initial position
      globeRef.current.pointOfView({ lat: 30, lng: 0, altitude: 2.2 }, 0);
      
      // Auto-rotate
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
      }
    }
  }, [globeReady]);

  // Globe texture URLs
  const globeImageUrl = isDark 
    ? '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
    : '//unpkg.com/three-globe/example/img/earth-day.jpg';
  
  const bumpImageUrl = '//unpkg.com/three-globe/example/img/earth-topology.png';

  return (
    <section className={`relative min-h-screen pt-20 overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-b from-[#0a0d12] via-[#0d1117] to-[#0a0d12]' 
        : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
    }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? 'bg-amber-500/10' : 'bg-amber-400/15'}`} />
        <div className={`absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px] ${isDark ? 'bg-blue-500/10' : 'bg-blue-400/10'}`} />
        {/* Additional glow for globe */}
        <div className={`absolute top-1/2 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] transform -translate-y-1/2 ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'}`} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 lg:py-16">
        {/* Trustpilot Badge */}
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8 on Trustpilot</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>(18,500+ traders)</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
            }`}>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Limited Time: 70% OFF All Challenges
              </span>
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trade Globally,{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Earn Anywhere
              </span>
            </h1>

            <p className={`text-base lg:text-lg mb-8 max-w-xl mx-auto lg:mx-0 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Join 18,500+ traders worldwide who are already trading with Prop Capitals funding. 
              Get funded up to $200K and keep up to 90% of your profits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link to="/challenges">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all group">
                  Get Funded Now
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/watch-demo">
                <Button 
                  variant="outline"
                  className={`w-full sm:w-auto rounded-full px-8 py-6 h-auto text-lg font-medium ${
                    isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Play className="mr-2 w-5 h-5" /> Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                    <div className={`text-xs lg:text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - 3D Globe */}
          <div className="relative flex items-center justify-center order-1 lg:order-2">
            <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[520px] lg:h-[520px]">
              {/* Globe Container with glow effect */}
              <div className={`absolute inset-0 rounded-full ${isDark ? 'shadow-[0_0_100px_30px_rgba(59,130,246,0.15)]' : 'shadow-[0_0_80px_20px_rgba(59,130,246,0.1)]'}`} />
              
              <Globe
                ref={globeRef}
                onGlobeReady={() => setGlobeReady(true)}
                width={typeof window !== 'undefined' && window.innerWidth < 640 ? 320 : window.innerWidth < 1024 ? 400 : 520}
                height={typeof window !== 'undefined' && window.innerWidth < 640 ? 320 : window.innerWidth < 1024 ? 400 : 520}
                globeImageUrl={globeImageUrl}
                bumpImageUrl={bumpImageUrl}
                backgroundImageUrl={null}
                backgroundColor="rgba(0,0,0,0)"
                atmosphereColor={isDark ? '#60a5fa' : '#3b82f6'}
                atmosphereAltitude={0.2}
                
                // Points for trading hubs
                pointsData={tradingHubs}
                pointLat="lat"
                pointLng="lng"
                pointColor={() => '#fbbf24'}
                pointAltitude={0.01}
                pointRadius={d => d.size * 0.4}
                pointsMerge={true}
                
                // Arcs for connections
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.5}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
                arcAltitudeAutoScale={0.4}
                
                // Rings for pulse effect
                ringsData={ringsData}
                ringColor={() => isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(251, 191, 36, 0.6)'}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                
                // HTML markers for labels - show ALL countries
                htmlElementsData={tradingHubs}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={0.05}
                htmlElement={d => {
                  const el = document.createElement('div');
                  el.innerHTML = `
                    <div style="
                      background: ${isDark ? 'rgba(18, 22, 29, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
                      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                      border-radius: 8px;
                      padding: 6px 10px;
                      font-size: 10px;
                      color: ${isDark ? '#fff' : '#1e293b'};
                      backdrop-filter: blur(8px);
                      white-space: nowrap;
                      pointer-events: none;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    ">
                      <div style="font-weight: 700; margin-bottom: 2px;">${d.name}</div>
                      <div style="color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
                        ${d.traders.toLocaleString()} traders
                      </div>
                    </div>
                  `;
                  return el;
                }}
              />
              
              {/* Floating Cards */}
              <div className={`absolute -left-2 sm:-left-6 top-[20%] p-3 rounded-xl shadow-2xl backdrop-blur-md border z-10 ${
                isDark ? 'bg-[#12161d]/90 border-white/10' : 'bg-white/90 border-slate-200/50'
              }`} style={{ animation: 'float 4s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>120+</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Countries</div>
                  </div>
                </div>
              </div>

              <div className={`absolute -right-2 sm:-right-6 top-[55%] p-3 rounded-xl shadow-2xl backdrop-blur-md border z-10 ${
                isDark ? 'bg-[#12161d]/90 border-white/10' : 'bg-white/90 border-slate-200/50'
              }`} style={{ animation: 'float 4s ease-in-out infinite', animationDelay: '2s' }}>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$200K</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Max Funding</div>
                  </div>
                </div>
              </div>

              <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border z-10 ${
                isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Live Trading Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
