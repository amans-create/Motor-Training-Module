import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Lock, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { retrieveVideoBlob } from '../utils/indexedDb';

interface VideoPlayerProps {
  moduleId: string;
  videoSource: 'upload' | 'built_in' | 'url';
  videoUrl: string;
  videoDurationSeconds: number;
  moduleTitle: string;
  isLearner: boolean;
  onVideoComplete: () => void;
  isAlreadyCompleted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  moduleId,
  videoSource,
  videoUrl,
  videoDurationSeconds,
  moduleTitle,
  isLearner,
  onVideoComplete,
  isAlreadyCompleted = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(isAlreadyCompleted ? videoDurationSeconds : 0);
  const [isCompleted, setIsCompleted] = useState<boolean>(isAlreadyCompleted);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);

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
        ) : (
          /* High-Fidelity Interactive Process Training Simulation */
          <div className="w-full h-full p-6 flex flex-col justify-between relative bg-radial from-blue-900/20 to-slate-950">
            {/* Top Scene Marker */}
            <div className="flex items-center justify-between z-10 text-xs font-medium">
              <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Process Training Studio · Video Advisory Call</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700">
                <span>Duration: 2m 20s</span>
                <span>·</span>
                <span className="text-amber-400">Mandatory for Call Associates</span>
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
          {blobUrl && (
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) videoRef.current.muted = !isMuted;
              }}
              className="text-slate-400 hover:text-white p-1 rounded"
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
