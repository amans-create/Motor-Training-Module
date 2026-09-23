import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Trophy, ArrowRight, Shield, FileText } from 'lucide-react';
import { Badge } from '../types';
import { playCelebrationFanfare } from '../utils/audioCelebration';

interface CelebrationScoreViewProps {
  score: number;
  totalQuestions: number;
  pointsEarned: number;
  totalAccumulatedPoints: number;
  currentBadge: Badge;
  moduleTitle: string;
  learnerName: string;
  employeeCode: string;
  onViewCertificates: () => void;
  onBackToModules: () => void;
}

export const CelebrationScoreView: React.FC<CelebrationScoreViewProps> = ({
  score,
  totalQuestions,
  pointsEarned,
  totalAccumulatedPoints,
  currentBadge,
  moduleTitle,
  learnerName,
  employeeCode,
  onViewCertificates,
  onBackToModules
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassed = percentage >= 60;

  // Trigger high-fidelity celebration animation and sound
  useEffect(() => {
    // 1. Play Web Audio celebration chime
    playCelebrationFanfare();

    // 2. Fire multi-directional confetti bursts
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#2563EB', '#3B82F6', '#60A5FA']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#10B981', '#059669', '#34D399']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#F59E0B', '#D97706', '#FBBF24']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#8B5CF6', '#EC4899', '#3B82F6']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });

    // Secondary delayed burst for fireworks effect
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        zIndex: 9999
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        zIndex: 9999
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Celebration Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-center relative">
        {/* Top Celebration Gradient Ribbon */}
        <div className="h-3 bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-500"></div>

        <div className="p-8 md:p-10">
          {/* Animated Celebration Icon */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-300/40 mx-auto text-amber-950 animate-bounce duration-1000">
              <Trophy className="w-12 h-12 stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Assessment Completed!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Well done, <span className="font-semibold text-slate-900">{learnerName}</span> ({employeeCode}). Your score for <span className="font-semibold text-slate-800">{moduleTitle}</span> has been logged.
          </p>

          {/* Primary Score & Points Display */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            {/* Score Box */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Your Final Score
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-blue-600 font-mono tabular-nums">
                {score} <span className="text-lg text-slate-400 font-normal">/ {totalQuestions}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {percentage}% Accuracy ({isPassed ? 'Passed' : 'Needs Review'})
              </div>
            </div>

            {/* Points Earned Box */}
            <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                Points Earned
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-amber-600 font-mono tabular-nums">
                +{pointsEarned}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                Total: {totalAccumulatedPoints} Pts
              </div>
            </div>
          </div>

          {/* Badge Recognition Card */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950 text-white text-left max-w-md mx-auto mb-6 shadow-md border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
                <Award className="w-8 h-8 text-amber-950" />
              </div>
              <div>
                <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  Current Certified Badge · Tier {currentBadge.tier}
                </div>
                <h4 className="text-lg font-bold text-white leading-tight">
                  {currentBadge.name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                  {currentBadge.description}
                </p>
              </div>
            </div>
          </div>

          {/* Strict Privacy Notice as requested by User Prompt */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 max-w-md mx-auto mb-8 text-left flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-700">Assessment Confidentiality Notice:</strong> In accordance with training guidelines, individual question responses and correct answer keys are kept confidential to preserve test integrity across associate call batches.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={onViewCertificates}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View Monthly Certificates</span>
            </button>
            <button
              onClick={onBackToModules}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <span>Back to Modules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
