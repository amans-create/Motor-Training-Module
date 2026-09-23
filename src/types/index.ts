export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number; // 0, 1, 2, 3
  trainerExplanation: string; // Confidential trainer notes
}

export interface LearningModule {
  id: string;
  title: string;
  category: string;
  description: string;
  dedicatedDate: string; // YYYY-MM-DD
  trainerName: string;
  trainerUsername: string;
  status: 'published' | 'draft';
  videoSource: 'upload' | 'built_in' | 'url';
  videoUrl: string;
  videoFileName?: string;
  videoDurationSeconds: number; // typically 120-180s (2-3 min)
  callKeyTakeaways: string[];
  questions: Question[]; // Exactly 5 MCQ questions
  createdAt: string;
  publishedAt?: string;
}

export interface LearnerProfile {
  employeeCode: string;
  name: string;
  department: string;
  totalPoints: number;
  currentBadgeId: string;
}

export interface LearnerAttempt {
  id: string;
  moduleId: string;
  moduleTitle: string;
  dedicatedDate: string; // YYYY-MM-DD
  employeeCode: string;
  learnerName: string;
  videoWatchedRatio: number; // 0 to 1 (1.0 = 100%)
  videoCompleted: boolean;
  score: number; // out of 5
  totalQuestions: number; // 5
  scorePercentage: number;
  pointsEarned: number;
  completedAt: string;
  passed: boolean;
  certificateId?: string;
}

export interface Badge {
  id: string;
  name: string;
  tier: number;
  minPoints: number;
  color: string;
  badgeStyle: string;
  description: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  employeeCode: string;
  learnerName: string;
  moduleId: string;
  moduleTitle: string;
  dedicatedDate: string;
  monthYear: string; // e.g. "September 2026"
  issueDate: string;
  score: string;
  pointsEarned: number;
  badgeName: string;
  trainerSignature: string;
}

export interface RosterAssociate {
  employeeCode: string; // e.g. "PB-1042"
  employeeName: string; // e.g. "Rahul Sharma"
  process: string;      // e.g. "Motor Inbound & Claims Advisory"
  updatedAt?: string;
}
