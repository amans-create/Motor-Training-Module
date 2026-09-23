import * as XLSX from 'xlsx';
import { LearnerAttempt, RosterAssociate } from '../types';
import { batchSaveAttemptsToCloud, batchSaveRosterToCloud } from '../firebase';
import { recordAttempt, saveRoster, lookupAssociate, getModules } from './storage';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  attempts?: LearnerAttempt[];
  roster?: RosterAssociate[];
  error?: string;
  sampleRows?: Array<Record<string, unknown>>;
}

/**
 * Robust date parser for Excel inputs (handles JS Dates, Excel serial numbers, and common string formats)
 */
function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If XLSX parsed it as a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // If number (Excel serial date number, e.g. 45558)
  if (typeof val === 'number') {
    // Excel epoch begins Dec 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();

  // If format is already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // If MM/DD/YYYY
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Robust score parser (handles 5, 4, "5/5", "4 out of 5", "80%", "100%", etc.)
 */
function parseExcelScore(val: unknown): { score: number; percentage: number; points: number } {
  if (val === undefined || val === null || val === '') {
    return { score: 4, percentage: 80, points: 400 };
  }

  const str = String(val).trim();

  // If "80%" or "100%"
  if (str.includes('%')) {
    const pct = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(pct)) {
      const score = Math.round((pct / 100) * 5);
      return { score, percentage: pct, points: score * 100 };
    }
  }

  // If "4/5" or "4 / 5"
  if (str.includes('/')) {
    const parts = str.split('/');
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]) || 5;
    if (!isNaN(numerator) && denominator > 0) {
      const pct = Math.round((numerator / denominator) * 100);
      const score = Math.round((numerator / denominator) * 5);
      return { score: Math.min(5, Math.max(0, score)), percentage: pct, points: score * 100 };
    }
  }

  // Plain number
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    // If entered as percentage without % sign e.g. 80 or 100
    if (num > 5 && num <= 100) {
      const score = Math.round((num / 100) * 5);
      return { score, percentage: Math.round(num), points: score * 100 };
    }
    const score = Math.min(5, Math.max(0, Math.round(num)));
    return { score, percentage: Math.round((score / 5) * 100), points: score * 100 };
  }

  return { score: 4, percentage: 80, points: 400 };
}

/**
 * Universal column matcher helper
 */
function getColumnValue(row: Record<string, unknown>, possibleKeys: string[]): unknown {
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const target of possibleKeys) {
      const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget || cleanKey.includes(cleanTarget)) {
        const val = row[key];
        if (val !== undefined && val !== null) {
          return val;
        }
      }
    }
  }
  return undefined;
}

/**
 * Imports Learner Quiz Attempts from Excel (.xlsx, .xls, .xlsb binary, .csv)
 * Features auto-vlookup fallback for associate name and process!
 */
