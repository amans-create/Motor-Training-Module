import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Layers, 
  Box, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Eye, 
  RotateCw, 
  Check, 
  Crosshair, 
  Compass, 
  Maximize2,
  Volume2,
  Wand2,
  Cpu,
  Info
} from 'lucide-react';
import { GoogleFlowConfig } from '../types';

interface GoogleFlowArStudioProps {
  currentConfig?: GoogleFlowConfig;
  moduleTitle: string;
  onSaveGoogleFlowConfig: (config: GoogleFlowConfig) => void;
  onPreviewArVideo: (config: GoogleFlowConfig) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'zero_dep_3d',
    title: 'Zero Dep vs Consumables 3D Exploded Engine & Bumper',
    prompt: 'Interactive AR simulation of a damaged Hyundai Creta front bumper and engine sump. Demonstrate to the customer why IRDAI 50% plastic depreciation is waived by Zero Dep, while oil leak requires Consumables Add-on.',
    elements: ['3D Car Mesh & Damage Hotspots', 'Holographic Claim Teleprompter', 'Interactive AR Checkpoints', 'Spatial 3D Audio'],
    avatar: 'Suhail Taneja (Senior Manager Motor Sales & Service)'
  },
  {
    id: 'salvage_total_loss',
    title: 'Constructive Total Loss & Salvage AR Inspection',
    prompt: '3D AR structural chassis inspection explaining the 75% IDV constructive total loss threshold to policyholders, with floating tariff calculations and surveyor checklist.',
    elements: ['3D Car Mesh & Damage Hotspots', 'IRDAI Deductibles Tariff Hologram', 'Holographic Claim Teleprompter'],
    avatar: 'Vikram Seth (Quality & Process Surveyor)'
  },
  {
    id: 'cashless_network',
    title: 'Cashless Garage Network & Compulsory Deductibles Walkthrough',
    prompt: 'Augmented reality map and invoice breakdown explaining why ₹1,000 / ₹2,000 compulsory deductible is always payable even at 100% cashless network workshops.',
    elements: ['Holographic Claim Teleprompter', 'Interactive AR Checkpoints', 'Spatial 3D Audio'],
    avatar: 'Aditi Rao (Senior Underwriting Lead)'
  }
];

