import { create } from 'zustand';

// Types for medication pharmacokinetics
export type MedicationType = 'ritalin_ir' | 'ritalin_la' | 'attent' | 'vyvanse' | 'none';

export interface MedicationConfig {
  name: string;
  hebrewName: string;
  peakStartHours: number;
  peakEndHours: number;
  halfLifeHours: number;
}

export const MEDICATIONS: Record<MedicationType, MedicationConfig> = {
  ritalin_ir: {
    name: 'Ritalin IR',
    hebrewName: 'ריטלין IR',
    peakStartHours: 1.5,
    peakEndHours: 2.5,
    halfLifeHours: 3,
  },
  ritalin_la: {
    name: 'Ritalin LA',
    hebrewName: 'ריטלין LA',
    peakStartHours: 4,
    peakEndHours: 6,
    halfLifeHours: 6,
  },
  attent: {
    name: 'Attent',
    hebrewName: 'אטנט',
    peakStartHours: 3,
    peakEndHours: 4,
    halfLifeHours: 5,
  },
  vyvanse: {
    name: 'Vyvanse',
    hebrewName: 'ויואנס',
    peakStartHours: 3.5,
    peakEndHours: 4.5,
    halfLifeHours: 10,
  },
  none: {
    name: 'No Medication',
    hebrewName: 'ללא תרופה',
    peakStartHours: 0,
    peakEndHours: 0,
    halfLifeHours: 0,
  },
};

export type TestMode = 'kids' | 'adult';
export type Gender = 'male' | 'female';

export interface PatientInfo {
  birthDate: Date | null;
  gender: Gender | null;
  medication: MedicationType;
  dosage: number;
  medicationTime: Date | null;
}

export interface CalibrationData {
  reactionTimes: number[];
  averageOffset: number;
  isCalibrated: boolean;
  powerConfirmed: boolean;
  focusModeConfirmed: boolean;
}

export type ResponseType = 'hit' | 'miss' | 'commission' | 'timing_error';

export interface TestResponse {
  blockNumber: number;
  trialNumber: number;
  stimulusType: 'target' | 'non_target';
  timestampStimulusShown: number;
  timestampResponse: number | null;
  responseType: ResponseType;
  reactionTime: number | null;
  hasVisualDistractor: boolean;
  hasAuditoryDistractor: boolean;
}

export interface TestResults {
  attentiveness: number;
  timeliness: number;
  impulsivity: number;
  hyperactivity: number;
  rawLog: TestResponse[];
}

export type AppScreen = 
  | 'welcome' 
  | 'patient_info' 
  | 'medication' 
  | 'calibration' 
  | 'test' 
  | 'results'
  | 'history';

interface TestStore {
  // Navigation
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  // Patient Info
  patientInfo: PatientInfo;
  setPatientInfo: (info: Partial<PatientInfo>) => void;

  // Medication Status
  isOptimalWindow: boolean;
  minutesToOptimal: number;
  calculateMedicationStatus: () => void;

  // Calibration
  calibration: CalibrationData;
  setCalibration: (data: Partial<CalibrationData>) => void;
  addCalibrationReaction: (time: number) => void;

  // Test Mode
  testMode: TestMode;
  setTestMode: (mode: TestMode) => void;

  // Test State
  isTestRunning: boolean;
  currentBlock: number;
  currentTrial: number;
  responses: TestResponse[];
  startTest: () => void;
  endTest: () => void;
  addResponse: (response: TestResponse) => void;
  setCurrentBlock: (block: number) => void;
  setCurrentTrial: (trial: number) => void;

  // Results
  testResults: TestResults | null;
  calculateResults: () => void;