export async function importAttemptsFromExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, importedCount: 0, error: 'Excel file is empty.' };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

    if (rawRows.length === 0) {
      return { success: false, importedCount: 0, error: 'No data rows found in Excel sheet.' };
    }

    const existingModules = getModules();
    const parsedAttempts: LearnerAttempt[] = [];

    rawRows.forEach((row, index) => {
      // 1. Employee Code
      const rawCode = getColumnValue(row, [
        'Employee Code', 'Emp Code', 'E-Code', 'ECode', 'EmpCode', 'Emp ID', 'Employee ID',
        'Associate Code', 'Agent Code', 'Staff Code', 'User Code', 'Code'
      ]);
      const employeeCode = rawCode ? String(rawCode).trim().toUpperCase() : `PB-${1000 + index}`;

      // 2. VLOOKUP against active roster if name is missing or generic
      const rosterMatch = lookupAssociate(employeeCode);

      const rawName = getColumnValue(row, [
        'Associate Name', 'Employee Name', 'Emp Name', 'Learner Name', 'Agent Name', 'Name', 'Full Name', 'Staff Name'
      ]);
      const learnerName = rawName 
        ? String(rawName).trim() 
        : (rosterMatch ? rosterMatch.employeeName : `Associate ${employeeCode}`);

      // 3. Module Title
      const rawModule = getColumnValue(row, [
        'Module Title', 'Module Name', 'Training Module', 'Module', 'Training Topic', 'Topic', 'Course'
      ]);
      const moduleTitle = rawModule 
        ? String(rawModule).trim() 
        : (existingModules[0]?.title || 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims');

      // Match module ID if possible
      const matchedMod = existingModules.find(m => 
        m.title.toLowerCase().includes(moduleTitle.toLowerCase()) || 
        moduleTitle.toLowerCase().includes(m.title.toLowerCase())
      );
      const moduleId = matchedMod ? matchedMod.id : (existingModules[0]?.id || 'mod-1');

      // 4. Date
      const rawDate = getColumnValue(row, [
        'Dedicated Date', 'Date', 'Training Date', 'Quiz Date', 'Attempt Date', 'Completion Date'
      ]);
      const dedicatedDate = parseExcelDate(rawDate);

      // 5. Score & Percentage
      const rawScoreVal = getColumnValue(row, [
        'Score', 'Quiz Score', 'Marks', 'Result', 'Grade', 'Points'
      ]);
      const { score, percentage, points } = parseExcelScore(rawScoreVal);
      const passed = score >= 3;

      const attempt: LearnerAttempt = {
        id: `att-imp-${Date.now()}-${index}`,
        moduleId,
        moduleTitle,
        dedicatedDate,
        employeeCode,
        learnerName,
        videoWatchedRatio: 1.0,
        videoCompleted: true,
        score,
        totalQuestions: 5,
        scorePercentage: percentage,
        pointsEarned: points,
        completedAt: new Date().toISOString(),
        passed,
        certificateId: passed ? `cert-imp-${employeeCode.toLowerCase()}-${index}` : undefined
      };

      parsedAttempts.push(attempt);
      recordAttempt(attempt);
    });

    // Batch upload to Firebase Firestore
    await batchSaveAttemptsToCloud(parsedAttempts);

    return {
      success: true,
      importedCount: parsedAttempts.length,
      attempts: parsedAttempts,
      sampleRows: rawRows.slice(0, 3)
    };
  } catch (err) {
    console.error('Error importing Excel attempts:', err);
    return {
      success: false,
      importedCount: 0,
      error: (err as Error).message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.'
    };
  }
}

/**
 * Imports Active Associates Master Roster from Excel (.xlsx, .xls, .xlsb binary, .csv)
 * Enables automatic VLOOKUP of Employee Name and Process whenever learner types their e-code!
 */
export async function importRosterFromExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, importedCount: 0, error: 'Excel file is empty.' };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

    if (rawRows.length === 0) {
      return { success: false, importedCount: 0, error: 'No data rows found in Excel sheet.' };
    }

    const parsedRoster: RosterAssociate[] = [];

    rawRows.forEach((row, index) => {
      // 1. Employee Code (E-Code)
      const rawCode = getColumnValue(row, [
        'E-Code', 'ECode', 'E Code', 'Employee Code', 'Emp Code', 'EmpCode', 'Emp ID', 'Employee ID',
        'Associate Code', 'Agent Code', 'Staff Code', 'Code', 'ID'
      ]);
      if (!rawCode) return;

      const employeeCode = String(rawCode).trim().toUpperCase();

      // 2. Associate Name
      const rawName = getColumnValue(row, [
        'Associate Name', 'Employee Name', 'Emp Name', 'Learner Name', 'Agent Name', 'Name', 'Full Name', 'Staff Name', 'Associate'
      ]);
      const employeeName = rawName ? String(rawName).trim() : `Associate ${employeeCode}`;

      // 3. Process / Department
      const rawProcess = getColumnValue(row, [
        'Process', 'Process Name', 'Department', 'Dept', 'LOB', 'Line of Business', 'Queue', 'Vertical', 'Team', 'Sub Process', 'Function'
      ]);
      const process = rawProcess ? String(rawProcess).trim() : 'Motor Inbound & Claims Advisory';

      parsedRoster.push({
        employeeCode,
        employeeName,
        process,
        updatedAt: new Date().toISOString()
      });
    });

    if (parsedRoster.length === 0) {
      return { 
        success: false, 
        importedCount: 0, 
        error: 'Could not detect Employee Code / Name columns in the uploaded Excel file. Required columns: E-Code, Associate Name, Process.' 
      };
    }

    // Save roster to localStorage and Firebase Firestore
    saveRoster(parsedRoster);
    await batchSaveRosterToCloud(parsedRoster);

    return {
      success: true,
      importedCount: parsedRoster.length,
      roster: parsedRoster,
      sampleRows: rawRows.slice(0, 3)
    };
  } catch (err) {
    console.error('Error importing roster from Excel:', err);
    return {
      success: false,
      importedCount: 0,
      error: (err as Error).message || 'Failed to parse Excel file. Please ensure it has valid columns (E-Code, Name, Process).'
    };
  }
}

