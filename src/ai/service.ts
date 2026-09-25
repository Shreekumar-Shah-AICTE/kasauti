import { type AiFailure, type AiResult, callStructured, type GenerateText } from '@/ai/client';
import { offlineFinding, offlineFindings } from '@/ai/fallbackProvider';
import { buildCheckPrompt, buildProbePrompt, type Prompt } from '@/ai/prompts';
import {
  CHECK_JSON_SCHEMA,
  type CheckResponse,
  CheckResponseSchema,
  PROBE_JSON_SCHEMA,
  ProbeResponseSchema,
} from '@/ai/schemas';
import { AI } from '@/core/constants';
import { fallbackProbes, type Probe, type Role } from '@/core/probes/fallbackBank';
import { buildEvidenceContext, type EvidenceContext, resolveFinding } from '@/core/verdict/policy';
import type { BeliefInput, ResolvedFinding } from '@/core/verdict/types';

/** Injected dependencies. `generate: null` means no API key: run fully offline. */
export interface AiDeps {
  readonly generate: GenerateText | null;
  readonly timeoutMs: number;
}

/** Whether results came from the model or the deterministic fallback. */
export type Mode = 'live' | 'offline';

export interface ProbeOutcome {
  readonly mode: Mode;
  readonly probes: readonly Probe[];
  /** Why the model was not used. Present only in offline mode after an attempt. */
  readonly failure?: AiFailure;
}

export interface CheckOutcome {
  readonly mode: Mode;
  readonly findings: readonly ResolvedFinding[];
  /** Why the model was not used. Present only in offline mode after an attempt. */
  readonly failure?: AiFailure;
}

function uniqueById(probes: readonly Probe[]): Probe[] {
  const seen = new Set<string>();
  return probes.filter((probe) => {
    const fresh = !seen.has(probe.id);
    seen.add(probe.id);
    return fresh;
  });
}

/**
 * Produces teach-back probe questions for a document, falling back to the hand-written bank.
 *
 * @param deps - Injected generator and timeout.
 * @param input - Role and document text.
 * @returns Probes and the mode that produced them. Complexity: at most two model calls.
 */
export async function generateProbes(
  deps: AiDeps,
  input: { readonly role: Role; readonly documentText: string },
): Promise<ProbeOutcome> {
  const offline: ProbeOutcome = { mode: 'offline', probes: fallbackProbes(input.role) };
  if (deps.generate === null) {
    return offline;
  }
  const result = await callStructured(
    deps.generate,
    {
      model: AI.probeModel,
      thinking: null,
      prompt: buildProbePrompt(input.role, input.documentText.slice(0, AI.probeExcerptChars)),
      schema: ProbeResponseSchema,
      jsonSchema: PROBE_JSON_SCHEMA,
    },
    deps.timeoutMs,
  );
  return result.ok
    ? { mode: 'live', probes: uniqueById(result.value.probes) }
    : { ...offline, failure: result.failure };
}

/**
 * Joins model findings back to the user's beliefs. Findings for unknown belief ids are
 * dropped; beliefs the model skipped get an honest offline finding.
 */
function mergeFindings(
  context: EvidenceContext,
  beliefs: readonly BeliefInput[],
  findings: CheckResponse['findings'],
): ResolvedFinding[] {
  const byId = new Map(findings.map((finding) => [finding.beliefId, finding]));
  return beliefs.map((belief) => {
    const finding = byId.get(belief.id);
    return finding === undefined ? offlineFinding(context, belief) : resolveFinding(context, finding);
  });
}

/**
 * Runs the batched check, downgrading to the fallback model when the primary one is
 * unreachable for this API key. A provider error on a specific model id must not cost the
 * user a real verdict, while timeouts are not retried so latency stays bounded.
 *
 * @returns The validated model reply or the last failure. Complexity: at most four model calls.
 */
async function runCheckCall(
  generate: GenerateText,
  request: { readonly prompt: Prompt; readonly timeoutMs: number },
): Promise<AiResult<CheckResponse>> {
  const call = {
    thinking: 'low',
    prompt: request.prompt,
    schema: CheckResponseSchema,
    jsonSchema: CHECK_JSON_SCHEMA,
  } as const;
  const primary = await callStructured(generate, { ...call, model: AI.checkModel }, request.timeoutMs);
  if (primary.ok || primary.failure !== 'provider_error') {
    return primary;
  }
  return callStructured(generate, { ...call, model: AI.fallbackCheckModel }, request.timeoutMs);
}

/**
 * Checks every belief against the document in one batched model call, then applies the
 * deterministic verdict policy. Falls back to offline findings on any AI failure.
 *
 * @param deps - Injected generator and timeout.
 * @param input - Page texts and beliefs.
 * @returns Findings in belief order and the mode used. Complexity: at most two model calls + O(b · n).
 */
export async function checkBeliefs(
  deps: AiDeps,
  input: { readonly pages: readonly string[]; readonly beliefs: readonly BeliefInput[] },
): Promise<CheckOutcome> {
  const context = buildEvidenceContext(input.pages);
  const offline = (failure?: AiFailure): CheckOutcome => ({
    mode: 'offline',
    findings: offlineFindings(context, input.beliefs),
    ...(failure === undefined ? {} : { failure }),
  });
  if (deps.generate === null) {
    return offline();
  }
  const result = await runCheckCall(deps.generate, {
    prompt: buildCheckPrompt(context.paged.text, input.beliefs),
    timeoutMs: deps.timeoutMs,
  });
  return result.ok
    ? { mode: 'live', findings: mergeFindings(context, input.beliefs, result.value.findings) }
    : offline(result.failure);
}
