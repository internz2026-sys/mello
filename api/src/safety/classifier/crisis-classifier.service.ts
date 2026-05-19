import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';

import {
  CrisisVerdictSchema,
  FAIL_CLOSED_VERDICT,
  enforceVerdictInvariants,
  type CrisisVerdict,
} from '../../schemas';
import { CRISIS_CLASSIFIER_SYSTEM } from './crisis-classifier.prompt';
import type { CrisisClassifier, ClassifierInput } from './crisis-classifier.types';

/** Internal discriminated parse outcome. `reason` is a structural token,
 *  never an excerpt of the (potentially raw-text-bearing) model output. */
type ParseResult =
  | { ok: true; verdict: CrisisVerdict }
  | {
      ok: false;
      reason: 'classifier_output_unparseable' | 'classifier_schema_rejected';
    };

/**
 * Crisis classifier — safety-boundary.md v0.2 §4 / §7.
 *
 * Runs `claude -p` (Haiku-class) via subprocess, NOT the Anthropic SDK
 * (project directive: all Claude calls go through the CLI). Text is passed
 * on STDIN, never as an argv parameter — no shell, no injection, no
 * arg-length ceiling.
 *
 * FAIL CLOSED, NOT OPEN. Every failure mode — spawn error, non-zero exit,
 * timeout, unparseable envelope, unparseable verdict, schema violation —
 * resolves to FAIL_CLOSED_VERDICT (severe_acute_distress, full firebreak).
 * A malformed response is treated IDENTICALLY to an outage. The verdict is
 * never optimistically `none` on any error path.
 */
@Injectable()
export class CrisisClassifierService implements CrisisClassifier {
  private readonly log = new Logger(CrisisClassifierService.name);
  private readonly cli = process.env.CLAUDE_CLI || 'claude';
  private readonly model = process.env.MELLO_CLASSIFIER_MODEL || 'haiku';
  private readonly timeoutMs = Number(
    process.env.MELLO_CLASSIFIER_TIMEOUT_MS || 20_000,
  );

  async classify(input: ClassifierInput): Promise<CrisisVerdict> {
    const region = (input.resourceRegion || 'UNKNOWN').trim() || 'UNKNOWN';
    let raw: string;
    try {
      raw = await this.invokeCli(input.text);
    } catch (e) {
      // Outage / spawn failure / timeout → fail closed. The error message is
      // a STRUCTURAL TOKEN only (classifier_timeout|classifier_subprocess_
      // failed) — never stdout/stderr/raw input. Default if somehow untyped.
      const reason =
        e instanceof Error && e.message ? e.message : 'classifier_subprocess_failed';
      this.log.error(`classifier failed → fail closed [${reason}]`);
      return { ...FAIL_CLOSED_VERDICT, resource_region: region };
    }

    const parsed = this.parse(raw);
    if (!parsed.ok) {
      // Malformed == outage. Never optimistically none. Reason is one of
      // classifier_output_unparseable | classifier_schema_rejected — a
      // structural token, carrying no excerpt of the model output.
      this.log.error(`classifier verdict rejected → fail closed [${parsed.reason}]`);
      return { ...FAIL_CLOSED_VERDICT, resource_region: region };
    }
    const verdict = parsed.verdict;

    // Region: trust our hint over the model; the model must never invent one.
    const withRegion: CrisisVerdict = {
      ...verdict,
      resource_region:
        region !== 'UNKNOWN' ? region : verdict.resource_region || 'UNKNOWN',
    };
    // Code enforces the §4 safety-critical invariants regardless of what the
    // model set. The model's booleans are advisory only.
    return enforceVerdictInvariants(withRegion);
  }

  private invokeCli(text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const args = [
        '-p',
        '--system-prompt',
        CRISIS_CLASSIFIER_SYSTEM,
        '--model',
        this.model,
        '--output-format',
        'json',
        '--disable-slash-commands',
        '--permission-mode',
        'bypassPermissions',
      ];
      const child = spawn(this.cli, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGKILL');
        // Structural token only — the timeout duration is config, not content.
        reject(new Error('classifier_timeout'));
      }, this.timeoutMs);

      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        // Log only the structural errno code (e.g. ENOENT), never err.message
        // which a future Node/CLI build could decorate with the command line.
        const codeTag =
          err && typeof (err as NodeJS.ErrnoException).code === 'string'
            ? (err as NodeJS.ErrnoException).code
            : 'unknown';
        this.log.debug(`classifier spawn error [errno ${codeTag}]`);
        reject(new Error('classifier_subprocess_failed'));
      });

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          // NEVER embed stderr/stdout in the error: the classifier input is
          // raw user crisis text and a future CLI version could echo it into
          // either stream. Surface only the exit code + redacted byte counts.
          this.log.debug(
            `classifier nonzero exit ${code} ` +
              `[stderr ${stderr.length}b, stdout ${stdout.length}b — content withheld]`,
          );
          reject(new Error('classifier_subprocess_failed'));
          return;
        }
        resolve(stdout);
      });

      // Text on stdin — no argv, no shell, no injection, no length ceiling.
      child.stdin.write(text);
      child.stdin.end();
    });
  }

  /** Parse the CLI JSON envelope → result string → verdict JSON → schema.
   *  Discriminated result; caller fails closed on either failure. The reason
   *  is a structural token only — it never carries a slice of the output. */
  private parse(rawEnvelope: string): ParseResult {
    let resultText: string;
    try {
      const env = JSON.parse(rawEnvelope) as {
        result?: string;
        is_error?: boolean;
      };
      if (env.is_error || typeof env.result !== 'string') {
        return { ok: false, reason: 'classifier_output_unparseable' };
      }
      resultText = env.result.trim();
    } catch {
      return { ok: false, reason: 'classifier_output_unparseable' };
    }

    // Strip a ```json fence if the model added one despite instructions.
    if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
    }

    let obj: unknown;
    try {
      obj = JSON.parse(resultText);
    } catch {
      return { ok: false, reason: 'classifier_output_unparseable' };
    }
    const parsed = CrisisVerdictSchema.safeParse(obj);
    if (!parsed.success) {
      return { ok: false, reason: 'classifier_schema_rejected' };
    }
    return { ok: true, verdict: parsed.data };
  }
}
