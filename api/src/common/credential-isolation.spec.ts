/**
 * S5-1 — credential-distinctness startup guard tests.
 * Covers: valid sets, missing, blank, duplicated, admin-collision,
 * whitespace-equality, multi-violation, and the no-secret-leak guarantee.
 */
import {
  assertDistinctSafetyCredentials,
  CredentialIsolationError,
  REQUIRED_SAFETY_DB_VARS,
  ADMIN_DB_VAR,
} from './credential-isolation';

const Q = 'QUARANTINE_DATABASE_URL';
const E = 'SAFETY_EVENTS_DATABASE_URL';
const S = 'SUPPRESSION_DATABASE_URL';

const distinct = () => ({
  [Q]: 'postgres://q_role:qpw@h:5432/db',
  [E]: 'postgres://e_role:epw@h:5432/db',
  [S]: 'postgres://s_role:spw@h:5432/db',
});

describe('S5-1 assertDistinctSafetyCredentials', () => {
  it('passes when all three are present and distinct', () => {
    expect(() => assertDistinctSafetyCredentials(distinct())).not.toThrow();
  });

  it('passes when DATABASE_URL is set and distinct from all three', () => {
    expect(() =>
      assertDistinctSafetyCredentials({
        ...distinct(),
        [ADMIN_DB_VAR]: 'postgres://admin:apw@h:5432/db',
      }),
    ).not.toThrow();
  });

  it.each(REQUIRED_SAFETY_DB_VARS)('throws when %s is missing', (missing) => {
    const env = distinct() as Record<string, string | undefined>;
    delete env[missing];
    expect(() => assertDistinctSafetyCredentials(env)).toThrow(
      CredentialIsolationError,
    );
    try {
      assertDistinctSafetyCredentials(env);
    } catch (err) {
      expect((err as CredentialIsolationError).violations).toContain(
        `${missing} is not set`,
      );
    }
  });

  it('treats a blank/whitespace-only value as missing', () => {
    const env = { ...distinct(), [S]: '   ' };
    expect(() => assertDistinctSafetyCredentials(env)).toThrow(
      /SUPPRESSION_DATABASE_URL is not set/,
    );
  });

  it('throws when two safety credentials are identical', () => {
    const shared = 'postgres://same:pw@h:5432/db';
    const env = { ...distinct(), [Q]: shared, [E]: shared };
    expect(() => assertDistinctSafetyCredentials(env)).toThrow(
      /QUARANTINE_DATABASE_URL and SAFETY_EVENTS_DATABASE_URL share the same credential/,
    );
  });

  it('treats whitespace-padded equal URLs as the same credential', () => {
    const env = {
      ...distinct(),
      [Q]: 'postgres://x:pw@h/db',
      [S]: '  postgres://x:pw@h/db  ',
    };
    expect(() => assertDistinctSafetyCredentials(env)).toThrow(
      /share the same credential/,
    );
  });

  it('throws when a safety credential reuses the admin/migration URL', () => {
    const admin = 'postgres://postgres:postgres@h:5432/db';
    const env = { ...distinct(), [E]: admin, [ADMIN_DB_VAR]: admin };
    expect(() => assertDistinctSafetyCredentials(env)).toThrow(
      /SAFETY_EVENTS_DATABASE_URL must not reuse the admin\/migration DATABASE_URL/,
    );
  });

  it('collects every violation, not just the first', () => {
    const dup = 'postgres://dup:pw@h/db';
    const env = { [Q]: dup, [E]: dup }; // S missing AND Q==E
    try {
      assertDistinctSafetyCredentials(env);
      fail('expected throw');
    } catch (err) {
      const v = (err as CredentialIsolationError).violations;
      expect(v).toContain('SUPPRESSION_DATABASE_URL is not set');
      expect(v.some((x) => x.includes('share the same credential'))).toBe(true);
    }
  });

  it('NEVER includes a credential value in the error (no secret leak)', () => {
    const secret = 'postgres://leaky:SUPER-SECRET-PW-9q2@host:5432/db';
    const env = { [Q]: secret, [E]: secret, [S]: secret, [ADMIN_DB_VAR]: secret };
    try {
      assertDistinctSafetyCredentials(env);
      fail('expected throw');
    } catch (err) {
      const e = err as CredentialIsolationError;
      expect(e.message).not.toContain('SUPER-SECRET-PW-9q2');
      expect(e.message).not.toContain(secret);
      expect(JSON.stringify(e.violations)).not.toContain('SUPER-SECRET-PW-9q2');
      // it should still name the offending ENV VARS
      expect(e.message).toContain('QUARANTINE_DATABASE_URL');
    }
  });
});
