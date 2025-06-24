/**
 * Plan Data Model Types
 * 
 * TypeScript interfaces generated from approved JSON structure
 * DO NOT modify this structure - it has been approved
 */

import { z } from 'zod';

// ===================================================================
// 🎯 ZOD SCHEMAS FOR VALIDATION
// ===================================================================

// Base media schema
export const MediaSchema = z.object({
  name: z.string(),
  type: z.string(),
  url: z.string(),
});

// Diagnosis schema
export const DiagnosisSchema = z.object({
  id: z.number(),
  title: z.string(),
  body_area: z.string(),
  group_type: z.string(),
  left_ICD10: z.string(),
  right_IDC10: z.string(),
  bilateral_IDC10: z.string(),
  na_IDC10: z.string(),
});

// Journey schema
export const JourneySchema = z.object({
  type: z.string(), // "Surgical" or "Non-Surgical"
  recoveryTime: z.string(),
  recoveryTimeUnit: z.string(), // "Week" or "Months"
});

// Node type definitions
export const NodeTypeSchema = z.enum(["RootNode", "ChildNode", "LeafdNode", "LeafNode"]);

// Base node schema (recursive) - using z.lazy for self-reference
export const BaseNodeSchema: z.ZodSchema = z.lazy(() => z.object({
  id: z.number(),
  node_type: NodeTypeSchema,
  title: z.string(),
  text: z.string(),
  media: MediaSchema,
  items: z.array(BaseNodeSchema),
}));

// Learning content schema
export const LearningContentSchema = BaseNodeSchema;

// Goal schema
export const GoalSchema = z.object({
  id: z.number(),
  title: z.string(),
  text: z.string(),
});

// Precaution schema
export const PrecautionSchema = z.object({
  id: z.number(),
  title: z.string(),
  text: z.string(),
});

// Milestone schema
export const MilestoneSchema = z.object({
  id: z.number(),
  durationUnit: z.string(),
  fromDuration: z.number(),
  toDuration: z.number(),
  goals: z.array(GoalSchema).optional(),
  precaution: PrecautionSchema.optional(),
  media: MediaSchema.optional(),
});

// Procedure schema
export const ProcedureSchema = z.object({
  title: z.string(),
  text: z.string(),
});

// Exercise schema
export const ExerciseSchema = z.object({
  id: z.number(),
  title: z.string(),
  text: z.string(),
  set: z.number(),
  repetition: z.number(),
  showCheckbox: z.boolean(),
  media: MediaSchema,
  purpose: z.string(),
  procedure: ProcedureSchema,
});

// Timeline schema
export const TimelineSchema = z.object({
  durationUnit: z.string(),
  fromDuration: z.number(),
  toDuration: z.number(),
  exercises: z.array(ExerciseSchema),
});

// Care journey schema
export const CareJourneySchema = z.object({
  title: z.string(),
  description: z.string(),
  selected: z.boolean(),
  media: MediaSchema,
  weeklyUnit: z.string(),
  dailyUnit: z.string(),
  selectedDays: z.array(z.number()),
  timeLines: z.array(TimelineSchema),
});

// Medication schema
export const MedicationSchema = z.object({
  id: z.number(),
  name: z.string(),
  identifier: z.string(),
  code: z.string(),
  dosageForm: z.string().optional(),
  dosageFrom: z.string().optional(), // Note: keeping the typo as it exists in approved structure
  strength: z.string(),
  timeUnit: z.string(),
  timeUnitValue: z.number(),
  timePeriod: z.number(),
});

// Main plan schema
export const PlanSchema = z.object({
  planID: z.number(),
  primaryDiagnosis: DiagnosisSchema,
  relatedDiagnosis: z.array(DiagnosisSchema),
  note: z.string(),
  journey: JourneySchema,
  preOpLearning: LearningContentSchema,
  postOpLearning: LearningContentSchema,
  preMilestones: z.array(MilestoneSchema),
  postMilestones: z.array(MilestoneSchema),
  careJourney: z.array(CareJourneySchema),
  medication: z.array(MedicationSchema),
});

// Root schema
export const PlanDataModelSchema = z.object({
  plan: PlanSchema,
});

// Complete plan model schema
export const CompletePlanModelSchema = PlanDataModelSchema;

// ===================================================================
// 🎯 TYPESCRIPT INTERFACES (INFERRED FROM ZOD)
// ===================================================================

// Base media interface
export type Media = z.infer<typeof MediaSchema>;

// Diagnosis interface
export type Diagnosis = z.infer<typeof DiagnosisSchema>;

// Journey interface
export type Journey = z.infer<typeof JourneySchema>;

// Node type definitions
export type NodeType = z.infer<typeof NodeTypeSchema>;

// Base node interface for hierarchical structure
export type BaseNode = z.infer<typeof BaseNodeSchema>;

// Learning content structure (Pre-op and Post-op)
export type LearningContent = z.infer<typeof LearningContentSchema>;

// Goal interface
export type Goal = z.infer<typeof GoalSchema>;

// Precaution interface
export type Precaution = z.infer<typeof PrecautionSchema>;

// Milestone interface
export type Milestone = z.infer<typeof MilestoneSchema>;

// Procedure interface for exercises
export type Procedure = z.infer<typeof ProcedureSchema>;

// Exercise interface
export type Exercise = z.infer<typeof ExerciseSchema>;

// Timeline interface for care journey
export type Timeline = z.infer<typeof TimelineSchema>;

// Care journey interface
export type CareJourney = z.infer<typeof CareJourneySchema>;

// Medication interface
export type Medication = z.infer<typeof MedicationSchema>;

// Main plan interface
export type Plan = z.infer<typeof PlanSchema>;

// Root interface
export type PlanDataModel = z.infer<typeof PlanDataModelSchema>;

// Export type for the complete structure
export type CompletePlanModel = z.infer<typeof CompletePlanModelSchema>;

// ===================================================================
// 🎯 VALIDATION HELPERS
// ===================================================================

/**
 * Validate a complete plan model
 */
export function validatePlanModel(data: unknown): CompletePlanModel {
  return CompletePlanModelSchema.parse(data);
}

/**
 * Safely validate a plan model (returns null on error)
 */
export function safeParsePlanModel(data: unknown): CompletePlanModel | null {
  const result = CompletePlanModelSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate just the plan portion (without the wrapper)
 */
export function validatePlan(data: unknown): Plan {
  return PlanSchema.parse(data);
}

/**
 * Safely validate just the plan portion
 */
export function safeParsePlan(data: unknown): Plan | null {
  const result = PlanSchema.safeParse(data);
  return result.success ? result.data : null;
}
