/**
 * Phase 0 placeholder return — typed, not thrown.
 * Routes wired but unimplemented respond with 501 and this body shape.
 */
export interface NotImplementedResponse {
  status: 'not_implemented';
  endpoint: string;
  phase: 'phase-0';
}

export function notImplemented(endpoint: string): NotImplementedResponse {
  return { status: 'not_implemented', endpoint, phase: 'phase-0' };
}
