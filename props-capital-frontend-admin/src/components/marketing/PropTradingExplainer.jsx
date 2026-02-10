import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Shield,
  Award,
  Wallet,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const scenes = [
  {
    id: 'intro',
    duration: 4000,
    title: 'What is Prop Trading?',
    subtitle: 'Trade with our capital, keep the profits'
  },
  {
    id: 'problem',
    duration: 5000,
    title: 'The Challenge',
    subtitle: 'Most traders lack sufficient capital to generate meaningful returns'
  },
  {
    id: 'solution',
    duration: 5000,
    title: 'Our Solution',
    subtitle: 'We provide the capital, you provide the skill'
  },
  {
    id: 'step1',
    duration: 5000,
    title: 'Step 1: Choose Your Challenge',
    subtitle: 'Select an account size from $10K to $200K'
  },
  {
    id: 'step2',
    duration: 5000,
    title: 'Step 2: Prove Your Skills',
    subtitle: 'Reach the profit target while managing risk'
  },
  {
    id: 'step3',
    duration: 5000,
    title: 'Step 3: Get Funded',
    subtitle: 'Pass the evaluation and receive real capital'
  },
  {
    id: 'profits',
    duration: 5000,
    title: 'Keep Up to 90% Profits',
    subtitle: 'Your skills, our capital, shared success'
  },
  {
    id: 'scale',
    duration: 5000,
    title: 'Scale to $2 Million',
    subtitle: 'Grow your account through consistent performance'
  },
  {
    id: 'cta',
    duration: 4000,
    title: 'Start Your Journey Today',
    subtitle: 'Join thousands of funded traders worldwide'
  }
];

export default function PropTradingExplainer() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const scene = scenes[currentScene];
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / scene.duration) * 100, 100);
      setProgress(newProgress);
    }, 50);

    const timeout = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
      }
    }, scene.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [currentScene, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentScene(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const scene = scenes[currentScene];

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.8)_100%)]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
      </div>

      {/* Scene Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Intro Scene */}
          {scene.id === 'intro' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8"
              >
                <TrendingUp className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-white mb-4"
              >
                {scene.title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-slate-400"
              >
                {scene.subtitle}
              </motion.p>
            </div>
          )}

          {/* Problem Scene */}
          {scene.id === 'problem' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex justify-center gap-4 mb-8"
              >
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30"
                  >
                    <DollarSign className="w-8 h-8 text-red-400 opacity-50" />
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="relative"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400 max-w-xl mx-auto">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Solution Scene */}
          {scene.id === 'solution' && (
            <div className="text-center px-8">
              <motion.div className="flex justify-center items-center gap-6 mb-8">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                    <Users className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400">Your Skills</p>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Zap className="w-8 h-8 text-amber-400" />
                </motion.div>
                
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-500/30">
                    <DollarSign className="w-10 h-10 text-cyan-400" />
                  </div>
                  <p className="text-sm text-slate-400">Our Capital</p>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <ArrowRight className="w-8 h-8 text-slate-500" />
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7, type: 'spring' }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm text-emerald-400 font-medium">Success</p>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Step 1 Scene */}
          {scene.id === 'step1' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full mb-6"
              >
                <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                <span className="text-emerald-400 font-medium">First Step</span>
              </motion.div>
              
              <motion.div className="flex justify-center gap-3 mb-8">
                {['$10K', '$50K', '$100K', '$200K'].map((size, i) => (
                  <motion.div
                    key={size}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className={`px-4 py-3 rounded-xl border ${i === 2 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                  >
                    <p className="text-lg font-bold">{size}</p>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Step 2 Scene */}
          {scene.id === 'step2' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-full mb-6"
              >
                <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                <span className="text-cyan-400 font-medium">Evaluation</span>
              </motion.div>
              
              <motion.div className="flex justify-center items-end gap-2 mb-8 h-32">
                {[30, 50, 45, 70, 65, 85, 80, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                    className={`w-6 rounded-t-md ${i === 7 ? 'bg-gradient-to-t from-emerald-500 to-cyan-500' : 'bg-slate-700'}`}
                  />
                ))}
              </motion.div>
              
              <motion.div className="flex justify-center gap-6 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center gap-2"
                >
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">8% Target</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-300">5% Max DD</span>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Step 3 Scene */}
          {scene.id === 'step3' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full mb-6"
              >
                <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                <span className="text-amber-400 font-medium">Get Funded</span>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="relative mb-8"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute -top-2 -right-2 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center"
                >
                  <Award className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Profits Scene */}
          {scene.id === 'profits' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-48 h-48 mx-auto mb-8"
              >
                {/* Pie Chart Animation */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="20"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="20"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 * 0.1 }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center"
                  >
                    <p className="text-4xl font-bold text-white">90%</p>
                    <p className="text-sm text-slate-400">Your Share</p>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* Scale Scene */}
          {scene.id === 'scale' && (
            <div className="text-center px-8">
              <motion.div className="flex justify-center items-end gap-4 mb-8">
                {[
                  { size: '$100K', height: '40%' },
                  { size: '$200K', height: '55%' },
                  { size: '$400K', height: '70%' },
                  { size: '$1M', height: '85%' },
                  { size: '$2M', height: '100%' }
                ].map((level, i) => (
                  <motion.div
                    key={level.size}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: level.height, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.2, duration: 0.5 }}
                    className="w-16 bg-gradient-to-t from-emerald-500/50 to-cyan-500 rounded-t-lg flex flex-col items-center justify-end pb-2"
                    style={{ maxHeight: '120px' }}
                  >
                    <span className="text-xs text-white font-bold">{level.size}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{scene.title}</h2>
                <p className="text-lg text-slate-400">{scene.subtitle}</p>
              </motion.div>
            </div>
          )}

          {/* CTA Scene */}
          {scene.id === 'cta' && (
            <div className="text-center px-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 1 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8"
              >
                <TrendingUp className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                {scene.title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-slate-400 mb-6"
              >
                {scene.subtitle}
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center gap-8 text-slate-400"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">15,000+</p>
                  <p className="text-sm">Funded Traders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">$50M+</p>
                  <p className="text-sm">Capital Deployed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">$8M+</p>
                  <p className="text-sm">Paid Out</p>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          style={{ width: `${((currentScene / (scenes.length - 1)) * 100) + (progress / scenes.length)}%` }}
        />
      </div>

      {/* Scene Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentScene(i);
              setProgress(0);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentScene ? 'w-6 bg-emerald-500' : i < currentScene ? 'bg-emerald-500/50' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRestart}
          className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={handlePlayPause}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>

      {/* Play Button Overlay (when not started) */}
      {!isPlaying && currentScene === 0 && progress === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/50 cursor-pointer"
          onClick={handlePlayPause}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}