/**
 * Cross-session proactive suppression (safety-boundary.md v0.2 §6.5).
 *
 * NOT a crisis-risk label. A time-boxed, non-semantic "do not initiate
 * contact until X" flag. A later crisis EXTENDS the window, never shortens
 * an existing one.
 *
 * The interrupt middleware (4B.3) depends on this PORT, not on a concrete
 * implementation — dependency inversion so the keystone composes a complete
 * firebreak while the implementation is supplied here (4B.6).
 */
export interface ProactiveSuppressionPort {
  /**
   * Pause proactive engagement for the user until at least `until`.
   * Idempotent and monotonic: never reduces an existing later pause.
   * Returns a structured result; on failure the firebreak is unaffected
   * (the bridge is already shown) but the failure is surfaced so it can
   * be logged to safety_events.
   */
  pauseProactiveEngagement(
    userId: string,
    until: Date,
  ): Promise<SuppressionResult>;

  /**
   * Scheduler gate. Fail-safe toward SILENCE: if the state cannot be
   * determined, returns true (treat as paused). Not contacting someone
   * who may have just had a crisis is the safe failure.
   */
  isProactiveEngagementPaused(userId: string): Promise<boolean>;
}

export type SuppressionResult =
  | { status: 'paused'; until: string }
  | { status: 'failed'; reason: string };
