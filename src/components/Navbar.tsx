import React from 'react';
import { Share2, Shield, User, Award, SlidersHorizontal, Cloud } from 'lucide-react';
import { PolicybazaarLogo } from './PolicybazaarLogo';

interface NavbarProps {
  currentTab: 'learner' | 'certificates' | 'trainer';
  onSelectTab: (tab: 'learner' | 'certificates' | 'trainer') => void;
  onOpenShareModal: () => void;
  isTrainerAuth: boolean;
  activeLearnerName?: string;
  isCloudSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenShareModal,
  isTrainerAuth,
  activeLearnerName,
  isCloudSynced
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Policybazaar Logo & App Title */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('learner');
            }}
            className="flex items-center gap-3 transition-opacity hover:opacity-95"
          >
            <PolicybazaarLogo size="sm" showTagline={true} />
            <div className="hidden xl:block h-6 w-px bg-slate-200"></div>
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-1 rounded">
              Motor Insurance Academy
            </span>
          </a>

          {isCloudSynced && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" title="All module data and attempts are live in Firebase Firestore cloud">
              <Cloud className="w-3 h-3 text-emerald-600" />
              <span>Firebase Cloud</span>
            </span>
          )}
        </div>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('learner')}
            className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
              currentTab === 'learner'
                ? 'text-blue-700 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Learner Modules
          </button>

          <button
            onClick={() => onSelectTab('certificates')}
            className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
              currentTab === 'certificates'
                ? 'text-blue-700 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Monthly Certificates
          </button>

          <button
            onClick={() => onSelectTab('trainer')}
            className={`transition-colors whitespace-nowrap cursor-pointer py-1 flex items-center gap-1.5 ${
              currentTab === 'trainer'
                ? 'text-blue-700 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Trainer Hub</span>
            {isTrainerAuth && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Shareable Link Button */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Get shareable link & mobile QR"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Share Link</span>
          </button>

          {/* Quick Portal Switcher */}
          <button
            onClick={() => onSelectTab(currentTab === 'trainer' ? 'learner' : 'trainer')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'trainer'
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
            }`}
          >
            {currentTab === 'trainer' ? 'Learner View' : 'Trainer Access'}
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/90 px-2 py-2 text-xs font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('learner')}
          className={`px-3 py-1 rounded-md transition-colors ${currentTab === 'learner' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700'}`}
        >
          Modules
        </button>
        <button
          onClick={() => onSelectTab('certificates')}
          className={`px-3 py-1 rounded-md transition-colors ${currentTab === 'certificates' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700'}`}
        >
          Certificates
        </button>
        <button
          onClick={() => onSelectTab('trainer')}
          className={`px-3 py-1 rounded-md transition-colors ${currentTab === 'trainer' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700'}`}
        >
          Trainer Hub
        </button>
      </div>
    </header>
  );
};
