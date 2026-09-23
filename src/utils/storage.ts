import { LearningModule, LearnerProfile, LearnerAttempt, Badge, Certificate, RosterAssociate } from '../types';
import { 
  saveAttemptToCloud, 
  saveCertificateToCloud, 
  saveModuleToCloud, 
  fetchModulesFromCloud, 
  fetchAttemptsFromCloud, 
  fetchCertificatesFromCloud,
  batchSaveRosterToCloud
} from '../firebase';

export const BADGES: Badge[] = [
  {
    id: 'badge-1',
    tier: 1,
    name: 'Motor Claims Novice',
    minPoints: 0,
    color: 'from-blue-500 to-indigo-600',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Beginning the motor insurance advisory pathway with foundational claims knowledge.'
  },
  {
    id: 'badge-2',
    tier: 2,
    name: 'Policy Advisory Specialist',
    minPoints: 400,
    color: 'from-teal-500 to-emerald-600',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Mastered policy add-ons, NCB transitions, and primary customer objection handling.'
  },
  {
    id: 'badge-3',
    tier: 3,
    name: 'Motor Insurance Pro',
    minPoints: 900,
    color: 'from-violet-500 to-purple-600',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Accurate claim guidance, endorsement workflows, and high customer call satisfaction.'
  },
  {
    id: 'badge-4',
    tier: 4,
    name: 'Claims Ace Champion',
    minPoints: 1600,
    color: 'from-amber-500 to-orange-600',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Top-tier process fidelity across complex total loss, salvage, and zero-dep claim scenarios.'
  },
  {
    id: 'badge-5',
    tier: 5,
    name: 'Master Underwriter & Quality Star',
    minPoints: 2500,
    color: 'from-rose-500 to-pink-600',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Exemplary process accuracy, flawless call compliance, and elite training benchmark.'
  }
];

export function getBadgeByPoints(points: number): Badge {
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (points >= BADGES[i].minPoints) {
      return BADGES[i];
    }
  }
  return BADGES[0];
}

const STORAGE_KEYS = {
  MODULES: 'motor_insurance_modules_v1',
  ATTEMPTS: 'motor_insurance_attempts_v1',
  CERTIFICATES: 'motor_insurance_certificates_v2',
  ACTIVE_LEARNER: 'motor_insurance_active_learner_v1',
  TRAINER_AUTH: 'motor_insurance_trainer_auth_v1',
  ROSTER: 'motor_insurance_roster_v2',
};

export const SEED_ROSTER: RosterAssociate[] = [
  { employeeCode: 'PB-1042', employeeName: 'Rahul Sharma', teamLeader: 'Amit Kumar (TL)', process: 'Motor Inbound & Claims Advisory' },
  { employeeCode: 'PB-2180', employeeName: 'Priya Sundaram', teamLeader: 'Sneha Kapoor (TL)', process: 'Motor Renewal & Endorsements' },
  { employeeCode: 'PB-3055', employeeName: 'Vikram Malhotra', teamLeader: 'Vikas Chauhan (TL)', process: 'Commercial Vehicle & Fleet Claims' },
  { employeeCode: 'PB-4112', employeeName: 'Ananya Verma', teamLeader: 'Amit Kumar (TL)', process: 'Two-Wheeler Comprehensive Underwriting' },
  { employeeCode: 'PB-5501', employeeName: 'Arjun Mehta', teamLeader: 'Rohit Saxena (TL)', process: 'Motor Inbound & Claims Advisory' },
  { employeeCode: 'PB-5502', employeeName: 'Deepika Nair', teamLeader: 'Sneha Kapoor (TL)', process: 'Private Car Claims Escalations' },
  { employeeCode: 'PB-5503', employeeName: 'Karan Joshi', teamLeader: 'Vikas Chauhan (TL)', process: 'Motor Retention & Cross-Sell' },
  { employeeCode: 'PB-6020', employeeName: 'Sneha Patel', teamLeader: 'Rohit Saxena (TL)', process: 'Motor Inbound Advisory' },
  { employeeCode: 'PB-7789', employeeName: 'Amit Saxena', teamLeader: 'Amit Kumar (TL)', process: 'Motor Customer Support & Grievance' }
];

