import * as XLSX from 'xlsx';
import { LearnerAttempt, RosterAssociate } from '../types';
import { batchSaveAttemptsToCloud, batchSaveRosterToCloud } from '../firebase';
import { recordAttempt, saveRoster, lookupAssociate, getModules, getRoster } from './storage';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  detectedColumns?: {
    eCodeHeader?: string;
    nameHeader?: string;
    teamLeaderHeader?: string;
    processHeader?: string;
  };
  sampleCodes?: string[];
  attempts?: LearnerAttempt[];
  roster?: RosterAssociate[];
  error?: string;
  sampleRows?: Array<Record<string, unknown>>;
}

/**
 * Normalizes and cleans raw Employee Code from Excel
 * Strips Excel float decimals e.g. 1042.0 -> 1042
 * Strips zero-width chars, non-breaking spaces, and quotes
 */
export function cleanEmployeeCode(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  let str = String(val).trim();
  if (!str) return null;

  // Strip trailing float decimals e.g. "1042.0" or "1042.00"
  str = str.replace(/\.0+$/, '');

  // Strip quotes and hidden non-breaking / zero-width spaces
  str = str.replace(/['"]+/g, '').replace(/[\u00A0\u200B\uFEFF]/g, '').trim();

  // Filter out invalid/empty placeholders
  const upper = str.toUpperCase();
  if (!upper || upper === '-' || upper === 'NA' || upper === 'N/A' || upper === 'NULL' || upper === 'UNDEFINED') {
    return null;
  }

  return upper;
}

/**
 * Robust date parser for dates from Excel (handles Date objects, serial numbers, YYYY-MM-DD, DD/MM/YYYY, etc.)
 */
function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If XLSX parsed it as a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // If number (Excel serial date number, e.g. 45558)
  if (typeof val === 'number') {
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
    if (!isNaN(numerator)) {
      const score = Math.min(5, Math.max(0, Math.round((numerator / denominator) * 5)));
      const pct = Math.round((score / 5) * 100);
      return { score, percentage: pct, points: score * 100 };
    }
  }

  const num = parseFloat(str);
  if (!isNaN(num)) {
    // If entered as percentage like 80 or 100
    if (num > 5 && num <= 100) {
      const score = Math.round((num / 100) * 5);
      return { score, percentage: Math.round(num), points: score * 100 };
    }
    // If entered as 1 to 5
    const score = Math.min(5, Math.max(0, Math.round(num)));
    return { score, percentage: Math.round((score / 5) * 100), points: score * 100 };
  }

  return { score: 4, percentage: 80, points: 400 };
}

/**
 * Finds the sheet with the most rows/cells in a workbook
 */
function findBestSheet(workbook: XLSX.WorkBook): { sheetName: string; sheet: XLSX.WorkSheet } | null {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return null;

  let bestSheetName = workbook.SheetNames[0];
  let maxCells = -1;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const ref = sheet['!ref'];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const cellCount = (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
    if (cellCount > maxCells) {
      maxCells = cellCount;
      bestSheetName = name;
    }
  }

  return { sheetName: bestSheetName, sheet: workbook.Sheets[bestSheetName] };
}

interface ColumnMapping {
  headerRowIndex: number;
  eCodeCol: number;
  nameCol: number;
  teamLeaderCol: number;
  processCol: number;
  dateCol: number;
  scoreCol: number;
  moduleCol: number;
  headerLabels: string[];
}

/**
 * Intelligently detects header row index and column indices from a 2D sheet array.
 * Strictly guarantees priority sequence:
 * 1. E code
 * 2. Associate full name
 * 3. Team leader
 */
function detectColumnsFrom2DGrid(grid: unknown[][]): ColumnMapping {
  let bestHeaderRowIndex = 0;
  let maxKeywordScore = -1;

  // Scan up to first 15 rows to find the actual header row
  const scanLimit = Math.min(15, grid.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = grid[r] || [];
    let score = 0;
    row.forEach(cell => {
      if (cell === undefined || cell === null) return;
      const cStr = String(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        cStr.includes('ecode') ||
        cStr.includes('employeecode') ||
        cStr.includes('empcode') ||
        cStr.includes('empno') ||
        cStr.includes('empid') ||
        cStr.includes('associatecode') ||
        cStr.includes('agentcode') ||
        cStr.includes('staffno') ||
        cStr.includes('pbcode')
      ) {
        score += 20;
      }
      if (
        cStr.includes('name') ||
        cStr.includes('fullname') ||
        cStr.includes('associatename') ||
        cStr.includes('employeename') ||
        cStr.includes('learnername')
      ) {
        score += 15;
      }
      if (
        cStr.includes('teamleader') ||
        cStr.includes('teamlead') ||
        cStr.includes('tl') ||
        cStr.includes('manager') ||
        cStr.includes('supervisor')
      ) {
        score += 15;
      }
      if (
        cStr.includes('process') ||
        cStr.includes('department') ||
        cStr.includes('dept') ||
        cStr.includes('lob')
      ) {
        score += 8;
      }
      if (cStr.includes('score') || cStr.includes('marks') || cStr.includes('points') || cStr.includes('result')) {
        score += 5;
      }
      if (cStr.includes('date')) {
        score += 4;
      }
    });

    if (score > maxKeywordScore) {
      maxKeywordScore = score;
      bestHeaderRowIndex = r;
    }
  }

  const headerRow = (grid[bestHeaderRowIndex] || []).map(c => String(c ?? '').trim());

  let eCodeCol = -1;
  let nameCol = -1;
  let teamLeaderCol = -1;
  let processCol = -1;
  let dateCol = -1;
  let scoreCol = -1;
  let moduleCol = -1;

  // 1. Match E-Code Column (Tier 1: Explicit E-Code keywords)
  const eCodeKeywords = [
    'ecode', 'e-code', 'e_code', 'employeecode', 'empcode', 'empno', 'employeeno', 'employeenumber',
    'empid', 'employeeid', 'associatecode', 'agentcode', 'staffcode', 'staffno', 'pbcode', 'pbid',
    'pb_code', 'userid', 'loginid', 'usercode', 'agentid', 'ecod'
  ];

  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (eCodeCol === -1 && eCodeKeywords.some(t => clean === t || clean.includes(t))) {
      if (!clean.includes('zip') && !clean.includes('postal') && !clean.includes('status')) {
        eCodeCol = cIdx;
      }
    }
  });

  // Fallback for E-Code: look for column containing 'code' or 'emp'
  if (eCodeCol === -1) {
    headerRow.forEach((colName, cIdx) => {
      const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        eCodeCol === -1 &&
        (clean.includes('code') || clean.includes('emp')) &&
        !clean.includes('name') &&
        !clean.includes('date') &&
        !clean.includes('zip') &&
        !clean.includes('status')
      ) {
        eCodeCol = cIdx;
      }
    });
  }

  // 2. Match Name Column (Associate Full Name)
  const nameKeywords = [
    'associatefullname', 'associatename', 'employeename', 'empname', 'learnername', 
    'agentname', 'fullname', 'staffname', 'name'
  ];
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nameCol === -1 && cIdx !== eCodeCol) {
      if (nameKeywords.some(k => clean === k || clean.includes(k))) {
        nameCol = cIdx;
      }
    }
  });

  // 3. Match Team Leader Column
  const tlKeywords = [
    'teamleader', 'teamlead', 'tl', 'tlname', 'teamleadername', 'reportingmanager', 
    'manager', 'supervisor', 'lead', 'reportingto', 'head', 'tlcode'
  ];
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (teamLeaderCol === -1 && cIdx !== eCodeCol && cIdx !== nameCol) {
      if (tlKeywords.some(k => clean === k || clean.includes(k))) {
        teamLeaderCol = cIdx;
      }
    }
  });

  // 4. Match Process / Department Column (fallback / optional)
  const processKeywords = ['process', 'department', 'dept', 'lob', 'lineofbusiness', 'queue', 'vertical', 'team', 'subprocess', 'function', 'track', 'category'];
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (processCol === -1 && cIdx !== eCodeCol && cIdx !== nameCol && cIdx !== teamLeaderCol) {
      if (processKeywords.some(k => clean.includes(k))) {
        processCol = cIdx;
      }
    }
  });

  // 5. Match Date Column
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dateCol === -1 && cIdx !== eCodeCol && cIdx !== nameCol && cIdx !== teamLeaderCol && cIdx !== processCol) {
      if (clean.includes('date') || clean.includes('time') || clean.includes('day')) {
        dateCol = cIdx;
      }
    }
  });

  // 6. Match Score Column
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (scoreCol === -1 && cIdx !== eCodeCol && cIdx !== nameCol && cIdx !== teamLeaderCol && cIdx !== processCol && cIdx !== dateCol) {
      if (clean.includes('score') || clean.includes('mark') || clean.includes('point') || clean.includes('result') || clean.includes('grade')) {
        scoreCol = cIdx;
      }
    }
  });

  // 7. Match Module Column
  headerRow.forEach((colName, cIdx) => {
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (moduleCol === -1 && cIdx !== eCodeCol && cIdx !== nameCol && cIdx !== teamLeaderCol && cIdx !== processCol && cIdx !== dateCol && cIdx !== scoreCol) {
      if (clean.includes('module') || clean.includes('topic') || clean.includes('title') || clean.includes('course') || clean.includes('training')) {
        moduleCol = cIdx;
      }
    }
  });

  // Absolute fallback sequence for standard 3-column roster file:
  // Sequence requested: E code (col 0), Associate full name (col 1), Team leader (col 2)
  if (eCodeCol === -1) {
    const dataRows = grid.slice(bestHeaderRowIndex + 1, bestHeaderRowIndex + 6);
    const colCount = Math.max(...grid.slice(0, 10).map(r => r.length), 3);

    for (let c = 0; c < colCount; c++) {
      const sampleVals = dataRows.map(r => cleanEmployeeCode(r[c])).filter(Boolean);
      if (sampleVals.length > 0 && eCodeCol === -1) {
        const looksLikeCode = sampleVals.every(v => /^[A-Z0-9_-]{2,15}$/i.test(v as string));
        if (looksLikeCode) {
          eCodeCol = c;
          break;
        }
      }
    }
    if (eCodeCol === -1) eCodeCol = 0; // Default: Col 1
  }

  if (nameCol === -1) {
    nameCol = eCodeCol === 0 ? 1 : 0; // Default: Col 2
  }

  if (teamLeaderCol === -1) {
    // If col 2 is not taken by eCode or name, use col 2 as Team Leader
    if (eCodeCol !== 2 && nameCol !== 2) {
      teamLeaderCol = 2;
    } else {
      teamLeaderCol = [0, 1, 2, 3].find(idx => idx !== eCodeCol && idx !== nameCol) || 2;
    }
  }

  if (processCol === -1) {
    processCol = teamLeaderCol;
  }

  return {
    headerRowIndex: bestHeaderRowIndex,
    eCodeCol,
    nameCol,
    teamLeaderCol,
    processCol,
    dateCol,
    scoreCol,
    moduleCol,
    headerLabels: headerRow
  };
}

