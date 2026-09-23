import React, { useState, useEffect } from 'react';
import { 
  LearningModule, 
  LearnerProfile, 
  LearnerAttempt, 
  Certificate 
} from './types';
import { 
  getModules, 
  saveModules, 
  getAttempts, 
  getCertificates, 
  getActiveLearner, 
  saveActiveLearner, 
  getTrainerAuth, 
  setTrainerAuth,
  getRoster,
  saveRoster
} from './utils/storage';
import { 
  fetchModulesFromCloud, 
  fetchAttemptsFromCloud, 
  fetchCertificatesFromCloud,
  fetchRosterFromCloud,
  saveModuleToCloud,
  saveAttemptToCloud,
  saveCertificateToCloud,
  batchSaveRosterToCloud
} from './firebase';
import { Navbar } from './components/Navbar';
import { LearnerPortal } from './components/LearnerPortal';
import { TrainerPortal } from './components/TrainerPortal';
import { CertificateView } from './components/CertificateView';
import { ShareModal } from './components/ShareModal';
import { heroImage } from './assets/images';
import { ShieldCheck, PhoneCall, Award, Users, CheckCircle2, Cloud } from 'lucide-react';

export default function App() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [attempts, setAttempts] = useState<LearnerAttempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeLearner, setActiveLearner] = useState<LearnerProfile | null>(null);
  const [isTrainerAuth, setIsTrainerAuthState] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Tab navigation
  const [currentTab, setCurrentTab] = useState<'learner' | 'certificates' | 'trainer'>('learner');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [urlModuleId, setUrlModuleId] = useState<string | null>(null);

  // Load storage state & handle URL params on mount
  useEffect(() => {
    const loadedModules = getModules();
    const loadedAttempts = getAttempts();
    const loadedCertificates = getCertificates();
    const loadedLearner = getActiveLearner();
    const trainerAuth = getTrainerAuth();

    setModules(loadedModules);
    setAttempts(loadedAttempts);
    setCertificates(loadedCertificates);
    setActiveLearner(loadedLearner);
    setIsTrainerAuthState(trainerAuth);

    // Sync with Firebase Firestore in cloud
    async function syncCloud() {
      try {
        const cloudMods = await fetchModulesFromCloud();
        if (cloudMods && cloudMods.length > 0) {
          setModules(cloudMods);
          localStorage.setItem('miml_modules', JSON.stringify(cloudMods));
        } else {
          // Cloud empty: upload initial seed modules to cloud
          loadedModules.forEach(m => saveModuleToCloud(m));
        }

        const cloudAttempts = await fetchAttemptsFromCloud();
        if (cloudAttempts && cloudAttempts.length > 0) {
          setAttempts(cloudAttempts);
          localStorage.setItem('miml_attempts', JSON.stringify(cloudAttempts));
        } else {
          // Upload initial seed attempts to cloud
          loadedAttempts.forEach(a => saveAttemptToCloud(a));
        }

        const cloudCerts = await fetchCertificatesFromCloud();
        if (cloudCerts && cloudCerts.length > 0) {
          setCertificates(cloudCerts);
          localStorage.setItem('miml_certificates', JSON.stringify(cloudCerts));
        } else {
          // Upload initial seed certificates to cloud
          loadedCertificates.forEach(c => saveCertificateToCloud(c));
        }

        const cloudRoster = await fetchRosterFromCloud();
        if (cloudRoster && cloudRoster.length > 0) {
          localStorage.setItem('motor_insurance_roster_v1', JSON.stringify(cloudRoster));
        } else {
          // Upload seed roster to cloud
          const localRoster = getRoster();
          batchSaveRosterToCloud(localRoster);
        }

        setIsCloudSynced(true);
      } catch (err) {
        console.warn('Firebase cloud sync note:', err);
      }
    }
    syncCloud();

    // URL params handling: ?role=trainer, ?role=learner, ?module=mod-1
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const moduleParam = params.get('module');
      const empCodeParam = params.get('empCode');
      const nameParam = params.get('name');

      if (moduleParam) {
        setUrlModuleId(moduleParam);
      }

      if (roleParam === 'trainer') {
        setCurrentTab('trainer');
      } else if (roleParam === 'certificates') {
        setCurrentTab('certificates');
      } else {
        setCurrentTab('learner');
      }

      if (empCodeParam && nameParam && !loadedLearner) {
        const autoLearner: LearnerProfile = {
          employeeCode: empCodeParam.toUpperCase(),
          name: nameParam,
          department: 'Motor Inbound Advisory',
          totalPoints: 0,
          currentBadgeId: 'badge-1'
        };
        setActiveLearner(autoLearner);
        saveActiveLearner(autoLearner);
      }
    } catch (e) {
      console.error('Error parsing URL parameters', e);
    }
  }, []);

  const refreshAllData = () => {
    setModules(getModules());
    setAttempts(getAttempts());
    setCertificates(getCertificates());
  };

  const handleLoginLearner = (profile: LearnerProfile) => {
    setActiveLearner(profile);
    saveActiveLearner(profile);
  };

  const handleLogoutLearner = () => {
    setActiveLearner(null);
    saveActiveLearner(null);
  };

  const handleTrainerLogin = () => {
    setIsTrainerAuthState(true);
    setTrainerAuth(true);
  };

  const handleTrainerLogout = () => {
    setIsTrainerAuthState(false);
    setTrainerAuth(false);
    setCurrentTab('learner');
  };

  const handleSaveModule = (newModule: LearningModule) => {
    const current = getModules();
    const index = current.findIndex(m => m.id === newModule.id);
    let updated: LearningModule[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = newModule;
    } else {
      updated = [newModule, ...current];
    }
    saveModules(updated);
    setModules(updated);
  };

  const handleDeleteModule = (moduleId: string) => {
    const current = getModules();
    const updated = current.filter(m => m.id !== moduleId);
    saveModules(updated);
    setModules(updated);
  };

  const handleTogglePublish = (moduleId: string) => {
    const current = getModules();
    const updated = current.map(m => {
      if (m.id === moduleId) {
        const nextStatus = m.status === 'published' ? 'draft' : 'published';
        return {
          ...m,
          status: nextStatus as 'published' | 'draft',
          publishedAt: nextStatus === 'published' ? new Date().toISOString() : m.publishedAt
        };
      }
      return m;
    });
    saveModules(updated);
    setModules(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isTrainerAuth={isTrainerAuth}
        activeLearnerName={activeLearner?.name}
        isCloudSynced={isCloudSynced}
      />

      {/* Hero Welcome Ribbon for Learner Portal */}
      {currentTab === 'learner' && (
        <section className="relative overflow-hidden bg-slate-900 text-white border-b border-slate-800">
          <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity">
            <img
              src={heroImage}
              alt="Motor Insurance Claims Advisory Background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-950/80"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Call Center Process Excellence · Motor Insurance Advisory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                Motor Insurance Learning Module
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Watch mandatory trainer updates, master Zero Dep & NCB call protocols, and complete the 5-question evaluation to certify your monthly badge.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  <span>Call Script Aligned</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Video-Gated Assessment</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Monthly Official Certificates</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {currentTab === 'learner' && (
          <LearnerPortal
            modules={modules}
            attempts={attempts}
            certificates={certificates}
            activeLearner={activeLearner}
            onLoginLearner={handleLoginLearner}
            onLogoutLearner={handleLogoutLearner}
            onRefreshData={refreshAllData}
            onNavigateToCertificates={() => setCurrentTab('certificates')}
            initialModuleId={urlModuleId}
          />
        )}

        {currentTab === 'certificates' && (
          <CertificateView
            certificates={certificates}
            employeeCode={activeLearner?.employeeCode || 'PB-1042'}
            learnerName={activeLearner?.name || 'Rahul Sharma'}
          />
        )}

        {currentTab === 'trainer' && (
          <TrainerPortal
            modules={modules}
            attempts={attempts}
            isAuthenticated={isTrainerAuth}
            onLogin={handleTrainerLogin}
            onLogout={handleTrainerLogout}
            onSaveModule={handleSaveModule}
            onDeleteModule={handleDeleteModule}
            onTogglePublish={handleTogglePublish}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Motor Insurance Learning Module · Process Training Portal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Free-to-Use Training Architecture</span>
            <span>·</span>
            <span>Zero Depreciation & Claims Standards</span>
            <span>·</span>
            <span>Policybazaar Quality Team</span>
          </div>
        </div>
      </footer>

      {/* Shareable Link Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        moduleId={modules[0]?.id}
        moduleTitle={modules[0]?.title}
      />
    </div>
  );
}
