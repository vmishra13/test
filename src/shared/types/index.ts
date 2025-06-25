/**
 * String format for time durations that the ms library accepts
 */
export type StringValue =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | `${number}y`;

// Export plan model types and validation
export * from './plan-model.types';
export { samplePlanModel, validateSamplePlan, safeParseSamplePlan } from './plan-model.sample';

// Export shared request types
export * from './request.types';