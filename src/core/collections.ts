/**
 * Reads an element that the caller's algorithm guarantees exists. Centralising the check
 * keeps `noUncheckedIndexedAccess` strict without scattering silent `?? 0` fallbacks,
 * which would hide real bugs behind plausible-looking numbers.
 *
 * @param items - Any array-like collection.
 * @param index - Index that must be in range.
 * @returns The element at `index`.
 * @throws RangeError when `index` is out of range (a programming error, never user input).
 * Complexity: O(1).
 */
export function valueAt<T>(items: ArrayLike<T>, index: number): T {
  const value = items[index];
  if (value === undefined) {
    throw new RangeError(`Index ${String(index)} is out of range for length ${String(items.length)}`);
  }
  return value;
}

/**
 * Reads a count from a frequency map, treating a missing key as zero.
 *
 * @returns The stored count or 0. Complexity: O(1).
 */
export function countOf(counts: ReadonlyMap<string, number>, key: string): number {
  return counts.get(key) ?? 0;
}