const SEED_MODULES: LearningModule[] = [
  {
    id: 'mod-1',
    title: 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
    category: 'Claims Advisory & Call Scripting',
    description: 'Critical process update for all motor insurance associates. Understand how to explain parts depreciation, salvage value, and why consumable covers must be paired with Zero Dep on customer calls.',
    dedicatedDate: '2026-09-23',
    trainerName: 'Suhail Taneja - Senior Manager Motor Sales & Service',
    trainerUsername: 'trainer',
    status: 'published',
    videoSource: 'built_in',
    videoUrl: 'sample-video-zero-dep',
    videoFileName: 'Zero_Dep_Claim_Process_Update_v2.mp4',
    videoDurationSeconds: 140, // 2 mins 20 seconds
    videoQuality: '720p',
    googleFlowConfig: {
      isGoogleFlowEnabled: true,
      flowProjectId: 'flow-pb-motor-ar-2026',
      flowProjectUrl: 'https://flow.google/project/pb-motor-ar-2026',
      arScenarioPrompt: 'Zero Dep vs Consumables 3D Exploded Engine & Bumper with Interactive Call Script',
      arElements: ['3D Car Mesh & Damage Hotspots', 'Holographic Claim Teleprompter', 'Interactive AR Checkpoints', 'Spatial 3D Audio'],
      arAvatar: 'Suhail Taneja (Senior Manager Motor Sales & Service)',
      arMode: 'full_ar',
      generatedAt: '2026-09-23T05:50:00.000Z'
    },
    callKeyTakeaways: [
      'Clarify that Zero Dep eliminates 50% depreciation deductions on plastic/rubber parts.',
      'Explain the difference between parts depreciation vs consumable items (oil, nuts, coolant).',
      'Inform policyholders of the annual claim limit (usually 2 claims/year unless unlimited add-on is active).',
      'Remind customer that compulsory deductibles (₹1,000 for cars ≤1500cc, ₹2,000 for >1500cc) still apply.'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Under standard comprehensive motor insurance without Zero Depreciation, what is the mandatory depreciation deduction on plastic, nylon, and rubber parts?',
        options: [
          '0% (Fully reimbursed by insurer)',
          '50% mandatory deduction as per IRDAI scale',
          '20% flat deduction',
          '30% deduction depending on vehicle age'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'IRDAI specifies 50% depreciation on rubber, nylon, and plastic parts under standard policies without Zero Dep.'
      },
      {
        id: 'q2',
        question: 'When a customer on a call asks if Zero Depreciation covers consumable parts (engine oil, lubricants, nuts, bolts, coolant), what is the correct guidance?',
        options: [
          'Yes, Zero Dep automatically covers all lubricants and mechanical fluids',
          'No, Zero Dep covers body parts depreciation; consumable items require the separate Consumables Cover add-on',
          'Consumables are strictly illegal to cover under any motor policy in India',
          'Only engine oil is covered, other fluids are always out of pocket'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Zero Dep covers depreciation on vehicle body parts. Consumables require the separate Consumables Add-On.'
      },
      {
        id: 'q3',
        question: 'What is the standard maximum vehicle age eligibility for Zero Depreciation add-on renewal across most general insurers?',
        options: [
          'Up to 15 years from registration date',
          'Up to 5 years (extendable to 7 years with select partner insurers)',
          'Only in the first 12 months from showroom delivery',
          'Zero Depreciation has no age restriction whatsoever'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Most Indian insurers allow Zero Dep up to 5 years of age; a few partner insurers allow up to 7 years upon inspection.'
      },
      {
        id: 'q4',
        question: 'If a policyholder calls inquiring about filing their third Zero-Dep claim in a single policy year, what step should the associate take?',
        options: [
          'Tell the customer claims are always unlimited regardless of insurer',
          'Check policy schedule for claim cap (standard policies cap Zero Dep to 2 instances/year unless unlimited cover was chosen)',
          'Inform the customer their entire motor policy is immediately terminated',
          'Tell the customer they must file an FIR before opening the app'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Zero Dep policies typically restrict claims to 2 per policy term unless an unlimited claims endorsement is active.'
      },
      {
        id: 'q5',
        question: 'In the event of a Constructive Total Loss (damage cost exceeds 75% of IDV), on what basis is the settlement calculated?',
        options: [
          'Current showroom on-road price of a brand new model',
          'Insured Declared Value (IDV) minus standard compulsory deductible',
          '50% of the initial purchase invoice value',
          'Depreciated scrap price calculated by weight'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Constructive Total Loss settlements are calculated based on the agreed IDV minus the compulsory policy deductible.'
      }
    ],
    createdAt: '2026-09-23T08:00:00Z',
    publishedAt: '2026-09-23T08:30:00Z'
  },
  {
    id: 'mod-2',
    title: 'NCB (No Claim Bonus) Retention & Transfer Protocol',
    category: 'Policy Renewal & Underwriting',
    description: 'Guidelines on managing customer queries regarding NCB retention certificate, transferring accumulated bonus from old vehicle to new car, and 90-day expiry rules.',
    dedicatedDate: '2026-09-22',
    trainerName: 'Senior Underwriting Trainer',
    trainerUsername: 'trainer',
    status: 'published',
    videoSource: 'built_in',
    videoUrl: 'sample-video-ncb',
    videoFileName: 'NCB_Transfer_Masterclass.mp4',
    videoDurationSeconds: 155, // 2 mins 35 seconds
    callKeyTakeaways: [
      'NCB belongs to the policyholder/driver, NOT to the vehicle.',
      'NCB Reserving Certificate is valid for up to 3 years from vehicle sale.',
      'Policy renewal must happen within 90 days of expiry to preserve accrued NCB.',
      'Maximum allowable NCB discount slab is 50% after 5 consecutive claim-free years.'
    ],
    questions: [
      {
        id: 'm2-q1',
        question: 'To whom does the No Claim Bonus (NCB) belong according to Indian insurance regulations?',
        options: [
          'To the vehicle itself and transfers automatically to any new buyer',
          'To the registered vehicle owner/insured person, not the vehicle',
          'To the financing bank or leasing company',
          'To the regional transport office (RTO)'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'NCB is earned by and belongs to the policyholder/owner, rewarding safe driving.'
      },
      {
        id: 'm2-q2',
        question: 'What is the grace period allowed after policy expiration during which a customer can renew without losing their accumulated NCB?',
        options: [
          '15 days',
          '90 days from the date of expiry',
          '365 days',
          'No grace period; NCB is forfeited the exact minute the policy expires'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Customers have up to 90 days post policy expiry to renew and retain their accumulated NCB percentage.'
      },
      {
        id: 'm2-q3',
        question: 'What is the maximum achievable No Claim Bonus (NCB) slab discount on the Own Damage (OD) premium?',
        options: [
          '20%',
          '35%',
          '50% (after 5 consecutive claim-free renewal years)',
          '75%'
        ],
        correctOptionIndex: 2,
        trainerExplanation: 'The maximum NCB slab under the Indian motor tariff is 50% after 5 consecutive claim-free years.'
      },
      {
        id: 'm2-q4',
        question: 'When a customer sells their car and plans to buy a new vehicle 6 months later, what document must the associate advise them to obtain?',
        options: [
          'RTO Pollution Under Control (PUC) slip',
          'NCB Reserving / Retention Certificate from the current insurer',
          'Police clearance certificate',
          'Written affidavit from the buyer'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'The NCB Retention Certificate allows the insured to preserve and apply their accrued NCB to a future vehicle within 3 years.'
      },
      {
        id: 'm2-q5',
        question: 'Does the NCB discount apply to the Third-Party (TP) liability premium component?',
        options: [
          'Yes, it applies equally to both OD and TP premiums',
          'No, NCB applies strictly to the Own Damage (OD) premium component only',
          'Only if the vehicle is commercial',
          'Only if opted with roadside assistance add-on'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'NCB discount applies exclusively to the Own Damage premium, never to the statutory Third-Party tariff.'
      }
    ],
    createdAt: '2026-09-22T09:00:00Z',
    publishedAt: '2026-09-22T09:15:00Z'
  },
  {
    id: 'mod-3',
    title: 'Third-Party Liability vs Comprehensive Insurance Mandates',
    category: 'Legal Mandates & Customer Advisory',
    description: 'Standard operating procedure for explaining mandatory Motor Vehicles Act compliance, Personal Accident coverage for owner-driver, and third-party property damages.',
    dedicatedDate: '2026-09-20',
    trainerName: 'Compliance & Process Trainer',
    trainerUsername: 'trainer',
    status: 'published',
    videoSource: 'built_in',
    videoUrl: 'sample-video-tp',
    videoFileName: 'TP_vs_Comprehensive_Overview.mp4',
    videoDurationSeconds: 130, // 2 mins 10 seconds
    callKeyTakeaways: [
      'Third-party insurance is legally mandatory under the Motor Vehicles Act 1988.',
      'Mandatory Compulsory Personal Accident (CPA) cover provides ₹15 Lakhs sum insured for owner-driver.',
      'Third-party property damage (TPPD) liability is capped at ₹7.5 Lakhs.',
      'Third-party bodily injury / death liability compensation is unlimited as awarded by the MACT court.'
    ],
    questions: [
      {
        id: 'm3-q1',
        question: 'What is the statutory sum insured for mandatory Compulsory Personal Accident (CPA) cover for the Owner-Driver?',
        options: [
          '₹1 Lakh',
          '₹5 Lakhs',
          '₹15 Lakhs',
          '₹50 Lakhs'
        ],
        correctOptionIndex: 2,
        trainerExplanation: 'As mandated by IRDAI, the compulsory PA cover for owner-drivers provides a sum insured of ₹15 Lakhs.'
      },
      {
        id: 'm3-q2',
        question: 'Under standard Motor Third-Party insurance, what is the maximum statutory coverage for Third-Party Property Damage (TPPD)?',
        options: [
          '₹1 Lakh',
          '₹7.5 Lakhs (with option to restrict to ₹6,000 for lower premium)',
          '₹25 Lakhs',
          'Unlimited'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Statutory third-party property damage liability is capped at ₹7.5 Lakhs under IRDAI standard guidelines.'
      },
      {
        id: 'm3-q3',
        question: 'If a customer asks what happens to third-party injury and death claims, who awards the final compensation amount?',
        options: [
          'Local police station',
          'Motor Accident Claims Tribunal (MACT) court, with unlimited compensation awardable',
          'Automobile manufacturing company',
          'Direct customer consensus'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'The Motor Accident Claims Tribunal (MACT) determines unlimited liability compensation for third-party injury or death.'
      },
      {
        id: 'm3-q4',
        question: 'Can a customer who already holds a standalone 24-hour Personal Accident policy of ₹15L or more waive the CPA cover?',
        options: [
          'No, CPA is compulsory on every single vehicle policy regardless of other policies',
          'Yes, by submitting proof of existing PA cover of at least ₹15 Lakhs or having multiple vehicle CPA',
          'Only if the vehicle is a 2-wheeler',
          'Only if the driver is older than 60 years'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Owner-drivers with existing standalone PA cover of at least ₹15 Lakhs or CPA on another vehicle can waive CPA.'
      },
      {
        id: 'm3-q5',
        question: 'Does a standalone Third-Party motor policy pay for any damages to the insured vehicle caused by flood or earthquake?',
        options: [
          'Yes, natural calamities are always covered under TP',
          'No, Third-Party insurance covers only liability to third parties; damage to the insured vehicle requires Own Damage (OD) cover',
          'Only if the flood level exceeds 2 feet',
          'Yes, up to 50% of the repair bill'
        ],
        correctOptionIndex: 1,
        trainerExplanation: 'Third-party policies never cover damage to the insured vehicle itself (Own Damage).'
      }
    ],
    createdAt: '2026-09-20T10:00:00Z',
    publishedAt: '2026-09-20T10:30:00Z'
  }
];

const SEED_ATTEMPTS: LearnerAttempt[] = [
  {
    id: 'att-1',
    moduleId: 'mod-1',
    moduleTitle: 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
    dedicatedDate: '2026-09-23',
    employeeCode: 'PB-1042',
    learnerName: 'Rahul Sharma',
    videoWatchedRatio: 1.0,
    videoCompleted: true,
    score: 5,
    totalQuestions: 5,
    scorePercentage: 100,
    pointsEarned: 500,
    completedAt: '2026-09-23T09:14:22Z',
    passed: true,
    certificateId: 'cert-1042-sep'
  },
  {
    id: 'att-2',
    moduleId: 'mod-1',
    moduleTitle: 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
    dedicatedDate: '2026-09-23',
    employeeCode: 'PB-2180',
    learnerName: 'Priya Sundaram',
    videoWatchedRatio: 1.0,
    videoCompleted: true,
    score: 4,
    totalQuestions: 5,
    scorePercentage: 80,
    pointsEarned: 400,
    completedAt: '2026-09-23T09:45:10Z',
    passed: true,
    certificateId: 'cert-2180-sep'
  },
  {
    id: 'att-3',
    moduleId: 'mod-2',
    moduleTitle: 'NCB (No Claim Bonus) Retention & Transfer Protocol',
    dedicatedDate: '2026-09-22',
    employeeCode: 'PB-3055',
    learnerName: 'Vikram Malhotra',
    videoWatchedRatio: 1.0,
    videoCompleted: true,
    score: 5,
    totalQuestions: 5,
    scorePercentage: 100,
    pointsEarned: 500,
    completedAt: '2026-09-22T11:20:05Z',
    passed: true,
    certificateId: 'cert-3055-sep'
  },
  {
    id: 'att-4',
    moduleId: 'mod-2',
    moduleTitle: 'NCB (No Claim Bonus) Retention & Transfer Protocol',
    dedicatedDate: '2026-09-22',
    employeeCode: 'PB-4112',
    learnerName: 'Ananya Verma',
    videoWatchedRatio: 1.0,
    videoCompleted: true,
    score: 4,
    totalQuestions: 5,
    scorePercentage: 80,
    pointsEarned: 400,
    completedAt: '2026-09-22T14:10:44Z',
    passed: true,
    certificateId: 'cert-4112-sep'
  },
  {
    id: 'att-5',
    moduleId: 'mod-3',
    moduleTitle: 'Third-Party Liability vs Comprehensive Insurance Mandates',
    dedicatedDate: '2026-09-20',
    employeeCode: 'PB-1042',
    learnerName: 'Rahul Sharma',
    videoWatchedRatio: 1.0,
    videoCompleted: true,
    score: 5,
    totalQuestions: 5,
    scorePercentage: 100,
    pointsEarned: 500,
    completedAt: '2026-09-20T16:22:15Z',
    passed: true,
    certificateId: 'cert-1042-tp'
  }
];

const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1042-sep',
    certificateNumber: 'CERT-2026-09-PB1042',
    employeeCode: 'PB-1042',
    learnerName: 'Rahul Sharma',
    moduleId: 'mod-1',
    moduleTitle: 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
    dedicatedDate: '2026-09-23',
    monthYear: 'September 2026',
    issueDate: '2026-09-23',
    score: '5 / 5 (100%)',
    pointsEarned: 500,
    badgeName: 'Motor Insurance Pro',
    trainerSignature: 'Suhail Taneja'
  },
  {
    id: 'cert-2180-sep',
    certificateNumber: 'CERT-2026-09-PB2180',
    employeeCode: 'PB-2180',
    learnerName: 'Priya Sundaram',
    moduleId: 'mod-1',
    moduleTitle: 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
    dedicatedDate: '2026-09-23',
    monthYear: 'September 2026',
    issueDate: '2026-09-23',
    score: '4 / 5 (80%)',
    pointsEarned: 400,
    badgeName: 'Policy Advisory Specialist',
    trainerSignature: 'Suhail Taneja'
  },
  {
    id: 'cert-3055-sep',
    certificateNumber: 'CERT-2026-09-PB3055',
    employeeCode: 'PB-3055',
    learnerName: 'Vikram Malhotra',
    moduleId: 'mod-2',
    moduleTitle: 'NCB (No Claim Bonus) Retention & Transfer Protocol',
    dedicatedDate: '2026-09-22',
    monthYear: 'September 2026',
    issueDate: '2026-09-22',
    score: '5 / 5 (100%)',
    pointsEarned: 500,
    badgeName: 'Policy Advisory Specialist',
    trainerSignature: 'Suhail Taneja'
  }
];

export function getModules(): LearningModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(SEED_MODULES));
      return SEED_MODULES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_MODULES;
  }
}

export function saveModules(modules: LearningModule[]): void {
  localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
  modules.forEach(m => {
    saveModuleToCloud(m).catch(e => console.warn('Cloud sync error for module', e));
  });
}

export function getAttempts(): LearnerAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(SEED_ATTEMPTS));
      return SEED_ATTEMPTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ATTEMPTS;
  }
}

export function recordAttempt(attempt: LearnerAttempt): void {
  const current = getAttempts();
  // replace existing attempt by same employee on same module or append
  const filtered = current.filter(a => !(a.employeeCode === attempt.employeeCode && a.moduleId === attempt.moduleId));
  filtered.unshift(attempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(filtered));
  // Sync to Firebase Cloud
  saveAttemptToCloud(attempt).catch(e => console.warn('Cloud sync error for attempt', e));
}

export function getCertificates(): Certificate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(SEED_CERTIFICATES));
      return SEED_CERTIFICATES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CERTIFICATES;
  }
}

