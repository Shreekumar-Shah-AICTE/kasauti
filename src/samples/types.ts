import type { Role } from '@/core/probes/fallbackBank';
import type { BeliefInput } from '@/core/verdict/types';

/**
 * A synthetic document shipped with the app so anyone can try Kasauti without uploading
 * anything private. Every sample is written for this project: no real contract is copied.
 */
export interface SampleDocument {
  readonly id: string;
  /** Short name shown on the chooser button. */
  readonly title: string;
  /** The role this document is written for, used to preselect the probe set. */
  readonly role: Role;
  /** One line explaining what is interesting about this document. */
  readonly summary: string;
  /** Page texts, one entry per page, in order. */
  readonly pages: readonly string[];
  /**
   * Beliefs a real signer plausibly holds about this document. Chosen so the report shows
   * every verdict: one the paper backs, one it contradicts, and one it never mentions.
   */
  readonly beliefs: readonly BeliefInput[];
}
