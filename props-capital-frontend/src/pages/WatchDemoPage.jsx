import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, CheckCircle2, TrendingUp, DollarSign, Award, Target, Clock, Shield, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const WatchDemoPage = () => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = percent * duration;
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tradingStats = [
    { label: "Average Payout", value: "$3,850", icon: DollarSign },
    { label: "Payout Speed", value: "<90 min", icon: Clock },
    { label: "Profit Split", value: "Up to 90%", icon: TrendingUp },
    { label: "Funded Traders", value: "18,500+", icon: Users }
  ];

  const videoFeatures = [
    "See how our evaluation process works",
    "Watch real traders pass their challenges",
    "Learn about our payout process",
    "Understand our trading rules",
    "Explore the PT5 trading platform",
    "Get tips from successful funded traders"
  ];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-amber-500 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 block">Platform Demo</span>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 px-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              See Prop Capitals <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">In Action</span>
            </h1>
            <p className={`text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Watch our comprehensive demo video to learn how you can start your funded trading journey with Prop Capitals.
            </p>
          </div>

          {/* Video Player Container */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <div 
              className={`relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border shadow-2xl bg-black ${isDark ? 'border-white/10' : 'border-slate-200'}`}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => isPlaying && setShowControls(false)}
            >
              {/* Video Element */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  poster="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                >
                  {/* Demo video - using a sample trading video */}
                  <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play Button Overlay (when paused) */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer z-20"
                    onClick={handlePlayPause}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-amber-500/30">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 text-[#0a0d12] fill-current ml-1" />
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                      <span className="text-white text-sm sm:text-base font-medium bg-black/50 px-4 py-2 rounded-full">
                        Click to play demo
                      </span>
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-30`}>
                  {/* Progress Bar */}
                  <div className="mb-2 sm:mb-3">
                    <div 
                      className="h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all relative"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <button 
                        onClick={handlePlayPause} 
                        className="text-white hover:text-amber-400 transition-colors p-1"
                      >
                        {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />}
                      </button>
                      <button 
                        onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                        className="text-white hover:text-amber-400 transition-colors hidden sm:block"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                        className="text-white hover:text-amber-400 transition-colors hidden sm:block"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleMute}
                        className="text-white hover:text-amber-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <span className="text-white text-xs sm:text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs sm:text-sm font-medium hidden sm:block">Prop Capitals Demo</span>
                      <button 
                        onClick={handleFullscreen}
                        className="text-white hover:text-amber-400 transition-colors"
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className={`py-12 sm:py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="text-amber-500 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4 block">In This Video</span>
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Everything You Need to <span className="text-amber-500">Get Started</span>
              </h2>
              <p className={`text-sm sm:text-base mb-6 sm:mb-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Our comprehensive demo walks you through the entire process from signup to your first payout.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                {videoFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className={`text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {tradingStats.map((stat, index) => (
                <div key={index} className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border text-center ${
                  isDark 
                    ? 'bg-[#12161d] border-white/10' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                  </div>
                  <div className={`text-lg sm:text-xl lg:text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                  <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-12 sm:py-16 lg:py-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-black mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Start Your <span className="text-amber-500">Funded Journey</span>?
          </h2>
          <p className={`text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto px-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Join thousands of traders who have already transformed their trading careers with Prop Capitals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/challenges">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 sm:px-10 py-5 sm:py-6 h-auto text-base sm:text-lg font-bold shadow-xl shadow-amber-500/25 group">
                Start Challenge Now
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/faqs">
              <Button variant="outline" className={`w-full sm:w-auto rounded-full px-6 sm:px-10 py-5 sm:py-6 h-auto text-base sm:text-lg font-medium ${
                isDark 
                  ? 'border-white/20 text-white hover:bg-white/5' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}>
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WatchDemoPage;