export function saveCertificate(cert: Certificate): void {
  const current = getCertificates();
  const filtered = current.filter(c => c.id !== cert.id);
  filtered.unshift(cert);
  localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(filtered));
  // Sync to Firebase Cloud
  saveCertificateToCloud(cert).catch(e => console.warn('Cloud sync error for certificate', e));
}

export function getActiveLearner(): LearnerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_LEARNER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveLearner(learner: LearnerProfile | null): void {
  if (learner) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LEARNER, JSON.stringify(learner));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_LEARNER);
  }
}

export function getLearnerTotalPoints(employeeCode: string): number {
  const attempts = getAttempts().filter(a => a.employeeCode.toUpperCase() === employeeCode.toUpperCase());
  return attempts.reduce((acc, a) => acc + (a.pointsEarned || 0), 0);
}

export function getTrainerAuth(): boolean {
  return localStorage.getItem(STORAGE_KEYS.TRAINER_AUTH) === 'true';
}

export function setTrainerAuth(status: boolean): void {
  localStorage.setItem(STORAGE_KEYS.TRAINER_AUTH, status ? 'true' : 'false');
}

export function getRoster(): RosterAssociate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROSTER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(SEED_ROSTER));
      return SEED_ROSTER;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ROSTER;
  }
}

export function saveRoster(roster: RosterAssociate[]): void {
  localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(roster));
  batchSaveRosterToCloud(roster).catch(e => console.warn('Cloud sync error for roster', e));
}

