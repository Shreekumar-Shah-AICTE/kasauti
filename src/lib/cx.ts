/**
 * Joins class names, skipping empty and conditional ones. CSS-module lookups are
 * `string | undefined` under `noUncheckedIndexedAccess`, so every caller needs this guard.
 *
 * @param names - Class names; `false`, `null`, `undefined` and `''` are dropped.
 * @returns A space-separated class string. Complexity: O(names).
 */
export function cx(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter((name): name is string => typeof name === 'string' && name.length > 0).join(' ');
}
