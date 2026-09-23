import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Settings, 
  Check, 
  Sparkles,
  Box,
  Crosshair,
  Sliders,
  Info,
  Layers,
  Wand2
} from 'lucide-react';
import { retrieveVideoBlob } from '../utils/indexedDb';
import { GoogleFlowConfig } from '../types';

export type VideoQuality = '1080p' | '720p' | '480p' | '360p' | 'Auto';

interface VideoPlayerProps {
  moduleId: string;
  videoSource: 'upload' | 'built_in' | 'url';
  videoUrl: string;
  videoDurationSeconds: number;
  moduleTitle: string;
  isLearner: boolean;
  onVideoComplete: () => void;
  isAlreadyCompleted?: boolean;
  initialQuality?: VideoQuality;
  googleFlowConfig?: GoogleFlowConfig;
}

const QUALITY_OPTIONS: { id: VideoQuality; label: string; desc: string }[] = [
  { id: '1080p', label: '1080p (Full HD)', desc: 'Highest fidelity · 4.5 Mbps' },
  { id: '720p', label: '720p (HD)', desc: 'Recommended standard · 2.2 Mbps' },
  { id: '480p', label: '480p (SD)', desc: 'Balanced data saver · 1.0 Mbps' },
  { id: '360p', label: '360p (Low)', desc: 'Low bandwidth · 500 Kbps' },
  { id: 'Auto', label: 'Auto (Adaptive)', desc: 'Optimized for connection' },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  moduleId,
  videoSource,
  videoUrl,
  videoDurationSeconds,
  moduleTitle,
  isLearner,
  onVideoComplete,
  isAlreadyCompleted = false,
  initialQuality = '720p'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(isAlreadyCompleted ? videoDurationSeconds : 0);
  const [isCompleted, setIsCompleted] = useState<boolean>(isAlreadyCompleted);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>(initialQuality);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [qualityNotice, setQualityNotice] = useState<string | null>(null);

  // Google Flow AR Interactive Video State
  const [isArModeActive, setIsArModeActive] = useState<boolean>(
    googleFlowConfig?.isGoogleFlowEnabled ?? true
  );
  const [arAngle, setArAngle] = useState<'front' | 'engine' | 'side' | 'full'>('front');
  const [arHotspot, setArHotspot] = useState<'bumper' | 'engine' | 'glass'>('bumper');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const qualityNoticeTimeoutRef = useRef<number | null>(null);

  const handleQualityChange = (quality: VideoQuality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    const label = QUALITY_OPTIONS.find(q => q.id === quality)?.label || quality;
    setQualityNotice(`Stream Quality: ${label}`);

    if (qualityNoticeTimeoutRef.current) {
      window.clearTimeout(qualityNoticeTimeoutRef.current);
    }
    qualityNoticeTimeoutRef.current = window.setTimeout(() => {
      setQualityNotice(null);
    }, 2400);
  };

  // If source is upload or blob, fetch from IndexedDB
  useEffect(() => {
    let active = true;
    if (videoSource === 'upload' && videoUrl.startsWith('indexeddb:')) {
      const key = videoUrl.replace('indexeddb:', '');
      retrieveVideoBlob(key).then((blob) => {
        if (active && blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      });
    }
    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [videoSource, videoUrl]);

  // Handle simulation clock if built_in simulation video
  const effectiveDuration = videoDurationSeconds || 140;

  useEffect(() => {
    if (videoSource === 'built_in' || !blobUrl && videoSource !== 'url') {
      if (isPlaying) {
        timerRef.current = window.setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + 1 * playbackSpeed;
            setMaxWatchedTime((currMax) => Math.max(currMax, next));

            if (next >= effectiveDuration) {
              if (timerRef.current) clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsCompleted(true);
              onVideoComplete();
              return effectiveDuration;
            }
            return next;
          });
        }, 1000);
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, videoSource, blobUrl, effectiveDuration, playbackSpeed, onVideoComplete]);

  // Real video element listeners
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || effectiveDuration;

    // Strict Anti-Cheating Gate for Learners: Cannot seek past max watched time!
    if (isLearner && !isCompleted && current > maxWatchedTime + 2) {
      videoRef.current.currentTime = maxWatchedTime;
      return;
    }

    setCurrentTime(current);
    setMaxWatchedTime((prev) => Math.max(prev, current));

    if (current >= dur - 0.5 || (dur > 0 && current / dur >= 0.99)) {
      if (!isCompleted) {
        setIsCompleted(true);
        onVideoComplete();
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const watchRatio = Math.min(1, Math.max(currentTime, maxWatchedTime) / effectiveDuration);
  const watchPercent = Math.round(watchRatio * 100);

  // Script subtitle cues for the training scenario simulation
  const scenarioCues = [
    { start: 0, end: 15, speaker: 'Trainer', text: 'Welcome team. Today we review crucial Motor Insurance call protocols for Zero Depreciation and claim deductibles.' },
    { start: 15, end: 35, speaker: 'Customer (Simulated)', text: 'I had an accident yesterday. My front bumper and headlights are cracked. Why is the surveyor saying plastic has a 50% deduction?' },
    { start: 35, end: 60, speaker: 'Associate Script', text: 'Sir, under standard comprehensive policies, IRDAI mandates a 50% depreciation deduction on plastic and rubber parts. However, with your Zero Dep add-on, that 50% is fully waived!' },
    { start: 60, end: 85, speaker: 'Customer (Simulated)', text: 'What about the engine oil and coolant that leaked during the bumper impact? Will the insurer pay for those too?' },
    { start: 85, end: 110, speaker: 'Associate Script', text: 'Important distinction: Zero Dep covers parts depreciation. Consumable fluids (oil, coolant, nuts/bolts) require the Consumables Add-on Cover. Let us verify your policy schedule.' },
    { start: 110, end: 140, speaker: 'Quality Summary', text: 'Key Takeaways: Always explain Compulsory Deductible (₹1,000 / ₹2,000), remind about the 2-claims/year Zero Dep cap, and ensure transparent customer advisory.' }
  ];

  const currentCue = scenarioCues.find(c => currentTime >= c.start && currentTime < c.end) || scenarioCues[scenarioCues.length - 1];

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 text-white">
      {/* Video Viewport Area */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center overflow-hidden select-none">
        {blobUrl ? (
          <video
            ref={videoRef}
            src={blobUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              setIsCompleted(true);
              onVideoComplete();
            }}
            muted={isMuted}
            playsInline
          />
        ) : isArModeActive ? (
          /* Google Flow AR Interactive Video Simulation Experience */
          <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between relative bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 overflow-hidden">
            {/* Top Scene Marker & AR Mode Controls */}
            <div className="flex items-center justify-between z-20 text-xs font-medium gap-2">
              <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 shadow-md">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="font-bold font-mono tracking-tight text-[11px]">GOOGLE FLOW AR · WebXR 60FPS</span>
              </div>

              {/* View Switcher: AR Mode vs Classic Studio */}
              <div className="flex items-center gap-1.5">
                <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                  {(['front', 'engine', 'side', 'full'] as const).map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setArAngle(ang)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        arAngle === ang ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ang === 'front' ? 'Bumper' : ang === 'engine' ? 'Engine' : ang === 'side' ? 'Side' : 'Chassis'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsArModeActive(false)}
                  className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Classic View
                </button>
              </div>
            </div>

            {/* Interactive 3D Holographic Vehicle Model & AR Hotspots */}
            <div className="my-auto relative flex items-center justify-center w-full max-w-lg mx-auto z-10 py-1">
              <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

              <div className="relative w-72 sm:w-96 h-36 sm:h-44 flex items-center justify-center">
                <svg 
                  viewBox="0 0 400 200" 
                  className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all duration-500"
                  style={{
                    transform: arAngle === 'engine' 
                      ? 'scale(1.15) translateY(6px)' 
                      : arAngle === 'side' 
                      ? 'scale(0.95) rotateY(20deg)' 
                      : arAngle === 'full'
                      ? 'scale(0.85)'
                      : 'scale(1.05)'
                  }}
                >
                  {/* Outer Car Body Frame */}
                  <path
                    d="M 50 140 L 70 90 L 130 85 L 180 40 L 260 40 L 320 85 L 360 95 L 370 140 L 340 140 A 25 25 0 0 1 290 140 L 130 140 A 25 25 0 0 1 80 140 Z"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                  {/* Holographic Wheels */}
                  <circle cx="105" cy="140" r="22" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                  <circle cx="105" cy="140" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="315" cy="140" r="22" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                  <circle cx="315" cy="140" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />

                  {/* Windshield & Windows */}
                  <path d="M 185 45 L 255 45 L 245 85 L 140 85 Z" fill="rgba(6, 182, 212, 0.18)" stroke="#06b6d4" strokeWidth="1.5" />
                  <path d="M 260 45 L 310 85 L 260 85 Z" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" strokeWidth="1.5" />
                  {/* Headlights */}
                  <polygon points="50,110 70,105 70,125 50,120" fill="#facc15" opacity="0.8" />
                </svg>

                {/* AR Hotspot 1: Front Bumper */}
                <button
                  type="button"
                  onClick={() => setArHotspot('bumper')}
                  className={`absolute left-3 top-18 p-1.5 rounded-full transition-transform cursor-pointer ${
                    arHotspot === 'bumper' ? 'scale-125 ring-4 ring-cyan-400/50 bg-cyan-500' : 'bg-blue-600 hover:scale-110'
                  }`}
                  title="Zero Dep on Plastic Bumper"
                >
                  <Crosshair className="w-3.5 h-3.5 text-white" />
                </button>

                {/* AR Hotspot 2: Engine Sump */}
                <button
                  type="button"
                  onClick={() => setArHotspot('engine')}
                  className={`absolute left-28 top-14 p-1.5 rounded-full transition-transform cursor-pointer ${
                    arHotspot === 'engine' ? 'scale-125 ring-4 ring-amber-400/50 bg-amber-500' : 'bg-slate-700 hover:scale-110'
                  }`}
                  title="Consumables Cover for Engine Fluids"
                >
                  <Sliders className="w-3.5 h-3.5 text-white" />
                </button>

                {/* AR Hotspot 3: Windshield Glass */}
                <button
                  type="button"
                  onClick={() => setArHotspot('glass')}
                  className={`absolute left-48 top-5 p-1.5 rounded-full transition-transform cursor-pointer ${
                    arHotspot === 'glass' ? 'scale-125 ring-4 ring-emerald-400/50 bg-emerald-500' : 'bg-slate-700 hover:scale-110'
                  }`}
                  title="Glass: 0% Depreciation"
                >
                  <Info className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Live Holographic Script & Teleprompter Cue */}
            <div className="z-20 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 text-left space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>{currentCue.speaker}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-normal">Segment {Math.min(5, Math.floor(currentTime / 28) + 1)} of 5</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  {arHotspot === 'bumper' ? 'Focus: Front Bumper (Zero Dep 100%)' : arHotspot === 'engine' ? 'Focus: Engine Consumables' : 'Focus: Glass (0% Dep)'}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                "{currentCue.text}"
              </p>
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-xs text-slate-400 z-10 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Google Flow AR Core Active</span>
              </span>
              <span className="text-slate-300">{formatTime(currentTime)} / {formatTime(effectiveDuration)}</span>
            </div>
          </div>
        ) : (
          /* High-Fidelity Interactive Process Training Simulation */
          <div className="w-full h-full p-6 flex flex-col justify-between relative bg-radial from-blue-900/20 to-slate-950">
            {/* Top Scene Marker */}
            <div className="flex items-center justify-between z-10 text-xs font-medium">
              <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Process Training Studio · Video Advisory Call</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsArModeActive(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-md text-[11px] font-bold shadow transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Google Flow AR View</span>
                </button>
                <div className="text-slate-300 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700">
                  <span>Duration: 2m 20s</span>
                </div>
              </div>
            </div>

            {/* Visual Process Illustration */}
            <div className="my-auto flex flex-col items-center justify-center text-center max-w-xl mx-auto z-10">
              <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-2">
                {moduleTitle}
              </h3>
              <p className="text-xs text-slate-300 max-w-md">
                Listen carefully to the advisor-customer conversation and process rules. You cannot skip forward until fully watched.
              </p>

              {/* Live Dialogue Card */}
              <div className="mt-5 w-full bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-left">
                <div className="text-[11px] font-semibold text-blue-400 mb-1 flex items-center gap-2">
                  <span>{currentCue.speaker}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 text-[10px]">Call Segment {Math.min(5, Math.floor(currentTime / 28) + 1)} of 5</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  "{currentCue.text}"
                </p>
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-xs text-slate-400 z-10 pt-2 border-t border-slate-800">
              <span>Policybazaar Motor Training Unit</span>
              <span className="text-slate-300">{formatTime(currentTime)} / {formatTime(effectiveDuration)}</span>
            </div>
          </div>
        )}

        {/* Quality Change Notification Toast */}
        {qualityNotice && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-500/50 shadow-2xl">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{qualityNotice}</span>
          </div>
        )}

        {/* Big Center Play Overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-20 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all border border-blue-400/40"
            aria-label="Play video"
          >
            <Play className="w-8 h-8 ml-1 fill-white" />
          </button>
        )}

        {/* Video Gated Completion Banner */}
        {isCompleted && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-lg border border-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Video 100% Completed · Quiz Unlocked</span>
          </div>
        )}
      </div>

      {/* Strict Anti-Cheat Progress Bar */}
      <div className="px-5 pt-4 pb-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Watch Progress:</span>
            <span className="tabular-nums font-mono text-blue-400 font-semibold">{watchPercent}%</span>
            {!isCompleted && isLearner && (
              <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> Quiz unlocks at 100%
              </span>
            )}
          </div>
          <span className="text-slate-400 font-mono text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Custom Progress Track */}
        <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          {/* Max watched range */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-500/40 transition-all duration-300"
            style={{ width: `${(maxWatchedTime / effectiveDuration) * 100}%` }}
          />
          {/* Current playhead */}
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-150 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
            style={{ width: `${(currentTime / effectiveDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Control Buttons Deck */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-950 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>

          {!blobUrl && (
            <button
              onClick={() => setIsArModeActive(!isArModeActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                isArModeActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle Google Flow AR Mode"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{isArModeActive ? 'Google Flow AR Active' : 'Switch to AR Mode'}</span>
              <span className="sm:hidden">AR</span>
            </button>
          )}

          {/* Speed Selector */}
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <span>Speed:</span>
            {[1, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  setPlaybackSpeed(spd);
                  if (videoRef.current) videoRef.current.playbackRate = spd;
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  playbackSpeed === spd ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quality Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                showQualityMenu ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Change video stream quality"
            >
              <Settings className="w-3 h-3 text-blue-400" />
              <span className="font-mono">{selectedQuality === 'Auto' ? 'Auto (720p)' : selectedQuality}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-52 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>Stream Quality</span>
                  <span className="text-blue-400 text-[9px] font-mono">HD</span>
                </div>
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleQualityChange(opt.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      selectedQuality === opt.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 leading-none">{opt.desc}</div>
                    </div>
                    {selectedQuality === opt.id && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {blobUrl && (
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) videoRef.current.muted = !isMuted;
              }}
              className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <div className="text-[11px] text-slate-400">
            {isLearner ? (
              <span className="text-slate-400">Learner View · Gated Access</span>
            ) : (
              <span className="text-amber-400 font-medium">Trainer Preview Mode</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