/**
 * Live VLOOKUP against active associate roster
 * Matches case-insensitively, trims, handles prefixes (PB, EMP), numbers, and alphanumeric codes.
 */
export function lookupAssociate(empCode: string): RosterAssociate | null {
  if (!empCode || !empCode.trim()) return null;
  const rawCode = empCode.trim().toUpperCase();
  const digitsOnly = rawCode.replace(/[^0-9]/g, '');
  const alphanumeric = rawCode.replace(/[^A-Z0-9]/g, '');

  const roster = getRoster();
  if (!roster || roster.length === 0) return null;

  // 1. Exact match (case-insensitive, trimmed)
  const exact = roster.find(r => r.employeeCode.trim().toUpperCase() === rawCode);
  if (exact) return exact;

  // 2. Alphanumeric match (ignoring dashes, dots, spaces, underscores e.g. "PB1042" == "PB-1042")
  const alphaMatch = roster.find(r => {
    const rAlpha = r.employeeCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return rAlpha === alphanumeric;
  });
  if (alphaMatch) return alphaMatch;

  // 3. Prefix-independent match:
  // e.g. user typed "1042" and roster has "PB-1042" or "EMP1042", OR user typed "PB-1042" and roster has "1042"
  const strippedUser = alphanumeric.replace(/^(PB|EMP|STAFF|USER|AGENT)/, '');
  const prefixMatch = roster.find(r => {
    const rAlpha = r.employeeCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const strippedRoster = rAlpha.replace(/^(PB|EMP|STAFF|USER|AGENT)/, '');
    if (strippedUser && strippedRoster && strippedUser === strippedRoster) {
      return true;
    }
    return false;
  });
  if (prefixMatch) return prefixMatch;

  // 4. Digits match if both have 2+ digits
  if (digitsOnly.length >= 2) {
    const digitMatch = roster.find(r => {
      const rDigits = r.employeeCode.replace(/[^0-9]/g, '');
      return rDigits.length >= 2 && rDigits === digitsOnly;
    });
    if (digitMatch) return digitMatch;
  }

  // 5. Name match fallback (in case associate typed their name in the e-code box)
  const nameMatch = roster.find(r => {
    const rName = r.employeeName.trim().toUpperCase();
    return rName === rawCode || rName.replace(/[^A-Z0-9]/g, '') === alphanumeric;
  });
  if (nameMatch) return nameMatch;

  return null;
}

