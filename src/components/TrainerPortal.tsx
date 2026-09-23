import React, { useState, useRef } from 'react';
import { LearningModule, LearnerAttempt, Question } from '../types';
import { storeVideoBlob } from '../utils/indexedDb';
import { 
  Lock, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Upload, 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  FileSpreadsheet, 
  Video, 
  HelpCircle,
  Sparkles,
  Cloud,
  FileUp,
  DownloadCloud,
  Users,
  Play,
  Check
} from 'lucide-react';
import { 
  importAttemptsFromExcel, 
  importRosterFromExcel,
  exportAttemptsToExcel, 
  downloadSampleExcelTemplate,
  downloadSampleRosterTemplate,
  ImportResult 
} from '../utils/excelService';
import { getRoster, lookupAssociate } from '../utils/storage';
import { RosterAssociate } from '../types';
import { VideoPreviewModal } from './VideoPreviewModal';

interface TrainerPortalProps {
  modules: LearningModule[];
  attempts: LearnerAttempt[];
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSaveModule: (module: LearningModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onTogglePublish: (moduleId: string) => void;
  onRefreshData?: () => void;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({
  modules,
  attempts,
  isAuthenticated,
  onLogin,
  onLogout,
  onSaveModule,
  onDeleteModule,
  onTogglePublish,
  onRefreshData
}) => {
  // Login Form States
  const [username, setUsername] = useState<string>('trainer');
  const [password, setPassword] = useState<string>('trainer123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab: Create, Manage, Raw Data, or Roster Upload (VLOOKUP source)
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'raw_data' | 'roster_upload'>('create');

  // Filter for Raw Data Export
  const [filterDate, setFilterDate] = useState<string>('2026-09-23');
  const [filterModuleId, setFilterModuleId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Module Creator / Editor State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [moduleCategory, setModuleCategory] = useState<string>('Motor Claim Advisory & Call Scripting');
  const [moduleDescription, setModuleDescription] = useState<string>('');
  const [dedicatedDate, setDedicatedDate] = useState<string>('2026-09-23');
  const [trainerName, setTrainerName] = useState<string>('Senior Motor Process Trainer');
  const [takeawayInputs, setTakeawayInputs] = useState<string[]>([
    'Clearly distinguish parts depreciation from consumable fluids.',
    'Inform policyholders of the 2-claim yearly limit on Zero Dep.',
    'Always quote the mandatory deductible before opening claim.'
  ]);

  // Video Upload State
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'built_in'>('built_in');
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoDuration, setUploadedVideoDuration] = useState<number>(140);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [videoUploadKey, setVideoUploadKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video Preview Modal State
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState<boolean>(false);
  const [previewVideoConfig, setPreviewVideoConfig] = useState<{
    source: 'upload' | 'built_in' | 'url';
    file?: File | null;
    url?: string;
    title: string;
  }>({
    source: 'built_in',
    file: null,
    url: 'sample-video-zero-dep',
    title: 'Process Training Video'
  });

  // Excel Import / Export (Raw Quiz Results) State
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false);
  const [importResultNotice, setImportResultNotice] = useState<ImportResult | null>(null);

  // Active Associates Master Roster (VLOOKUP Source) State
  const rosterFileInputRef = useRef<HTMLInputElement | null>(null);
  const [rosterList, setRosterList] = useState<RosterAssociate[]>(getRoster());
  const [isImportingRoster, setIsImportingRoster] = useState<boolean>(false);
  const [rosterImportNotice, setRosterImportNotice] = useState<ImportResult | null>(null);
  const [rosterSearchQuery, setRosterSearchQuery] = useState<string>('');
  const [testECode, setTestECode] = useState<string>('PB-1042');
  const [testLookupResult, setTestLookupResult] = useState<RosterAssociate | null>(lookupAssociate('PB-1042'));

  // 5 MCQ Questions State
  const defaultQuestions: Question[] = [
    {
      id: 'q1',
      question: 'What is the depreciation deduction for plastic parts under a standard policy without Zero Dep?',
      options: ['0% covered in full', '50% mandatory IRDAI deduction', '25% deduction', '10% deduction'],
      correctOptionIndex: 1,
      trainerExplanation: 'IRDAI specifies 50% deduction on plastic, nylon, and rubber parts under standard comprehensive cover.'
    },
    {
      id: 'q2',
      question: 'Are consumable items (engine oil, lubricants, coolant) covered by Zero Depreciation alone?',
      options: [
        'Yes, covered automatically with zero dep',
        'No, Zero Dep covers body parts depreciation; Consumables cover is required separately',
        'Only brake fluid is covered',
        'Insurers never cover consumables under any add-on'
      ],
      correctOptionIndex: 1,
      trainerExplanation: 'Consumables require the separate Consumable Cover add-on.'
    },
    {
      id: 'q3',
      question: 'What is the standard maximum vehicle age for Zero Depreciation renewal?',
      options: ['Up to 15 years', 'Up to 5 years (extendable to 7 years with select insurers)', '1 year only', 'No vehicle age limit'],
      correctOptionIndex: 1,
      trainerExplanation: 'Standard eligibility is up to 5 years (some select partner insurers allow 7 years).'
    },
    {
      id: 'q4',
      question: 'How many Zero Depreciation claims are typically permitted in a policy year without unlimited endorsement?',
      options: ['Unlimited always', 'Standard cap of 2 claims per year', 'Only 1 claim ever', '5 claims per quarter'],
      correctOptionIndex: 1,
      trainerExplanation: 'Most Indian motor insurers cap Zero Dep claims at 2 per policy year unless unlimited is selected.'
    },
    {
      id: 'q5',
      question: 'What is the compensation basis in a Constructive Total Loss (CTL) situation?',
      options: ['Showroom on-road price', 'Insured Declared Value (IDV) minus compulsory deductible', '50% invoice value', 'Weight of scrap metal'],
      correctOptionIndex: 1,
      trainerExplanation: 'Settlements for CTL are made on agreed IDV minus the standard deductible.'
    }
  ];

  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [formFeedback, setFormFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle Trainer Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'trainer' && password.trim() === 'trainer123') {
      onLogin();
      setLoginError(null);
    } else {
      setLoginError('Invalid trainer credentials. (Default demo: trainer / trainer123)');
    }
  };

  // Handle Video File Selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedVideoFile(file);
    setVideoWarning(null);

    // Calculate duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      const durationSecs = Math.round(tempVideo.duration);
      setUploadedVideoDuration(durationSecs);

      // 2-3 minute recommendation check
      if (durationSecs > 180) {
        setVideoWarning(`Video is ${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s. Recommended process update video length is 2-3 minutes for optimal associate recall.`);
      } else {
        setVideoWarning(null);
      }
    };
  };

