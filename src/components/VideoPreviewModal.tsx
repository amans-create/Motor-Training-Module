import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Film } from 'lucide-react';
import { getVideoBlobUrl } from '../utils/indexedDb';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSourceType: 'upload' | 'built_in' | 'url';
  videoFile?: File | null;
  videoUrl?: string;
  moduleTitle: string;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoSourceType,
  videoFile,
  videoUrl,
  moduleTitle
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(140);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Resolve video blob URL if file or indexeddb
  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    async function loadSource() {
      if (videoFile) {
        objectUrl = URL.createObjectURL(videoFile);
        if (!isCancelled) setResolvedBlobUrl(objectUrl);
      } else if (videoUrl && videoUrl.startsWith('indexeddb:')) {
        const key = videoUrl.replace('indexeddb:', '');
        const loaded = await getVideoBlobUrl(key);
        if (!isCancelled && loaded) setResolvedBlobUrl(loaded);
      } else {
        if (!isCancelled) setResolvedBlobUrl(null);
      }
    }

    if (isOpen) {
      loadSource();
      setIsPlaying(false);
      setCurrentTime(0);
    }

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, videoFile, videoUrl]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Film className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold truncate max-w-md">
                Trainer Video Preview: {moduleTitle || 'Process Training Video'}
              </h3>
              <span className="text-[10px] text-slate-400">
                {videoSourceType === 'upload' ? 'Uploaded Video File' : 'Built-in Interactive Training Simulation'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {resolvedBlobUrl ? (
            <video
              ref={videoRef}
              src={resolvedBlobUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 140);
                }
              }}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            /* Interactive Simulated Training Video Preview */
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-center select-none">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>Process Trainer Preview Mode</span>
              </div>

              <div className="max-w-md space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mx-auto text-blue-300">
                  <Film className="w-8 h-8" />
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base">
                  Interactive Motor Insurance Call Simulation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Caller: I hit an obstacle and bumper cracked. Do I pay 50% for plastic?
                  Associate: Under Zero Dep add-on, parts depreciation is 100% covered! Only the compulsory deductible applies."
                </p>
                <div className="inline-block px-3 py-1 bg-blue-900/60 border border-blue-700/50 rounded-full text-[11px] text-blue-200">
                  Total Run Time: 2m 20s (140s) · Aligned with 2-3 minute best practice
                </div>
              </div>
            </div>
          )}

          {/* Big Play Overlay if paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          )}
        </div>

        {/* Video Scrubber & Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 140}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {formatTime(duration || 140)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Rewind to start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Trainer Check: Video length is {Math.floor((duration || 140) / 60)}m {(duration || 140) % 60}s
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