/**
 * Imports Active Associates Master Roster from Excel (.xlsx, .xls, .xlsb binary, .csv)
 * Sequence: E code, Associate full name, Team leader
 */
export async function importRosterFromExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const target = findBestSheet(workbook);
    if (!target) {
      return { success: false, importedCount: 0, error: 'Excel file is empty or contains no valid sheets.' };
    }

    const grid = XLSX.utils.sheet_to_json<unknown[]>(target.sheet, {
      header: 1,
      blankrows: false,
      raw: false
    });

    if (grid.length === 0) {
      return { success: false, importedCount: 0, error: 'No data rows found in Excel sheet.' };
    }

    const mapping = detectColumnsFrom2DGrid(grid);
    const dataRows = grid.slice(mapping.headerRowIndex + 1);

    if (dataRows.length === 0) {
      return { success: false, importedCount: 0, error: 'Excel file has headers but no associate records.' };
    }

    const existingRoster = getRoster();
    const rosterMap = new Map<string, RosterAssociate>();

    // Seed existing roster into map
    existingRoster.forEach(item => {
      rosterMap.set(item.employeeCode.toUpperCase(), item);
    });

    const parsedList: RosterAssociate[] = [];
    const sampleCodes: string[] = [];

    dataRows.forEach((row) => {
      if (!row || row.length === 0) return;

      // 1. E code
      const rawCodeCell = row[mapping.eCodeCol];
      const employeeCode = cleanEmployeeCode(rawCodeCell);
      if (!employeeCode) return;

      // 2. Associate full name
      const rawNameCell = mapping.nameCol !== -1 ? row[mapping.nameCol] : undefined;
      let employeeName = rawNameCell ? String(rawNameCell).trim().replace(/['"]+/g, '') : '';
      if (!employeeName || employeeName.toUpperCase() === employeeCode) {
        const existing = rosterMap.get(employeeCode);
        employeeName = existing ? existing.employeeName : `Associate ${employeeCode}`;
      }

      // 3. Team leader
      const rawTlCell = mapping.teamLeaderCol !== -1 ? row[mapping.teamLeaderCol] : undefined;
      let teamLeader = rawTlCell ? String(rawTlCell).trim().replace(/['"]+/g, '') : '';
      if (!teamLeader) {
        const existing = rosterMap.get(employeeCode);
        teamLeader = existing ? (existing.teamLeader || 'Amit Kumar (TL)') : 'Amit Kumar (TL)';
      }

      // Optional process
      const rawProcessCell = mapping.processCol !== -1 && mapping.processCol !== mapping.teamLeaderCol ? row[mapping.processCol] : undefined;
      const process = rawProcessCell ? String(rawProcessCell).trim().replace(/['"]+/g, '') : (rosterMap.get(employeeCode)?.process || 'Motor Inbound & Claims Advisory');

      const associate: RosterAssociate = {
        employeeCode,
        employeeName,
        teamLeader,
        process,
        updatedAt: new Date().toISOString()
      };

      rosterMap.set(employeeCode, associate);
      parsedList.push(associate);

      if (sampleCodes.length < 5) {
        sampleCodes.push(`${employeeCode} (${employeeName} · TL: ${teamLeader})`);
      }
    });

    if (parsedList.length === 0) {
      return {
        success: false,
        importedCount: 0,
        error: `Could not detect Employee Codes in column ${mapping.eCodeCol + 1} ("${mapping.headerLabels[mapping.eCodeCol] || 'E-Code'}"). Please ensure your file has columns: E code, Associate full name, Team leader.`
      };
    }

    const updatedRoster = Array.from(rosterMap.values());

    // 1. Save to localStorage
    saveRoster(updatedRoster);

    // 2. Batch commit to Firebase Cloud
    try {
      await batchSaveRosterToCloud(updatedRoster);
    } catch (fbErr) {
      console.warn('Firebase roster sync note:', fbErr);
    }

    return {
      success: true,
      importedCount: parsedList.length,
      detectedColumns: {
        eCodeHeader: mapping.headerLabels[mapping.eCodeCol] || `Col ${mapping.eCodeCol + 1} (E code)`,
        nameHeader: mapping.headerLabels[mapping.nameCol] || `Col ${mapping.nameCol + 1} (Associate full name)`,
        teamLeaderHeader: mapping.headerLabels[mapping.teamLeaderCol] || `Col ${mapping.teamLeaderCol + 1} (Team leader)`,
        processHeader: mapping.headerLabels[mapping.processCol] || `Col ${mapping.processCol + 1} (Process)`
      },
      sampleCodes,
      roster: updatedRoster
    };
  } catch (err) {
    console.error('Error importing roster from Excel:', err);
    return {
      success: false,
      importedCount: 0,
      error: (err as Error).message || 'Failed to read Excel roster file. Please ensure it is a valid .xlsx, .xls, .xlsb, or .csv file.'
    };
  }
}

/**
 * Imports associate quiz attempt records from Excel (.xlsx, .xls, .xlsb binary, .csv)
 */
export async function importAttemptsFromExcel(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const target = findBestSheet(workbook);
    if (!target) {
      return { success: false, importedCount: 0, error: 'Excel file contains no readable sheets.' };
    }

    const grid = XLSX.utils.sheet_to_json<unknown[]>(target.sheet, {
      header: 1,
      blankrows: false,
      raw: false
    });

    if (grid.length === 0) {
      return { success: false, importedCount: 0, error: 'No data rows found in Excel sheet.' };
    }

    const mapping = detectColumnsFrom2DGrid(grid);
    const dataRows = grid.slice(mapping.headerRowIndex + 1);

    if (dataRows.length === 0) {
      return { success: false, importedCount: 0, error: 'Excel file contains no data rows.' };
    }

    const existingModules = getModules();
    const existingRoster = getRoster();
    const rosterMap = new Map<string, RosterAssociate>();
    existingRoster.forEach(item => rosterMap.set(item.employeeCode.toUpperCase(), item));

    const parsedAttempts: LearnerAttempt[] = [];
    const sampleCodes: string[] = [];

    dataRows.forEach((row, index) => {
      if (!row || row.length === 0) return;

      // 1. Employee Code
      const rawCodeCell = row[mapping.eCodeCol];
      let employeeCode = cleanEmployeeCode(rawCodeCell);
      if (!employeeCode) {
        employeeCode = `PB-${1000 + index}`;
      }

      // 2. Associate Name & Roster Sync
      const rawNameCell = mapping.nameCol !== -1 ? row[mapping.nameCol] : undefined;
      let learnerName = rawNameCell ? String(rawNameCell).trim().replace(/['"]+/g, '') : '';

      const rosterMatch = lookupAssociate(employeeCode);
      if (!learnerName || learnerName.toUpperCase() === employeeCode) {
        learnerName = rosterMatch ? rosterMatch.employeeName : `Associate ${employeeCode}`;
      }

      // 3. Team Leader
      const rawTlCell = mapping.teamLeaderCol !== -1 ? row[mapping.teamLeaderCol] : undefined;
      let teamLeader = rawTlCell ? String(rawTlCell).trim().replace(/['"]+/g, '') : '';
      if (!teamLeader && rosterMatch) {
        teamLeader = rosterMatch.teamLeader;
      }
      if (!teamLeader) {
        teamLeader = 'Amit Kumar (TL)';
      }

      // Automatically register new E-Code into the active roster
      if (!rosterMap.has(employeeCode)) {
        const newRosterItem: RosterAssociate = {
          employeeCode,
          employeeName: learnerName,
          teamLeader,
          process: 'Motor Inbound & Claims Advisory',
          updatedAt: new Date().toISOString()
        };
        rosterMap.set(employeeCode, newRosterItem);
      }

      // 4. Module Title
      const rawModule = mapping.moduleCol !== -1 ? row[mapping.moduleCol] : undefined;
      const moduleTitle = rawModule
        ? String(rawModule).trim()
        : (existingModules[0]?.title || 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims');

      const matchedModule = existingModules.find(m =>
        m.title.toLowerCase().includes(moduleTitle.toLowerCase()) ||
        moduleTitle.toLowerCase().includes(m.title.toLowerCase())
      );
      const moduleId = matchedModule ? matchedModule.id : (existingModules[0]?.id || 'mod-seed-01');

      // 5. Dedicated Date
      const rawDateVal = mapping.dateCol !== -1 ? row[mapping.dateCol] : undefined;
      const dedicatedDate = parseExcelDate(rawDateVal);

      // 6. Quiz Score and Points
      const rawScoreVal = mapping.scoreCol !== -1 ? row[mapping.scoreCol] : undefined;
      const { score, percentage, points } = parseExcelScore(rawScoreVal);

      const attempt: LearnerAttempt = {
        id: `excel-att-${Date.now()}-${index}`,
        moduleId,
        moduleTitle,
        dedicatedDate,
        employeeCode,
        learnerName,
        teamLeader,
        videoWatchedRatio: 1.0,
        videoCompleted: true,
        score,
        totalQuestions: 5,
        scorePercentage: percentage,
        pointsEarned: points,
        completedAt: `${dedicatedDate}T10:00:00Z`,
        passed: score >= 3,
        certificateId: score >= 3 ? `cert-excel-${employeeCode.toLowerCase()}` : undefined
      };

      parsedAttempts.push(attempt);
      recordAttempt(attempt);

      if (sampleCodes.length < 5) {
        sampleCodes.push(`${employeeCode} (${learnerName} · TL: ${teamLeader})`);
      }
    });

    const updatedRoster = Array.from(rosterMap.values());
    saveRoster(updatedRoster);

    // Sync to Cloud
    try {
      await batchSaveAttemptsToCloud(parsedAttempts);
      await batchSaveRosterToCloud(updatedRoster);
    } catch (cloudErr) {
      console.warn('Firebase cloud sync note:', cloudErr);
    }

    return {
      success: true,
      importedCount: parsedAttempts.length,
      detectedColumns: {
        eCodeHeader: mapping.headerLabels[mapping.eCodeCol] || `Col ${mapping.eCodeCol + 1} (E-Code)`,
        nameHeader: mapping.headerLabels[mapping.nameCol] || `Col ${mapping.nameCol + 1} (Associate Name)`,
        teamLeaderHeader: mapping.headerLabels[mapping.teamLeaderCol] || `Col ${mapping.teamLeaderCol + 1} (Team Leader)`
      },
      sampleCodes,
      attempts: parsedAttempts,
      roster: updatedRoster
    };
  } catch (err) {
    console.error('Error importing Excel attempts:', err);
    return {
      success: false,
      importedCount: 0,
      error: (err as Error).message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, .xlsb, or .csv file.'
    };
  }
}

/**
 * Generates and downloads an Excel file (.xlsx) with all associate quiz attempts.
 * Sequence starts strictly with: E code, Associate full name, Team leader
 */
export function exportAttemptsToExcel(attempts: LearnerAttempt[], filenamePrefix = 'Policybazaar_Motor_Insurance_Data'): void {
  const data = attempts.map(a => {
    const rosterMatch = lookupAssociate(a.employeeCode);
    const tl = a.teamLeader || (rosterMatch ? rosterMatch.teamLeader : 'Amit Kumar (TL)');
    return {
      'E code': a.employeeCode,
      'Associate full name': a.learnerName,
      'Team leader': tl,
      'Module Title': a.moduleTitle,
      'Dedicated Date': a.dedicatedDate,
      'Video Watched %': `${Math.round(a.videoWatchedRatio * 100)}%`,
      'Quiz Score (out of 5)': a.score,
      'Score %': `${a.scorePercentage}%`,
      'Points Earned': a.pointsEarned,
      'Result Status': a.passed ? 'PASSED' : 'RE-ATTEMPT',
      'Completed Timestamp': a.completedAt.replace('T', ' ').slice(0, 19),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 16 }, // E code
    { wch: 24 }, // Associate full name
    { wch: 24 }, // Team leader
    { wch: 45 }, // Module Title
    { wch: 15 }, // Dedicated Date
    { wch: 16 }, // Video Watched %
    { wch: 20 }, // Quiz Score
    { wch: 12 }, // Score %
    { wch: 14 }, // Points Earned
    { wch: 14 }, // Result Status
    { wch: 22 }, // Timestamp
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Associate Quiz Data');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${today}.xlsx`);
}

/**
 * Downloads a sample starter Excel template for trainer bulk attempt uploads.
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'E code': 'PB-1042',
      'Associate full name': 'Rahul Sharma',
      'Team leader': 'Amit Kumar (TL)',
      'Module Title': 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
      'Date (YYYY-MM-DD)': '2026-09-23',
      'Score (out of 5)': '5/5',
      'Points': 500
    },
    {
      'E code': 'PB-2180',
      'Associate full name': 'Priya Sundaram',
      'Team leader': 'Sneha Kapoor (TL)',
      'Module Title': 'Zero Depreciation Add-on: Handling Customer Inquiries on Claims',
      'Date (YYYY-MM-DD)': '2026-09-23',
      'Score (out of 5)': '4/5',
      'Points': 400
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Template');
  XLSX.writeFile(workbook, 'Policybazaar_Attempts_Template.xlsx');
}

/**
 * Downloads a sample Master Active Associate Roster template (.xlsx)
 * Guaranteed exact sequence: E code, Associate full name, Team leader
 */
export function downloadSampleRosterTemplate(): void {
  const sampleRoster = [
    {
      'E code': 'PB-1042',
      'Associate full name': 'Rahul Sharma',
      'Team leader': 'Amit Kumar (TL)'
    },
    {
      'E code': 'PB-2180',
      'Associate full name': 'Priya Sundaram',
      'Team leader': 'Sneha Kapoor (TL)'
    },
    {
      'E code': 'PB-3055',
      'Associate full name': 'Vikram Malhotra',
      'Team leader': 'Vikas Chauhan (TL)'
    },
    {
      'E code': 'PB-4112',
      'Associate full name': 'Ananya Verma',
      'Team leader': 'Amit Kumar (TL)'
    },
    {
      'E code': 'PB-5501',
      'Associate full name': 'Arjun Mehta',
      'Team leader': 'Rohit Saxena (TL)'
    },
    {
      'E code': 'PB-5502',
      'Associate full name': 'Deepika Nair',
      'Team leader': 'Sneha Kapoor (TL)'
    },
    {
      'E code': 'PB-5503',
      'Associate full name': 'Karan Joshi',
      'Team leader': 'Vikas Chauhan (TL)'
    },
    {
      'E code': 'PB-6020',
      'Associate full name': 'Sneha Patel',
      'Team leader': 'Rohit Saxena (TL)'
    },
    {
      'E code': 'PB-7789',
      'Associate full name': 'Amit Saxena',
      'Team leader': 'Amit Kumar (TL)'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRoster);
  worksheet['!cols'] = [
    { wch: 16 }, // E code
    { wch: 26 }, // Associate full name
    { wch: 26 }  // Team leader
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Associates Roster');
  XLSX.writeFile(workbook, 'Policybazaar_Active_Associates_Roster.xlsx');
}
