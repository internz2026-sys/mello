/**
 * S5-1 — Credential-distinctness startup guard.
 *
 * Operationalizes architecture-debt finding AD-1 / safety-boundary.md §9:
 * the crisis-containment model depends on FOUR separate database
 * credentials. Collapsing any of them into one shared URL silently
 * defeats the containment WITHOUT any code change. This guard makes that
 * misconfiguration a HARD BOOT FAILURE instead of a silent collapse.
 *
 * Pure + dependency-free so it can run before any DB pool is constructed
 * and be unit-tested without booting Nest. It NEVER prints a credential
 * value — only structural reasons and the offending ENV VAR NAMES.
 *
 * It does not touch, import, or alter any crisis logic. It only refuses
 * to start a process whose safety credentials are not isolated.
 */

/** The three least-privilege runtime credentials. Each must be present,
 *  distinct from the others, and distinct from the admin/migration URL. */
export const REQUIRED_SAFETY_DB_VARS = [
  'QUARANTINE_DATABASE_URL',
  'SAFETY_EVENTS_DATABASE_URL',
  'SUPPRESSION_DATABASE_URL',
] as const;

/** The privileged migration/admin connection. Optional at runtime, but if
 *  set, no runtime safety credential may equal it. */
export const ADMIN_DB_VAR = 'DATABASE_URL';

export class CredentialIsolationError extends Error {
  readonly violations: string[];
  constructor(violations: string[]) {
    super(
      'credential_isolation: refusing to start — the four database ' +
        'credentials are not isolated. ' +
        violations.join('; ') +
        '. Each *_DATABASE_URL must be a distinct least-privilege ' +
        'credential (see docs/step5-internal-alpha.md S5-1).',
    );
    this.name = 'CredentialIsolationError';
    this.violations = violations;
  }
}

type EnvLike = Record<string, string | undefined>;

/** Trimmed value, or undefined if absent/blank. */
function val(env: EnvLike, key: string): string | undefined {
  const v = env[key];
  if (v == null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Throws {@link CredentialIsolationError} (listing every violation, with
 * NO credential values) unless the safety DB credentials are present and
 * mutually distinct, and none equals the admin/migration URL.
 */
export function assertDistinctSafetyCredentials(
  env: EnvLike = process.env,
): void {
  const violations: string[] = [];

  // 1. Presence.
  const present: Record<string, string> = {};
  for (const key of REQUIRED_SAFETY_DB_VARS) {
    const v = val(env, key);
    if (v === undefined) {
      violations.push(`${key} is not set`);
    } else {
      present[key] = v;
    }
  }

  // 2. Pairwise distinctness among the runtime safety credentials.
  const names = Object.keys(present);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (present[names[i]] === present[names[j]]) {
        violations.push(
          `${names[i]} and ${names[j]} share the same credential`,
        );
      }
    }
  }

  // 3. None may equal the admin/migration URL (if that is configured).
  const admin = val(env, ADMIN_DB_VAR);
  if (admin !== undefined) {
    for (const key of names) {
      if (present[key] === admin) {
        violations.push(
          `${key} must not reuse the admin/migration ${ADMIN_DB_VAR}`,
        );
      }
    }
  }

  if (violations.length > 0) {
    throw new CredentialIsolationError(violations);
  }
}
