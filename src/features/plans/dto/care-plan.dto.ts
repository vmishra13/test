/**
 * Care Plan DTOs for ReliaCare Mobile App
 * Focused on care plan management workflows
 */

// ===================================================================
// CARE PLAN MANAGEMENT
// ===================================================================
export interface CarePlanRequest {
  currentInjuries?: string[];
  priorInjuries?: string[];
  goals?: string[];
  preferences?: {
    exerciseFrequency?: 'daily' | 'weekly' | 'biweekly';
    reminderTime?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
  notes?: string;
}

export interface Injury {
  id: number;
  type: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
  dateOccurred?: string;
  description?: string;
  status: 'active' | 'healing' | 'resolved';
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  duration?: number; // minutes
  sets?: number;
  reps?: number;
  instructions: string[];
  videoUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  targetDate?: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  milestones: string[];
}

export interface LearningModule {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedTime: number; // minutes
  thumbnailUrl?: string;
  contentUrl: string;
  completed: boolean;
}

export interface CarePlanResponse {
  success: boolean;
  data: {
    carePlan: {
      id: number;
      currentPhase: string;
      progress: number; // 0-100
      currentInjuries: Injury[];
      priorInjuries: Injury[];
      exercises: Exercise[];
      goals: Goal[];
      nextAppointment?: {
        date: string;
        time: string;
        doctor: string;
        type: string;
      };
      learningModules: LearningModule[];
      preferences: {
        exerciseFrequency: string;
        reminderTime?: string;
        difficultyLevel: string;
      };
      lastUpdated: string;
    };
  };
}

// ===================================================================
// INJURY TRACKING
// ===================================================================
export interface InjuryTrackingRequest {
  injuryType: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
  painLevel: number; // 1-10 scale
  description?: string;
  dateOccurred?: string;
  symptoms: string[];
  treatmentActions?: string[];
}

export interface InjuryTrackingResponse {
  success: boolean;
  data: {
    injury: Injury;
    recommendedActions: string[];
    shouldSeekMedicalAttention: boolean;
    carePlanAdjustments?: {
      addedExercises: Exercise[];
      modifiedExercises: Exercise[];
      removedExercises: number[];
    };
  };
}

export interface InjuriesListResponse {
  success: boolean;
  data: {
    currentInjuries: Injury[];
    priorInjuries: Injury[];
    totalCount: number;
    trends: {
      mostCommonType: string;
      averageHealingTime: number; // days
      reinjuryRate: number; // percentage
    };
  };
}