  // Handle Question Change
  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], question: text };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options] as [string, string, string, string];
      opts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctOptionIndex: optIndex };
      return copy;
    });
  };

  const handleExplanationChange = (qIndex: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], trainerExplanation: text };
      return copy;
    });
  };

  // Reset form
  const handleResetForm = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleCategory('Motor Claim Advisory & Call Scripting');
    setModuleDescription('');
    setDedicatedDate('2026-09-23');
    setQuestions(defaultQuestions);
    setUploadedVideoFile(null);
    setVideoSourceType('built_in');
    setVideoWarning(null);
  };

  // Edit existing module
  const handleStartEdit = (mod: LearningModule) => {
    setEditingModuleId(mod.id);
    setModuleTitle(mod.title);
    setModuleCategory(mod.category);
    setModuleDescription(mod.description);
    setDedicatedDate(mod.dedicatedDate);
    setTrainerName(mod.trainerName);
    setTakeawayInputs(mod.callKeyTakeaways || []);
    setQuestions(mod.questions);
    setVideoSourceType(mod.videoSource === 'upload' ? 'upload' : 'built_in');
    setUploadedVideoDuration(mod.videoDurationSeconds);
    setActiveTab('create');
  };

  // Save / Publish
  const handleSaveModuleAction = async (status: 'published' | 'draft') => {
    if (!moduleTitle.trim()) {
      setFormFeedback({ message: 'Please enter a module title.', type: 'error' });
      return;
    }
    if (!dedicatedDate) {
      setFormFeedback({ message: 'Please select a dedicated date for this quiz.', type: 'error' });
      return;
    }
    // Verify 5 questions
    if (questions.length !== 5) {
      setFormFeedback({ message: 'Every learning module must contain exactly 5 MCQ questions.', type: 'error' });
      return;
    }

    let finalVideoUrl = 'sample-video-zero-dep';
    let finalVideoFileName = 'Process_Call_Update.mp4';

    // If trainer uploaded a new file, store into IndexedDB
    if (videoSourceType === 'upload' && uploadedVideoFile) {
      const vidKey = `vid-${Date.now()}`;
      await storeVideoBlob(vidKey, uploadedVideoFile);
      finalVideoUrl = `indexeddb:${vidKey}`;
      finalVideoFileName = uploadedVideoFile.name;
    }

    const moduleId = editingModuleId || `mod-${Date.now()}`;
    const newModule: LearningModule = {
      id: moduleId,
      title: moduleTitle.trim(),
      category: moduleCategory.trim(),
      description: moduleDescription.trim() || 'Daily process update for motor insurance associates.',
      dedicatedDate,
      trainerName: trainerName.trim() || 'Process Trainer Lead',
      trainerUsername: 'trainer',
      status,
      videoSource: videoSourceType,
      videoUrl: finalVideoUrl,
      videoFileName: finalVideoFileName,
      videoDurationSeconds: uploadedVideoDuration || 140,
      callKeyTakeaways: takeawayInputs.filter(t => t.trim().length > 0),
      questions,
      createdAt: new Date().toISOString(),
      publishedAt: status === 'published' ? new Date().toISOString() : undefined
    };

    onSaveModule(newModule);
    setFormFeedback({
      message: status === 'published'
        ? 'Module successfully published and now active for learners!'
        : 'Module draft saved successfully.',
      type: 'success'
    });

    handleResetForm();
    setActiveTab('manage');
  };

  // Download Raw Data as CSV
  const handleExportCSV = () => {
    let dataset = [...attempts];

    // Filter by date if not 'all'
    if (filterDate) {
      dataset = dataset.filter(a => a.dedicatedDate === filterDate);
    }
    // Filter by module if not 'all'
    if (filterModuleId !== 'all') {
      dataset = dataset.filter(a => a.moduleId === filterModuleId);
    }

    if (dataset.length === 0) {
      alert(`No learner records found for Date: ${filterDate}`);
      return;
    }

    // CSV Headers
    const headers = [
      'Employee Code',
      'Associate Name',
      'Module ID',
      'Module Title',
      'Dedicated Date',
      'Video Watched %',
      'Quiz Score',
      'Total Questions',
      'Score %',
      'Points Earned',
      'Passed Status',
      'Completed Timestamp',
      'Certificate ID'
    ];

    const rows = dataset.map(a => [
      `"${a.employeeCode}"`,
      `"${a.learnerName}"`,
      `"${a.moduleId}"`,
      `"${a.moduleTitle.replace(/"/g, '""')}"`,
      `"${a.dedicatedDate}"`,
      `"${Math.round(a.videoWatchedRatio * 100)}%"`,
      `"${a.score}"`,
      `"${a.totalQuestions}"`,
      `"${a.scorePercentage}%"`,
      `"${a.pointsEarned}"`,
      `"${a.passed ? 'PASSED' : 'RE-ATTEMPT'}"`,
      `"${a.completedAt}"`,
      `"${a.certificateId || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Motor_Insurance_Learner_RawData_${filterDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Raw Data as Real Excel (.xlsx)
  const handleExportExcelFile = () => {
    let dataset = [...attempts];
    if (filterDate) {
      dataset = dataset.filter(a => a.dedicatedDate === filterDate);
    }
    if (filterModuleId !== 'all') {
      dataset = dataset.filter(a => a.moduleId === filterModuleId);
    }
    if (dataset.length === 0) {
      alert(`No learner records found for Date: ${filterDate}`);
      return;
    }
    exportAttemptsToExcel(dataset, `Motor_Insurance_Data_${filterDate || 'all'}`);
  };

  // Import Excel File to Firebase Firestore
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExcel(true);
    setImportResultNotice(null);

    const result = await importAttemptsFromExcel(file);
    setIsImportingExcel(false);
    setImportResultNotice(result);

    if (result.success) {
      setFormFeedback({
        message: `Successfully imported ${result.importedCount} associate records from Excel to Firebase!`,
        type: 'success'
      });
      if (onRefreshData) {
        onRefreshData();
      }
    } else {
      setFormFeedback({
        message: result.error || 'Failed to import Excel data.',
        type: 'error'
      });
    }

    // Reset input so same file can be re-selected if edited
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  // Import Active Associates Master Roster from Excel / XLS / Binary / CSV
  const handleRosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingRoster(true);
    setRosterImportNotice(null);

    const result = await importRosterFromExcel(file);
    setIsImportingRoster(false);
    setRosterImportNotice(result);

    if (result.success && result.roster) {
      setRosterList(result.roster);
      // Run test lookup with current test code
      setTestLookupResult(lookupAssociate(testECode));
      setFormFeedback({
        message: `Successfully loaded ${result.importedCount} active associates into master roster and synced to Firebase!`,
        type: 'success'
      });
      if (onRefreshData) {
        onRefreshData();
      }
    } else {
      setFormFeedback({
        message: result.error || 'Failed to parse associate roster from Excel file.',
        type: 'error'
      });
    }

    if (rosterFileInputRef.current) {
      rosterFileInputRef.current.value = '';
    }
  };

  // Test live VLOOKUP
  const handleTestLookupChange = (code: string) => {
    setTestECode(code);
    const res = lookupAssociate(code);
    setTestLookupResult(res);
  };

  // If Trainer is not authenticated, show secure login gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Trainer Access & Control</h2>
            <p className="text-xs text-slate-300 mt-1">
              Sign in with your trainer credentials to upload videos, create quizzes, and download raw associate records.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 md:p-8 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trainer Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="trainer"
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-colors cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Trainer Hub</span>
            </button>

            <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              <span>Default credentials: </span>
              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">trainer</code>
              <span> / </span>
              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">trainer123</code>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtered raw dataset
  const filteredAttempts = attempts.filter(a => {
    const matchDate = !filterDate || a.dedicatedDate === filterDate;
    const matchMod = filterModuleId === 'all' || a.moduleId === filterModuleId;
    const matchSearch = !searchTerm || 
      a.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.learnerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDate && matchMod && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Trainer Banner & Nav Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Process Trainer Management Hub
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Verified Trainer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Create video modules, publish 5-question quizzes with dedicated dates, and export raw associate test data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingModuleId ? 'Edit Learning Module' : 'Create Learning Module & 5-MCQ Quiz'}</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manage Modules ({modules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'raw_data'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Raw Data ({attempts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roster_upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'roster_upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Upload Active Associates Excel ({rosterList.length})</span>
          </button>
        </div>
      </div>

      {formFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          formFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {formFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{formFeedback.message}</span>
          </div>
          <button onClick={() => setFormFeedback(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* TAB 1: CREATE / EDIT MODULE */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {editingModuleId ? 'Edit Motor Insurance Module' : 'Create New Motor Insurance Learning Module'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure video updates (2-3 min), dedicated assignment date, and 5 mandatory MCQ questions.
            </p>
          </div>

          {/* Section 1: Module Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Process Update Information & Dedicated Date
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Zero Depreciation Add-on: Handling Customer Claims"
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dedicated Date Attached to Quiz *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dedicatedDate}
                    onChange={(e) => setDedicatedDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  This date links to the learner certificate and trainer raw data exports.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category / Process Track
                </label>
                <input
                  type="text"
                  value={moduleCategory}
                  onChange={(e) => setModuleCategory(e.target.value)}
                  placeholder="e.g. Motor Claim Advisory"
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trainer Authorized Name
                </label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="Senior Motor Process Trainer"
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Process Brief / Description for Associates
              </label>
              <textarea
                rows={2}
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                placeholder="Summarize the core update that associates must implement on customer calls..."
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Video Upload (2-3 min video option) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Training Video Configuration (Max 2-3 Minutes)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setVideoSourceType('built_in')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  videoSourceType === 'built_in'
                    ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Built-in Interactive Training Video
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Realistic 2m 20s simulated Motor Insurance customer claim call with synchronized scripts and checkpoints.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setVideoSourceType('upload')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  videoSourceType === 'upload'
                    ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
              >
                <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Upload Video File (2-3 Minutes MP4 / WebM)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Upload your recorded process video. Stored securely in browser storage.
                  </div>
                </div>
              </label>
            </div>

            {videoSourceType === 'upload' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  
                  {/* Video Preview Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewVideoConfig({
                        source: 'upload',
                        file: uploadedVideoFile,
                        url: videoUploadKey ? `indexeddb:${videoUploadKey}` : undefined,
                        title: moduleTitle || 'Uploaded Process Video'
                      });
                      setIsVideoPreviewOpen(true);
                    }}
                    disabled={!uploadedVideoFile && !videoUploadKey}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Preview Video</span>
                  </button>
                </div>

                {uploadedVideoFile && (
                  <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-medium truncate max-w-xs">{uploadedVideoFile.name}</span>
                    <span className="font-mono text-slate-500">
                      Duration: {Math.floor(uploadedVideoDuration / 60)}m {uploadedVideoDuration % 60}s
                    </span>
                  </div>
                )}

                {videoWarning && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{videoWarning}</span>
                  </div>
                )}
              </div>
            )}

            {videoSourceType === 'built_in' && (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <span className="text-xs text-blue-900 font-medium">
                  Built-in 2m 20s scenario simulation loaded (Depreciation vs Consumables Claim update).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewVideoConfig({
                      source: 'built_in',
                      file: null,
                      url: 'sample-video-zero-dep',
                      title: moduleTitle || 'Built-in Process Simulation'
                    });
                    setIsVideoPreviewOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Preview Video</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: 5 MCQ Questions Creator */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                3. Mandatory 5-Question MCQ Assessment (4 Options Each)
              </h4>
              <span className="text-xs text-slate-500 font-medium">Exactly 5 Questions</span>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                      Question {qIdx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500">Select the radio button next to the correct answer</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Question Text:
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      4 Options (Check the correct answer):
                    </label>
                    {q.options.map((optText, optIdx) => {
                      const isCorrect = q.correctOptionIndex === optIdx;
                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <span className="font-mono text-xs text-slate-500 w-4">
                            {['A', 'B', 'C', 'D'][optIdx]}.
                          </span>
                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className={`flex-1 text-xs rounded-lg p-2 border focus:outline-none focus:ring-2 ${
                              isCorrect
                                ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950 font-medium'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Trainer Explanation Notes (Confidential from learners) */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Trainer Explanation Notes (Kept confidential from learners):
                    </label>
                    <input
                      type="text"
                      value={q.trainerExplanation}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      placeholder="Why this is the correct IRDAI/process guidance..."
                      className="w-full text-[11px] bg-white border border-slate-200 rounded-lg p-2 text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Save and Publish Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => handleSaveModuleAction('draft')}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveModuleAction('published')}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Publish Module to Learners</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE MODULES */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Created Learning Modules
              </h3>
              <p className="text-xs text-slate-500">
                Review, toggle visibility, and update training modules.
              </p>
            </div>
            <button
              onClick={() => {
                handleResetForm();
                setActiveTab('create');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Module</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {modules.map((mod) => {
              const attemptCount = attempts.filter(a => a.moduleId === mod.id).length;
              return (
                <div key={mod.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        mod.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {mod.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Dedicated Date: {mod.dedicatedDate}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {Math.floor(mod.videoDurationSeconds / 60)}m {mod.videoDurationSeconds % 60}s video
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {mod.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {mod.description}
                    </p>
                    <div className="text-[11px] text-blue-600 font-medium mt-1">
                      {attemptCount} Associate Attempts Recorded
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setPreviewVideoConfig({
                          source: mod.videoSource,
                          file: null,
                          url: mod.videoUrl,
                          title: mod.title
                        });
                        setIsVideoPreviewOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      title="Watch Video Preview"
                    >
                      <Play className="w-3.5 h-3.5 fill-blue-600" />
                      <span>Preview Video</span>
                    </button>
                    <button
                      onClick={() => onTogglePublish(mod.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        mod.status === 'published'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {mod.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleStartEdit(mod)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Module"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${mod.title}"?`)) {
                          onDeleteModule(mod.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DOWNLOAD RAW DATA BY SPECIFIC DATE */}
      {activeTab === 'raw_data' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* Cloud Status & Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Associate Performance Records & Cloud Storage</span>
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firebase Firestore Synced</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Download raw data, import associate test scores directly from Excel (.xlsx/.xls/.csv), and sync to Firebase cloud.
              </p>
            </div>

            {/* Import / Export Action Group */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Hidden file input for Excel upload */}
              <input
                type="file"
                ref={excelInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileChange}
                className="hidden"
              />

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                disabled={isImportingExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Import Excel spreadsheet to Firebase"
              >
                <FileUp className="w-4 h-4 text-blue-600" />
                <span>{isImportingExcel ? 'Importing...' : 'Import Excel (.xlsx)'}</span>
              </button>

              {/* Download Excel Button */}
              <button
                type="button"
                onClick={handleExportExcelFile}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Download real Excel workbook"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Export Excel (.xlsx)</span>
              </button>

              {/* Download CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Download standard CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Excel Import Guidance & Template link banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Want to bulk upload associate results? Upload an Excel file with columns: <strong>Employee Code, Associate Name, Module Title, Date, Score</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline shrink-0 text-left sm:text-right cursor-pointer"
            >
              📥 Download Sample Excel Template
            </button>
          </div>

          {/* Import Result Notification */}
          {importResultNotice && importResultNotice.success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
              <span>
                ✅ Successfully parsed and saved <strong>{importResultNotice.importedCount}</strong> records to Firebase Firestore.
              </span>
              <button 
                onClick={() => setImportResultNotice(null)} 
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {/* Date Filter */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Filter by Specific Date:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Module Filter */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Module Filter:
              </label>
              <select
                value={filterModuleId}
                onChange={(e) => setFilterModuleId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Modules</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Associate Search */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Search Associate / Emp Code:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="PB-1042 or Name..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">Emp Code</th>
                  <th className="p-3">Associate Name</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Dedicated Date</th>
                  <th className="p-3">Video Watched</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Points</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No associate records match the selected date ({filterDate}) or filter.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-semibold text-blue-700">{att.employeeCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{att.learnerName}</td>
                      <td className="p-3 text-slate-600 max-w-[200px] truncate">{att.moduleTitle}</td>
                      <td className="p-3 font-mono text-slate-600">{att.dedicatedDate}</td>
                      <td className="p-3 font-mono text-emerald-600 font-semibold">
                        {Math.round(att.videoWatchedRatio * 100)}%
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 tabular-nums">
                        {att.score} / {att.totalQuestions} ({att.scorePercentage}%)
                      </td>
                      <td className="p-3 font-mono text-amber-600 font-bold tabular-nums">
                        +{att.pointsEarned}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {att.passed ? 'Passed' : 'Review'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400 font-mono">
                        {att.completedAt.replace('T', ' ').slice(0, 16)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredAttempts.length} of {attempts.length} total attempts</span>
            <span>Formatted for Excel / Google Sheets Raw Import</span>
          </div>
        </div>
      )}

      {/* TAB 4: UPLOAD ACTIVE ASSOCIATES EXCEL (VLOOKUP TABLE) */}
      {activeTab === 'roster_upload' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Active Associate Master Roster (VLOOKUP Table)</span>
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firebase Cloud Synced</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Upload your active employee master list in Excel (.xlsx, .xls, .xlsb binary, .csv). When any associate types their <strong>E-Code</strong> in the learner portal, their <strong>Full Name</strong> and <strong>Process</strong> are instantly auto-collated via real-time VLOOKUP.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Hidden file input */}
              <input
                type="file"
                ref={rosterFileInputRef}
                accept=".xlsx, .xls, .xlsb, .csv, .ods"
                onChange={handleRosterFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={downloadSampleRosterTemplate}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Roster Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => rosterFileInputRef.current?.click()}
                disabled={isImportingRoster}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                <span>{isImportingRoster ? 'Parsing...' : 'Upload Excel File (.xlsx / .xls / .xlsb)'}</span>
              </button>
            </div>
          </div>

          {/* Roster Import Notice */}
          {rosterImportNotice && (
            <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
              rosterImportNotice.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {rosterImportNotice.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {rosterImportNotice.success 
                    ? `Successfully imported and mapped ${rosterImportNotice.importedCount} active associates to Firebase Firestore.` 
                    : rosterImportNotice.error}
                </span>
              </div>
              <button 
                onClick={() => setRosterImportNotice(null)}
                className="text-slate-500 hover:text-slate-800 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Interactive Live VLOOKUP Test Sandbox */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live VLOOKUP Verification Sandbox
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Test how learner auto-collation behaves when an e-code is entered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Test Employee Code (E-Code):
                </label>
                <input
                  type="text"
                  value={testECode}
                  onChange={(e) => handleTestLookupChange(e.target.value)}
                  placeholder="e.g. PB-1042 or 1042"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  VLOOKUP Result Auto-Collation:
                </label>
                {testLookupResult ? (
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    <span className="font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded font-mono">
                      {testLookupResult.employeeCode}
                    </span>
                    <span className="font-semibold text-slate-900">
                      Name: {testLookupResult.employeeName}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">
                      Process: <strong>{testLookupResult.process}</strong>
                    </span>
                    <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Active Match
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                    No active associate found for "{testECode}". Try uploading an Excel file with this E-Code.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Associates Roster Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Active Roster Directory ({rosterList.length} Associates)
                </h4>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">Source of truth for learner portal</span>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rosterSearchQuery}
                  onChange={(e) => setRosterSearchQuery(e.target.value)}
                  placeholder="Filter by E-Code, Name, or Process..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">E-Code</th>
                    <th className="p-3">Associate Full Name</th>
                    <th className="p-3">Process / Department</th>
                    <th className="p-3">Cloud Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterList
                    .filter(item => {
                      if (!rosterSearchQuery) return true;
                      const q = rosterSearchQuery.toLowerCase();
                      return (
                        item.employeeCode.toLowerCase().includes(q) ||
                        item.employeeName.toLowerCase().includes(q) ||
                        item.process.toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => (
                      <tr key={item.employeeCode} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700">{item.employeeCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.employeeName}</td>
                        <td className="p-3 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                            {item.process}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Synced</span>
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTestECode(item.employeeCode);
                              handleTestLookupChange(item.employeeCode);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                          >
                            Test VLOOKUP
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={isVideoPreviewOpen}
        onClose={() => setIsVideoPreviewOpen(false)}
        videoSourceType={previewVideoConfig.source}
        videoFile={previewVideoConfig.file}
        videoUrl={previewVideoConfig.url}
        moduleTitle={previewVideoConfig.title}
      />
    </div>
  );
};
