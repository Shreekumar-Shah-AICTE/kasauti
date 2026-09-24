import { describe, expect, it } from 'vitest';

import { fallbackProbes, isRole, ROLES } from '@/core/probes/fallbackBank';

describe('fallbackProbes', () => {
  it.each(ROLES)('gives %s three unique probes', (role) => {
    const probes = fallbackProbes(role);
    expect(probes).toHaveLength(3);
    expect(new Set(probes.map((probe) => probe.id)).size).toBe(3);
    expect(probes.every((probe) => probe.question.endsWith('?'))).toBe(true);
  });
});

describe('isRole', () => {
  it.each([
    ['tenant', true],
    ['employee', true],
    ['landlord', false],
    ['', false],
  ])('%s -> %s', (value, expected) => {
    expect(isRole(value)).toBe(expected);
  });
});
