/** Who is about to sign. Drives which beliefs are worth probing. */
export const ROLES = ['tenant', 'employee', 'freelancer', 'consumer'] as const;

/** A signer role. */
export type Role = (typeof ROLES)[number];

/** A question that asks the user to state a belief in their own words (teach-back). */
export interface Probe {
  readonly id: string;
  readonly topic: string;
  readonly question: string;
}

/**
 * Hand-written probes used when the model is unavailable. Each targets a topic where
 * signers' beliefs most often differ from the paper.
 */
const FALLBACK_PROBES: Readonly<Record<Role, readonly Probe[]>> = {
  tenant: [
    {
      id: 'tenant-deposit',
      topic: 'Deposit',
      question: 'When you move out, how much of your deposit do you expect back, and when?',
    },
    {
      id: 'tenant-exit',
      topic: 'Leaving early',
      question: 'If you need to leave after 4 months, what do you think happens?',
    },
    {
      id: 'tenant-costs',
      topic: 'Extra costs',
      question: 'Which costs besides rent (maintenance, repairs, bills) do you think you pay?',
    },
  ],
  employee: [
    {
      id: 'employee-notice',
      topic: 'Notice period',
      question: 'If you resign, how much notice do you think you must give?',
    },
    {
      id: 'employee-bond',
      topic: 'Bond or penalty',
      question: 'Do you think you owe any money if you leave within the first year?',
    },
    {
      id: 'employee-pay',
      topic: 'Pay',
      question: 'What do you think your monthly in-hand pay is, and what is variable?',
    },
  ],
  freelancer: [
    {
      id: 'freelancer-payment',
      topic: 'Payment',
      question: 'When do you think you get paid, and what if the client pays late?',
    },
    {
      id: 'freelancer-ip',
      topic: 'Ownership',
      question: 'Who do you think owns the work, and can you show it in your portfolio?',
    },
    {
      id: 'freelancer-exit',
      topic: 'Ending the contract',
      question: 'If the client cancels midway, what do you think you are paid?',
    },
  ],
  consumer: [
    {
      id: 'consumer-cancel',
      topic: 'Cancelling',
      question: 'How do you think you can cancel, and what does it cost?',
    },
    {
      id: 'consumer-fees',
      topic: 'Fees',
      question: 'Which charges or penalties do you think can be added later?',
    },
    {
      id: 'consumer-data',
      topic: 'Your data',
      question: 'What do you think the company can do with your personal data?',
    },
  ],
};

/**
 * Returns deterministic probe questions for a role (offline mode).
 *
 * @param role - The signer's role.
 * @returns The role's probes, in display order. Complexity: O(1).
 */
export function fallbackProbes(role: Role): readonly Probe[] {
  return FALLBACK_PROBES[role];
}

/**
 * Narrows an arbitrary string to a known role.
 *
 * @returns `true` when `value` is one of {@link ROLES}. Complexity: O(r).
 */
export function isRole(value: string): value is Role {
  return ROLES.some((role) => role === value);
}
