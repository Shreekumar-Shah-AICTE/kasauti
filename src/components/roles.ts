import type { Role } from '@/core/probes/fallbackBank';

interface RoleMeta {
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
}

/** What each role means in plain words, so the choice is obvious without legal knowledge. */
export const ROLE_META: Readonly<Record<Role, RoleMeta>> = {
  tenant: { label: 'Renting a home', hint: 'Rent or leave-and-licence agreement', icon: '\u{1F3E0}' },
  employee: { label: 'Taking a job', hint: 'Offer letter, employment bond', icon: '\u{1F4BC}' },
  freelancer: {
    label: 'Freelance or contract work',
    hint: 'Client contract, statement of work',
    icon: '\u{1F58B}',
  },
  consumer: {
    label: 'Buying a product or service',
    hint: 'Terms, warranty, loan or policy',
    icon: '\u{1F6D2}',
  },
};