export const GoogleFlowArStudio: React.FC<GoogleFlowArStudioProps> = ({
  currentConfig,
  moduleTitle,
  onSaveGoogleFlowConfig,
  onPreviewArVideo
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('zero_dep_3d');
  const [customPrompt, setCustomPrompt] = useState<string>(
    currentConfig?.arScenarioPrompt || PRESET_SCENARIOS[0].prompt
  );
  const [flowProjectId, setFlowProjectId] = useState<string>(
    currentConfig?.flowProjectId || 'flow-pb-motor-ar-2026'
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentConfig?.arAvatar || 'Suhail Taneja (Senior Manager Motor Sales & Service)'
  );
  const [selectedElements, setSelectedElements] = useState<string[]>(
    currentConfig?.arElements || [
      '3D Car Mesh & Damage Hotspots',
      'Holographic Claim Teleprompter',
      'Interactive AR Checkpoints',
      'Spatial 3D Audio'
    ]
  );
  const [arMode, setArMode] = useState<'3d_inspection' | 'holographic' | 'full_ar'>(
    currentConfig?.arMode || 'full_ar'
  );

  // Generation Pipeline State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerated, setIsGenerated] = useState<boolean>(!!currentConfig?.isGoogleFlowEnabled);

  // Interactive 3D Preview Inspector State
  const [activeAngle, setActiveAngle] = useState<'front' | 'engine' | 'side' | 'full'>('front');
  const [selectedHotspot, setSelectedHotspot] = useState<string>('bumper');

  const toggleElement = (el: string) => {
    if (selectedElements.includes(el)) {
      setSelectedElements(selectedElements.filter(e => e !== el));
    } else {
      setSelectedElements([...selectedElements, el]);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedPreset(preset.id);
    setCustomPrompt(preset.prompt);
    setSelectedElements(preset.elements);
    setSelectedAvatar(preset.avatar);
  };

  const handleGenerateArVideo = () => {
    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => setGenerationStep(2), 1100);
    setTimeout(() => setGenerationStep(3), 2200);
    setTimeout(() => setGenerationStep(4), 3300);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);

      const newConfig: GoogleFlowConfig = {
        isGoogleFlowEnabled: true,
        flowProjectId: flowProjectId.trim() || 'flow-pb-motor-ar-2026',
        flowProjectUrl: `https://flow.google/project/${encodeURIComponent(flowProjectId.trim() || 'flow-pb-motor-ar-2026')}`,
        arScenarioPrompt: customPrompt,
        arElements: selectedElements,
        arAvatar: selectedAvatar,
        arMode: arMode,
        generatedAt: new Date().toISOString()
      };

      onSaveGoogleFlowConfig(newConfig);
    }, 4200);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white space-y-6 shadow-xl">
      {/* Top Banner: Google Flow Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Google Flow AR Video Studio
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                WebXR / ARCore Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Create AI-powered Augmented Reality (AR) interactive customer claim training videos with 3D model hotspots and spatial scripts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://flow.google/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors"
            title="Open external Google Flow Studio"
          >
            <span>Open flow.google</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300">
          Choose AR Scenario Template or Customize Prompt:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                selectedPreset === preset.id
                  ? 'bg-blue-600/20 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/30 text-white'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold truncate">{preset.title}</span>
                {selectedPreset === preset.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Editor & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Prompt & Avatar */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Google Flow AR Prompt Instructions:
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {customPrompt.length} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 leading-relaxed font-sans"
              placeholder="Describe the AR scene, damage parts to inspect, and script nuances..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                AR Presenter / Voice Synthesis:
              </label>
              <select
                value={selectedAvatar}
                onChange={(e) => setSelectedAvatar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Suhail Taneja (Senior Manager Motor Sales & Service)">
                  Suhail Taneja (Senior Manager Motor Sales & Service)
                </option>
                <option value="Aditi Rao (Senior Underwriting Lead)">
                  Aditi Rao (Senior Underwriting Lead)
                </option>
                <option value="Vikram Seth (Quality & Process Surveyor)">
                  Vikram Seth (Quality & Process Surveyor)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Google Flow Project ID / Token:
              </label>
              <input
                type="text"
                value={flowProjectId}
                onChange={(e) => setFlowProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                placeholder="flow-project-identifier"
              />
            </div>
          </div>

          {/* Interactive AR Features to Include */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Augmented Reality (AR) Scene Elements:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: '3D Car Mesh & Damage Hotspots', desc: 'Clickable parts (Bumper, Engine, Glass)' },
                { name: 'Holographic Claim Teleprompter', desc: 'Floating script with audio synchronization' },
                { name: 'Interactive AR Checkpoints', desc: 'Auto-pause for MCQ knowledge verification' },
                { name: 'Spatial 3D Audio', desc: 'Directional advisor-customer simulated call' }
              ].map((item) => {
                const active = selectedElements.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleElement(item.name)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      active 
                        ? 'bg-blue-950/60 border-cyan-500/60 text-white' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      active ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-600'
                    }`}>
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Generation Action & Live Pipeline Status */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Google Flow AR Pipeline Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Google Flow generates WebXR-compatible interactive spatial video clips directly synchronized with Policybazaar MCQ questions and IRDAI compliance guidelines.
            </p>

            {isGenerating ? (
              <div className="space-y-3 bg-slate-900 border border-cyan-500/40 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Generating AR Video in Google Flow...
                  </span>
                  <span className="font-mono text-slate-400">Step {generationStep}/4</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-2 ${generationStep >= 1 ? 'text-white' : 'text-slate-600'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${generationStep >= 1 ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <span>Analyzing Prompt & Call Scenario Context</span>
                  </div>
                  <div className={`flex items-center gap-2 ${generationStep >= 2 ? 'text-white' : 'text-slate-600'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${generationStep >= 2 ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <span>Rendering 3D Spatial Vehicle Mesh & Damage Nodes</span>
                  </div>
                  <div className={`flex items-center gap-2 ${generationStep >= 3 ? 'text-white' : 'text-slate-600'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${generationStep >= 3 ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <span>Synthesizing Voice & Holographic Teleprompter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${generationStep >= 4 ? 'text-white' : 'text-slate-600'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${generationStep >= 4 ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <span>Publishing WebXR AR Interactive Video Feed</span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-700" 
                    style={{ width: `${(generationStep / 4) * 100}%` }}
                  />
                </div>
              </div>
            ) : isGenerated ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Google Flow AR Video Ready & Integrated</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div><strong className="text-white">Project:</strong> <span className="font-mono text-cyan-300">{flowProjectId}</span></div>
                  <div><strong className="text-white">Presenter:</strong> {selectedAvatar}</div>
                  <div><strong className="text-white">Interactive Elements:</strong> {selectedElements.length} enabled</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleGenerateArVideo}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerated ? 'Re-Generate AR Video with Google Flow' : 'Create AR Video with Google Flow'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPreviewArVideo({
                  isGoogleFlowEnabled: true,
                  flowProjectId: flowProjectId,
                  arScenarioPrompt: customPrompt,
                  arElements: selectedElements,
                  arAvatar: selectedAvatar,
                  arMode: arMode
                });
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preview Google Flow AR Video in Fullscreen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 3D AR Inspector Preview (Beneath Creator) */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-400" />
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Google Flow AR Viewport Preview (Interactive 3D Simulation)
            </h5>
          </div>

          {/* Angle Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono px-2">Camera Angle:</span>
            {[
              { id: 'front', label: 'Front Bumper' },
              { id: 'engine', label: 'Engine Bay' },
              { id: 'side', label: 'Side Profile' },
              { id: 'full', label: 'Full Chassis' }
            ].map((angle) => (
              <button
                key={angle.id}
                type="button"
                onClick={() => setActiveAngle(angle.id as any)}
                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeAngle === angle.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {angle.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D AR Canvas Simulation */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 select-none">
          {/* AR HUD Overlay Top */}
          <div className="flex items-center justify-between z-20 text-[11px] font-mono">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/30 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>GOOGLE FLOW AR · WebXR 60FPS</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-slate-400">
              <span>Presenter: {selectedAvatar.split('(')[0]}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">Spatial Audio ON</span>
            </div>
          </div>

          {/* Interactive AR 3D Vehicle Hologram Canvas */}
          <div className="my-auto relative flex items-center justify-center w-full max-w-lg mx-auto z-10">
            {/* Holographic Wireframe Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

            {/* Stylized 3D Car Vector Wireframe */}
            <div className="relative w-72 sm:w-88 h-40 flex items-center justify-center">
              <svg 
                viewBox="0 0 400 200" 
                className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-500"
                style={{
                  transform: activeAngle === 'engine' 
                    ? 'scale(1.15) translateY(10px)' 
                    : activeAngle === 'side' 
                    ? 'scale(0.95) rotateY(25deg)' 
                    : activeAngle === 'full'
                    ? 'scale(0.85)'
                    : 'scale(1.05)'
                }}
              >
                {/* Car Silhouette Lines */}
                <path
                  d="M 50 140 L 70 90 L 130 85 L 180 40 L 260 40 L 320 85 L 360 95 L 370 140 L 340 140 A 25 25 0 0 1 290 140 L 130 140 A 25 25 0 0 1 80 140 Z"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {/* Wheels */}
                <circle cx="105" cy="140" r="22" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="105" cy="140" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="315" cy="140" r="22" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="315" cy="140" r="10" fill="none" stroke="#38bdf8" strokeWidth="2" />

                {/* Windshield & Windows */}
                <path d="M 185 45 L 255 45 L 245 85 L 140 85 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1.5" />
                <path d="M 260 45 L 310 85 L 260 85 Z" fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth="1.5" />
                {/* Headlights */}
                <polygon points="50,110 70,105 70,125 50,120" fill="#facc15" opacity="0.8" />
              </svg>

              {/* AR Hotspot 1: Front Bumper */}
              <button
                type="button"
                onClick={() => setSelectedHotspot('bumper')}
                className={`absolute left-3 top-20 p-1.5 rounded-full transition-transform cursor-pointer ${
                  selectedHotspot === 'bumper' ? 'scale-125 ring-4 ring-cyan-400/40 bg-cyan-500' : 'bg-blue-600 hover:scale-110'
                }`}
                title="Inspect Front Bumper in AR"
              >
                <Crosshair className="w-3.5 h-3.5 text-white" />
              </button>

              {/* AR Hotspot 2: Engine Bay & Sump */}
              <button
                type="button"
                onClick={() => setSelectedHotspot('engine')}
                className={`absolute left-28 top-16 p-1.5 rounded-full transition-transform cursor-pointer ${
                  selectedHotspot === 'engine' ? 'scale-125 ring-4 ring-amber-400/40 bg-amber-500' : 'bg-slate-700 hover:scale-110'
                }`}
                title="Inspect Engine & Consumables in AR"
              >
                <Sliders className="w-3.5 h-3.5 text-white" />
              </button>

              {/* AR Hotspot 3: Windshield Glass */}
              <button
                type="button"
                onClick={() => setSelectedHotspot('glass')}
                className={`absolute left-48 top-6 p-1.5 rounded-full transition-transform cursor-pointer ${
                  selectedHotspot === 'glass' ? 'scale-125 ring-4 ring-emerald-400/40 bg-emerald-500' : 'bg-slate-700 hover:scale-110'
                }`}
                title="Inspect Glass Depreciation in AR"
              >
                <Info className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* AR Hotspot Explainer Card Bottom */}
          <div className="z-20 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                  {selectedHotspot === 'bumper' 
                    ? 'AR Focus: Plastic Front Bumper (Zero Dep Add-on)' 
                    : selectedHotspot === 'engine' 
                    ? 'AR Focus: Engine Sump & Consumable Fluids' 
                    : 'AR Focus: Windshield Toughened Glass'}
                </span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-700 px-1.5 py-0.2 rounded text-cyan-300">
                  Interactive Node
                </span>
              </div>
              <p className="text-slate-300 mt-1 text-[11px] leading-relaxed max-w-xl">
                {selectedHotspot === 'bumper' && (
                  'Zero Depreciation eliminates the standard 50% IRDAI plastic parts deduction. Customer claim is settled at 100% replacement value (minus compulsory excess).'
                )}
                {selectedHotspot === 'engine' && (
                  'Engine oil, coolant, and nuts/bolts are classified as consumables. They are NOT covered under standard Zero Dep unless the separate Consumables Cover add-on is active.'
                )}
                {selectedHotspot === 'glass' && (
                  'Glass components have 0% depreciation deduction under standard motor policies regardless of whether Zero Dep is purchased.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="text-[10px] text-slate-400">Click hot-spots on 3D car to inspect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
