import React, { useState, useEffect } from 'react';
import { LearningModule, LearnerProfile, LearnerAttempt, Certificate } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { QuizView } from './QuizView';
import { CelebrationScoreView } from './CelebrationScoreView';
import { PolicybazaarLogo } from './PolicybazaarLogo';
import { BADGES, getBadgeByPoints, recordAttempt, saveCertificate, getLearnerTotalPoints, lookupAssociate } from '../utils/storage';
import { RosterAssociate } from '../types';
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  LogIn, 
  LogOut, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  PhoneCall, 
  UserCheck 
} from 'lucide-react';

interface LearnerPortalProps {
  modules: LearningModule[];
  attempts: LearnerAttempt[];
  certificates: Certificate[];
  activeLearner: LearnerProfile | null;
  onLoginLearner: (profile: LearnerProfile) => void;
  onLogoutLearner: () => void;
  onRefreshData: () => void;
  onNavigateToCertificates: () => void;
  initialModuleId?: string | null;
}

export const LearnerPortal: React.FC<LearnerPortalProps> = ({
  modules,
  attempts,
  certificates,
  activeLearner,
  onLoginLearner,
  onLogoutLearner,
  onRefreshData,
  onNavigateToCertificates,
  initialModuleId
}) => {
  // Login Form State
  const [empCodeInput, setEmpCodeInput] = useState<string>('PB-1042');
  const [nameInput, setNameInput] = useState<string>('Rahul Sharma');
  const [teamLeaderInput, setTeamLeaderInput] = useState<string>('Amit Kumar (TL)');
  const [vlookupMatch, setVlookupMatch] = useState<RosterAssociate | null>(null);

  // Live VLOOKUP handler on typing e-code
  const handleEmpCodeChange = (val: string) => {
    setEmpCodeInput(val);
    const match = lookupAssociate(val);
    if (match) {
      setNameInput(match.employeeName);
      setTeamLeaderInput(match.teamLeader || 'Amit Kumar (TL)');
      setVlookupMatch(match);
    } else {
      setVlookupMatch(null);
    }
  };

  // Run initial lookup on mount
  useEffect(() => {
    if (empCodeInput) {
      const match = lookupAssociate(empCodeInput);
      if (match) {
        setNameInput(match.employeeName);
        setTeamLeaderInput(match.teamLeader || 'Amit Kumar (TL)');
        setVlookupMatch(match);
      }
    }
  }, []);

  // Selected Module State
  const publishedModules = modules.filter(m => m.status === 'published');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    initialModuleId || publishedModules[0]?.id || null
  );

  // Video watch status for current module
  const [videoWatched, setVideoWatched] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<LearnerAttempt | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Sync initial module id from url if provided
  useEffect(() => {
    if (initialModuleId && publishedModules.some(m => m.id === initialModuleId)) {
      setSelectedModuleId(initialModuleId);
    }
  }, [initialModuleId, publishedModules]);

  const selectedModule = publishedModules.find(m => m.id === selectedModuleId);

  // Check if learner already attempted this module
  useEffect(() => {
    if (activeLearner && selectedModuleId) {
      const existing = attempts.find(
        a => a.employeeCode.toUpperCase() === activeLearner.employeeCode.toUpperCase() && a.moduleId === selectedModuleId
      );
      if (existing) {
        setCurrentAttempt(existing);
        setVideoWatched(true);
      } else {
        setCurrentAttempt(null);
        setVideoWatched(false);
      }
    }
  }, [activeLearner, selectedModuleId, attempts]);

  // Points & Badge calculation
  const totalPoints = activeLearner ? getLearnerTotalPoints(activeLearner.employeeCode) : 0;
  const currentBadge = getBadgeByPoints(totalPoints);

  // Next badge tier calculation
  const nextBadgeIndex = BADGES.findIndex(b => b.id === currentBadge.id) + 1;
  const nextBadge = nextBadgeIndex < BADGES.length ? BADGES[nextBadgeIndex] : null;
  const pointsToNext = nextBadge ? nextBadge.minPoints - totalPoints : 0;

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCodeInput.trim() || !nameInput.trim()) return;

    const profile: LearnerProfile = {
      employeeCode: empCodeInput.trim().toUpperCase(),
      name: nameInput.trim(),
      teamLeader: teamLeaderInput.trim() || 'Amit Kumar (TL)',
      department: teamLeaderInput.trim() || 'Motor Inbound Advisory',
      totalPoints: 0,
      currentBadgeId: 'badge-1'
    };
    onLoginLearner(profile);
  };

  const handleVideoCompleted = () => {
    setVideoWatched(true);
  };

  const handleQuizSubmit = (score: number, total: number) => {
    if (!activeLearner || !selectedModule) return;

    const points = score * 100;
    const passed = score >= 3;
    const certId = `cert-${activeLearner.employeeCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newAttempt: LearnerAttempt = {
      id: `att-${Date.now()}`,
      moduleId: selectedModule.id,
      moduleTitle: selectedModule.title,
      dedicatedDate: selectedModule.dedicatedDate,
      employeeCode: activeLearner.employeeCode,
      learnerName: activeLearner.name,
      videoWatchedRatio: 1.0,
      videoCompleted: true,
      score,
      totalQuestions: total,
      scorePercentage: Math.round((score / total) * 100),
      pointsEarned: points,
      completedAt: new Date().toISOString(),
      passed,
      certificateId: passed ? certId : undefined
    };

    recordAttempt(newAttempt);

    // If passed, create certified certificate
    if (passed) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const today = new Date();
      const monthYear = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

      const newCert: Certificate = {
        id: certId,
        certificateNumber: `CERT-${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${activeLearner.employeeCode}`,
        employeeCode: activeLearner.employeeCode,
        learnerName: activeLearner.name,
        moduleId: selectedModule.id,
        moduleTitle: selectedModule.title,
        dedicatedDate: selectedModule.dedicatedDate,
        monthYear,
        issueDate: today.toISOString().split('T')[0],
        score: `${score} / ${total} (${Math.round((score / total) * 100)}%)`,
        pointsEarned: points,
        badgeName: currentBadge.name,
        trainerSignature: selectedModule.trainerName || 'Quality Lead'
      };
      saveCertificate(newCert);
    }

    setCurrentAttempt(newAttempt);
    setShowCelebration(true);
    onRefreshData();
  };

  // If learner is not logged in, show employee gate
  if (!activeLearner) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Card Top Brand & Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white text-center">
            {/* Attached Policybazaar Official Logo with HAR FAMILY HOGI INSURED Tagline */}
            <div className="inline-block bg-white p-3 rounded-2xl shadow-md mb-3.5">
              <PolicybazaarLogo size="md" showTagline={true} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Associate Process Portal</h2>
            <p className="text-xs text-blue-100 mt-1">
              Enter your E-Code to begin today's video process module.
            </p>
          </div>

          <form onSubmit={handleLoginFormSubmit} className="p-6 md:p-8 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Employee Code (E-Code) *
                </label>
                {vlookupMatch && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Verified in Active Roster
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={empCodeInput}
                onChange={(e) => handleEmpCodeChange(e.target.value)}
                placeholder="e.g. PB-1042 or 1042"
                className={`w-full text-sm bg-slate-50 border rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 font-mono transition-colors ${
                  vlookupMatch 
                    ? 'border-emerald-400 focus:ring-emerald-500 bg-emerald-50/20' 
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              
              {vlookupMatch ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 mt-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Auto-collated for <strong>{vlookupMatch.employeeName}</strong> · Team Leader: <strong>{vlookupMatch.teamLeader}</strong>
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Mention your E-Code to auto-collate your Associate Name & Team Leader via live VLOOKUP.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associate Full Name *
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Team Leader *
              </label>
              <input
                type="text"
                required
                value={teamLeaderInput}
                onChange={(e) => setTeamLeaderInput(e.target.value)}
                placeholder="e.g. Amit Kumar (TL)"
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Access Learning Module</span>
            </button>

            {/* Quick Demo Pre-fills */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 block mb-2">Quick Pre-fill Sample Associates:</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmpCodeInput('PB-1042');
                    setNameInput('Rahul Sharma');
                    setTeamLeaderInput('Amit Kumar (TL)');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  PB-1042 (Rahul Sharma)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmpCodeInput('PB-2180');
                    setNameInput('Priya Sundaram');
                    setTeamLeaderInput('Sneha Kapoor (TL)');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  PB-2180 (Priya Sundaram)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmpCodeInput('PB-3055');
                    setNameInput('Vikram Malhotra');
                    setTeamLeaderInput('Vikas Chauhan (TL)');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  PB-3055 (Vikram Malhotra)
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If user completed quiz and requested celebration view
  if (showCelebration && currentAttempt && selectedModule) {
    return (
      <CelebrationScoreView
        score={currentAttempt.score}
        totalQuestions={currentAttempt.totalQuestions}
        pointsEarned={currentAttempt.pointsEarned}
        totalAccumulatedPoints={totalPoints}
        currentBadge={currentBadge}
        moduleTitle={selectedModule.title}
        learnerName={activeLearner.name}
        employeeCode={activeLearner.employeeCode}
        onViewCertificates={onNavigateToCertificates}
        onBackToModules={() => setShowCelebration(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Learner Profile Banner & Badges Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20 shrink-0">
              {activeLearner.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {activeLearner.name}
                </h2>
                <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {activeLearner.employeeCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Team Leader: <strong className="text-slate-800 font-semibold">{activeLearner.teamLeader || 'Amit Kumar (TL)'}</strong> · Motor Insurance Advisory
              </p>
            </div>
          </div>

          {/* Points & Current Badge Capsule */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Total Points */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">
                Total Points Earned
              </div>
              <div className="text-xl font-extrabold text-amber-600 font-mono tabular-nums">
                {totalPoints} Pts
              </div>
            </div>

            {/* Current Badge */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl px-4 py-2 border border-slate-800 shadow-sm flex items-center gap-3">
              <Award className="w-7 h-7 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">
                  Current Badge (Tier {currentBadge.tier})
                </div>
                <div className="text-xs font-bold text-white">
                  {currentBadge.name}
                </div>
                {nextBadge && (
                  <div className="text-[10px] text-slate-300 font-normal">
                    {pointsToNext} pts to Tier {nextBadge.tier} ({nextBadge.name})
                  </div>
                )}
              </div>
            </div>

            {/* Switch User / Logout */}
            <button
              onClick={onLogoutLearner}
              className="text-xs text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch Associate"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Modules Navigation & Active Module Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Published Modules List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Modules ({publishedModules.length})
            </span>
            <span className="text-[11px] text-blue-600 font-medium">Daily Call Updates</span>
          </div>

          <div className="space-y-2.5">
            {publishedModules.map((mod) => {
              const isSelected = selectedModuleId === mod.id;
              const attempt = attempts.find(
                a => a.employeeCode.toUpperCase() === activeLearner.employeeCode.toUpperCase() && a.moduleId === mod.id
              );

              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mod.dedicatedDate}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {Math.floor(mod.videoDurationSeconds / 60)}m {mod.videoDurationSeconds % 60}s
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-2">
                    {mod.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="text-slate-500 text-[10px] truncate max-w-[150px]">
                      {mod.category}
                    </span>

                    {attempt ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Score: {attempt.score}/5</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-medium text-[10px]">
                        <Lock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Module Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedModule ? (
            <>
              {/* Module Header Overview Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {selectedModule.category}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dedicated Date: <strong className="text-slate-700">{selectedModule.dedicatedDate}</strong></span>
                  </div>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                  {selectedModule.title}
                </h1>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">
                  {selectedModule.description}
                </p>

                {/* Key Takeaways & Call Scripts for Associates */}
                {selectedModule.callKeyTakeaways && selectedModule.callKeyTakeaways.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                    <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                      <span>Process Trainer Guidelines to Implement on Calls:</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      {selectedModule.callKeyTakeaways.map((tip, i) => (
                        <li key={i} className="leading-snug">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Video Training Stage (Anti-Cheating Gated) */}
              <div id="video-training-stage">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Step 1: Watch Process Training Video</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {videoWatched || currentAttempt ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Video Watched
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Complete 100% to unlock quiz</span>
                    )}
                  </span>
                </div>

                {/* Video Player Component */}
                <VideoPlayer
                  moduleId={selectedModule.id}
                  videoSource={selectedModule.videoSource}
                  videoUrl={selectedModule.videoUrl}
                  videoDurationSeconds={selectedModule.videoDurationSeconds}
                  moduleTitle={selectedModule.title}
                  isLearner={true}
                  onVideoComplete={handleVideoCompleted}
                  isAlreadyCompleted={!!currentAttempt}
                  initialQuality={selectedModule.videoQuality || '720p'}
                />
              </div>

              {/* Quiz Assessment Stage */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Step 2: 5-Question Process MCQ Assessment</span>
                  </span>
                  {currentAttempt && (
                    <span className="text-xs font-semibold text-blue-600">
                      Attempted: {currentAttempt.score}/5 Score ({currentAttempt.pointsEarned} Pts)
                    </span>
                  )}
                </div>

                {currentAttempt ? (
                  /* Completed State Card with Celebration Re-trigger */
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      You Have Completed This Module Assessment
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Your score was <strong className="text-slate-800">{currentAttempt.score} / 5</strong> (+{currentAttempt.pointsEarned} Points). Questions & answers remain confidential.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setShowCelebration(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Re-open Score & Celebration
                      </button>
                      <button
                        onClick={onNavigateToCertificates}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        View Monthly Certificate
                      </button>
                    </div>
                  </div>
                ) : (
                  <QuizView
                    questions={selectedModule.questions}
                    moduleTitle={selectedModule.title}
                    isUnlocked={videoWatched}
                    onSubmit={handleQuizSubmit}
                    onScrollToVideo={() => {
                      const el = document.getElementById('video-training-stage');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              No module selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
