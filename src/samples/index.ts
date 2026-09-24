import { FREELANCE_CONTRACT } from '@/samples/freelanceContract';
import { OFFER_LETTER } from '@/samples/offerLetter';
import { RENT_AGREEMENT } from '@/samples/rentAgreement';
import type { SampleDocument } from '@/samples/types';

export type { SampleDocument } from '@/samples/types';

/** Every sample document, in the order shown to the user. */
export const SAMPLES: readonly SampleDocument[] = [RENT_AGREEMENT, OFFER_LETTER, FREELANCE_CONTRACT];

/**
 * Finds a sample by id.
 *
 * @param id - Sample identifier from the chooser.
 * @returns The sample, or `null` when the id is unknown. Complexity: O(samples).
 */
export function findSample(id: string): SampleDocument | null {
  return SAMPLES.find((sample) => sample.id === id) ?? null;
}
