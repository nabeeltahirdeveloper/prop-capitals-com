import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  CheckCircle,
  Circle,
  Lock,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  DollarSign
} from 'lucide-react';

export default function PhaseProgressTimeline({ 
  currentPhase = 'phase1', 
  phase1Passed = false,
  phase2Passed = false,
  challengeRules = {},
  metrics = {},
  phaseTransitions = [],
  onProceedToNextPhase 
}) {
  const { t } = useTranslation();
  
  // Get values from challengeRules or use defaults
  const phase1Target = challengeRules.phase1TargetPercent || 10;
  const phase2Target = challengeRules.phase2TargetPercent || 5;
  const minTradingDays = challengeRules.minTradingDays || 5;
  const maxDailyDD = challengeRules.dailyDrawdownPercent || 5;
  const maxOverallDD = challengeRules.overallDrawdownPercent || 10;
  
  // Get current metrics
  const profitPercent = metrics.profitPercent || 0;
  const tradingDaysCompleted = metrics.tradingDaysCompleted || 0;
  const dailyDrawdownPercent = metrics.dailyDrawdownPercent || 0;
  const overallDrawdownPercent = metrics.overallDrawdownPercent || 0;
  
  const phases = [
    {
      id: 'phase1',
      name: t('phaseTimeline.phase1'),
      subtitle: t('phaseTimeline.evaluation'),
      icon: Target,
      profitTarget: `${phase1Target}%`,
      requirements: [
        t('phaseTimeline.profitTarget', { target: `${phase1Target}%` }),
        t('phaseTimeline.minTradingDays', { days: minTradingDays }),
        t('phaseTimeline.maxDailyDD', { dd: `${maxDailyDD}%` })
      ],
    },
    {
      id: 'phase2',
      name: t('phaseTimeline.phase2'),
      subtitle: t('phaseTimeline.verification'),
      icon: CheckCircle,
      profitTarget: `${phase2Target}%`,
      requirements: [
        t('phaseTimeline.profitTarget', { target: `${phase2Target}%` }),
        t('phaseTimeline.minTradingDays', { days: minTradingDays }),
        t('phaseTimeline.maxDailyDD', { dd: `${maxDailyDD}%` })
      ],
    },
    {
      id: 'funded',
      name: t('phaseTimeline.funded'),
      subtitle: t('phaseTimeline.liveAccount'),
      icon: DollarSign,
      profitTarget: 'N/A',
      requirements: [
        t('phaseTimeline.profitSplit80'),
        t('phaseTimeline.biWeeklyPayouts'),
        t('phaseTimeline.scalingEligible')
      ],
    },
    {
      id: 'scaled',
      name: t('phaseTimeline.scaling'),
      subtitle: t('phaseTimeline.growth'),
      icon: Zap,
      profitTarget: 'N/A',
      requirements: [
        t('phaseTimeline.profitSplit90'),
        t('phaseTimeline.accountSizeIncrease'),
        t('phaseTimeline.vipBenefits')
      ],
    },
  ];

  const getPhaseStatus = (phaseId) => {
    if (phaseId === 'phase1') {
      if (phase1Passed) return 'completed';
      if (currentPhase === 'phase1') return 'active';
      return 'locked';
    }
    if (phaseId === 'phase2') {
      if (phase2Passed) return 'completed';
      if (currentPhase === 'phase2') return 'active';
      if (phase1Passed) return 'unlocked';
      return 'locked';
    }
    if (phaseId === 'funded') {
      if (currentPhase === 'funded') return 'active';
      if (phase2Passed) return 'unlocked';
      return 'locked';
    }
    if (phaseId === 'scaled') {
      return 'locked';
    }
    return 'locked';
  };

  const showProceedButton = (phase1Passed && currentPhase === 'phase1') || 
                            (phase2Passed && currentPhase === 'phase2');

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('phaseTimeline.challengeJourney')}</h3>
          <p className="text-slate-400 text-sm">{t('phaseTimeline.trackProgress')}</p>
        </div>
        {showProceedButton && (
          <Button 
            onClick={onProceedToNextPhase}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500"
          >
            {t('phaseTimeline.proceedToNextPhase')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-700" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-8 left-8 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
          style={{ 
            width: currentPhase === 'phase1' ? '0%' : 
                   currentPhase === 'phase2' ? '33%' : 
                   currentPhase === 'funded' ? '66%' : '100%' 
          }}
        />

        <div className="grid grid-cols-4 gap-4 relative">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const Icon = phase.icon;
            
            return (
              <div key={phase.id} className="flex flex-col items-center">
                {/* Icon Circle */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                  status === 'completed' 
                    ? 'bg-emerald-500 text-white' :
                  status === 'active'
                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white ring-4 ring-emerald-500/30' :
                  status === 'unlocked'
                    ? 'bg-slate-800 border-2 border-emerald-500 text-emerald-400' :
                    'bg-slate-800 border-2 border-slate-700 text-slate-500'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : status === 'locked' ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <Icon className="w-8 h-8" />
                  )}
                </div>

                {/* Phase Info */}
                <div className="text-center mt-4">
                  <Badge className={`mb-2 ${
                    status === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'active'
                      ? 'bg-cyan-500/20 text-cyan-400' :
                    status === 'unlocked'
                      ? 'bg-slate-700 text-slate-300' :
                      'bg-slate-800 text-slate-500'
                  }`}>
                    {status === 'completed' ? t('phaseTimeline.completed') : 
                     status === 'active' ? t('phaseTimeline.active') : 
                     status === 'unlocked' ? t('phaseTimeline.unlocked') : t('phaseTimeline.locked')}
                  </Badge>
                  <h4 className={`font-semibold ${
                    status === 'locked' ? 'text-slate-500' : 'text-white'
                  }`}>
                    {phase.name}
                  </h4>
                  <p className="text-xs text-slate-400">{phase.subtitle}</p>
                  
                  {/* Requirements with Progress */}
                  <div className="mt-3 space-y-1">
                    {phase.requirements.map((req, i) => {
                      // Show progress for current phase only
                      const isCurrentPhase = status === 'active';
                      let progressText = '';
                      
                      if (isCurrentPhase && phase.id === 'phase1') {
                        if (i === 0) {
                          // Profit target
                          progressText = ` (${profitPercent.toFixed(2)}% / ${phase1Target}%)`;
                        } else if (i === 1) {
                          // Trading days
                          progressText = ` (${tradingDaysCompleted} / ${minTradingDays})`;
                        } else if (i === 2) {
                          // Daily drawdown
                          progressText = ` (${dailyDrawdownPercent.toFixed(2)}% / ${maxDailyDD}%)`;
                        }
                      } else if (isCurrentPhase && phase.id === 'phase2') {
                        if (i === 0) {
                          // Profit target
                          progressText = ` (${profitPercent.toFixed(2)}% / ${phase2Target}%)`;
                        } else if (i === 1) {
                          // Trading days
                          progressText = ` (${tradingDaysCompleted} / ${minTradingDays})`;
                        } else if (i === 2) {
                          // Daily drawdown
                          progressText = ` (${dailyDrawdownPercent.toFixed(2)}% / ${maxDailyDD}%)`;
                        }
                      }
                      
                      return (
                        <p key={i} className={`text-xs ${
                          status === 'locked' ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          {req}{progressText && <span className="text-cyan-400">{progressText}</span>}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Complete Banner */}
      {showProceedButton && (
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold">
                🎉 {t('phaseTimeline.phaseCompleted')}
              </h4>
              <p className="text-slate-300 text-sm">
                {t('phaseTimeline.phaseCompletedDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}