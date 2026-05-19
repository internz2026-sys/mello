import type { CrisisVerdict } from '../../schemas';

/**
 * The classifier is infrastructure, not intelligence (safety-boundary.md
 * §4). It takes text + an optional region hint and returns a structured
 * verdict. It NEVER returns prose, NEVER converses, and NEVER fails open.
 */
export interface CrisisClassifier {
  classify(input: ClassifierInput): Promise<CrisisVerdict>;
}

export interface ClassifierInput {
  text: string;
  /** Region hint from profile locale; classifier echoes/normalizes it. */
  resourceRegion?: string;
}