/**
 * Generates and downloads an Excel file (.xlsx) with all associate quiz attempts.
 */
export function exportAttemptsToExcel(attempts: LearnerAttempt[], filenamePrefix = 'Motor_Insurance_Data'): void {
  const data = attempts.map(a => ({
    'Employee Code': a.employeeCode,
    'Associate Name': a.learnerName,
    'Module Title': a.moduleTitle,
    'Dedicated Date': a.dedicatedDate,
    'Video Watched %': `${Math.round(a.videoWatchedRatio * 100)}%`,
    'Quiz Score (out of 5)': a.score,
    'Score %': `${a.scorePercentage}%`,
    'Points Earned': a.pointsEarned,
    'Result Status': a.passed ? 'PASSED' : 'RE-ATTEMPT',
    'Completed Timestamp': a.completedAt.replace('T', ' ').slice(0, 19),
    'Certificate ID': a.certificateId || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Associate Results');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${today}.xlsx`);
}

/**
 * Downloads a sample Excel template for quiz results import.
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Employee Code': 'PB-1042',
      'Associate Name': 'Rahul Sharma',
      'Module Title': 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
      'Dedicated Date': '2026-09-23',
      'Score': '5/5',
      'Points Earned': '500'
    },
    {
      'Employee Code': 'PB-2180',
      'Associate Name': 'Priya Sundaram',
      'Module Title': 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
      'Dedicated Date': '2026-09-23',
      'Score': '4/5',
      'Points Earned': '400'
    },
    {
      'Employee Code': 'PB-3055',
      'Associate Name': 'Vikram Malhotra',
      'Module Title': 'NCB (No Claim Bonus) Retention & Transfer Protocol',
      'Dedicated Date': '2026-09-22',
      'Score': '5/5',
      'Points Earned': '500'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');

  XLSX.writeFile(workbook, 'Motor_Insurance_Associate_Quiz_Import_Template.xlsx');
}

/**
 * Downloads a sample Excel template for Active Associate Master Roster (VLOOKUP table).
 */
export function downloadSampleRosterTemplate(): void {
  const sampleRoster = [
    {
      'E-Code': 'PB-1042',
      'Associate Name': 'Rahul Sharma',
      'Process': 'Motor Inbound & Claims Advisory'
    },
    {
      'E-Code': 'PB-2180',
      'Associate Name': 'Priya Sundaram',
      'Process': 'Motor Renewal & Endorsements'
    },
    {
      'E-Code': 'PB-3055',
      'Associate Name': 'Vikram Malhotra',
      'Process': 'Commercial Vehicle & Fleet Claims'
    },
    {
      'E-Code': 'PB-4112',
      'Associate Name': 'Ananya Verma',
      'Process': 'Two-Wheeler Comprehensive Underwriting'
    },
    {
      'E-Code': 'PB-5501',
      'Associate Name': 'Arjun Mehta',
      'Process': 'Motor Inbound & Claims Advisory'
    },
    {
      'E-Code': 'PB-5502',
      'Associate Name': 'Deepika Nair',
      'Process': 'Private Car Claims Escalations'
    },
    {
      'E-Code': 'PB-5503',
      'Associate Name': 'Karan Joshi',
      'Process': 'Motor Retention & Cross-Sell'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRoster);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Associates Roster');

  XLSX.writeFile(workbook, 'Motor_Insurance_Active_Associate_Roster_Template.xlsx');
}