  // Reset
  resetTest: () => void;
  resetAll: () => void;
}

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const useTestStore = create<TestStore>((set, get) => ({
  // Navigation
  currentScreen: 'welcome',
  setScreen: (screen) => set({ currentScreen: screen }),

  // Patient Info
  patientInfo: {
    birthDate: null,
    gender: null,
    medication: 'none',
    dosage: 0,
    medicationTime: null,
  },
  setPatientInfo: (info) =>
    set((state) => ({
      patientInfo: { ...state.patientInfo, ...info },
    })),

  // Medication Status
  isOptimalWindow: false,
  minutesToOptimal: 0,
  calculateMedicationStatus: () => {
    const { patientInfo } = get();
    if (patientInfo.medication === 'none' || !patientInfo.medicationTime) {
      set({ isOptimalWindow: true, minutesToOptimal: 0 });
      return;
    }

    const medicationConfig = MEDICATIONS[patientInfo.medication];
    const now = new Date();
    const intakeTime = new Date(patientInfo.medicationTime);
    const hoursSinceIntake = (now.getTime() - intakeTime.getTime()) / (1000 * 60 * 60);

    const isInWindow =
      hoursSinceIntake >= medicationConfig.peakStartHours &&
      hoursSinceIntake <= medicationConfig.peakEndHours;

    let minutesToOptimal = 0;
    if (hoursSinceIntake < medicationConfig.peakStartHours) {
      minutesToOptimal = Math.round(
        (medicationConfig.peakStartHours - hoursSinceIntake) * 60
      );
    }

    set({ isOptimalWindow: isInWindow, minutesToOptimal });
  },

  // Calibration
  calibration: {
    reactionTimes: [],
    averageOffset: 0,
    isCalibrated: false,
    powerConfirmed: false,
    focusModeConfirmed: false,
  },
  setCalibration: (data) =>
    set((state) => ({
      calibration: { ...state.calibration, ...data },
    })),
  addCalibrationReaction: (time) =>
    set((state) => {
      const newTimes = [...state.calibration.reactionTimes, time];
      const avg =
        newTimes.length > 0
          ? newTimes.reduce((a, b) => a + b, 0) / newTimes.length
          : 0;
      return {
        calibration: {
          ...state.calibration,
          reactionTimes: newTimes,
          averageOffset: Math.round(avg),
          isCalibrated: newTimes.length >= 5,
        },
      };
    }),

  // Test Mode
  testMode: 'adult',
  setTestMode: (mode) => set({ testMode: mode }),

  // Test State
  isTestRunning: false,
  currentBlock: 1,
  currentTrial: 0,
  responses: [],
  startTest: () => set({ isTestRunning: true, currentBlock: 1, currentTrial: 0, responses: [] }),
  endTest: () => set({ isTestRunning: false }),
  addResponse: (response) =>
    set((state) => ({ responses: [...state.responses, response] })),
  setCurrentBlock: (block) => set({ currentBlock: block }),
  setCurrentTrial: (trial) => set({ currentTrial: trial }),

  // Results
  testResults: null,
  calculateResults: () => {
    const { responses, calibration } = get();
    
    // Calculate metrics
    const targets = responses.filter((r) => r.stimulusType === 'target');
    const hits = targets.filter((r) => r.responseType === 'hit');
    const commissions = responses.filter((r) => r.responseType === 'commission');
    
    // Attentiveness: correct hits / total targets
    const attentiveness = targets.length > 0 ? (hits.length / targets.length) * 100 : 0;
    
    // Timeliness: average reaction time for hits (adjusted by calibration offset)
    const validReactionTimes = hits
      .filter((r) => r.reactionTime !== null)
      .map((r) => (r.reactionTime as number) - calibration.averageOffset);
    const timeliness =
      validReactionTimes.length > 0
        ? validReactionTimes.reduce((a, b) => a + b, 0) / validReactionTimes.length
        : 0;
    
    // Impulsivity: commission errors / total non-targets
    const nonTargets = responses.filter((r) => r.stimulusType === 'non_target');
    const impulsivity =
      nonTargets.length > 0 ? (commissions.length / nonTargets.length) * 100 : 0;
    
    // Hyperactivity: timing errors + random responses
    const timingErrors = responses.filter((r) => r.responseType === 'timing_error');
    const hyperactivity = ((timingErrors.length / responses.length) * 100) || 0;

    set({
      testResults: {
        attentiveness,
        timeliness,
        impulsivity,
        hyperactivity,
        rawLog: responses,
      },
    });
  },

  // Reset
  resetTest: () =>
    set({
      isTestRunning: false,
      currentBlock: 1,
      currentTrial: 0,
      responses: [],
      testResults: null,
    }),
  resetAll: () =>
    set({
      currentScreen: 'welcome',
      patientInfo: {
        birthDate: null,
        gender: null,
        medication: 'none',
        dosage: 0,
        medicationTime: null,
      },
      isOptimalWindow: false,
      minutesToOptimal: 0,
      calibration: {
        reactionTimes: [],
        averageOffset: 0,
        isCalibrated: false,
        powerConfirmed: false,
        focusModeConfirmed: false,
      },
      testMode: 'adult',
      isTestRunning: false,
      currentBlock: 1,
      currentTrial: 0,
      responses: [],
      testResults: null,
    }),
}));
