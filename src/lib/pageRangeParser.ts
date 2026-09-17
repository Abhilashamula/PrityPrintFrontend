/**
 * Parse a human-readable page range string into a sorted array of unique page numbers.
 *
 * Accepted formats:
 *   "1-5"        → [1, 2, 3, 4, 5]
 *   "1, 3, 7-9"  → [1, 3, 7, 8, 9]
 *   "5-3"        → [3, 4, 5]  (reversed range is normalised)
 *
 * Pages outside [1, maxPages] are silently clamped/dropped.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) return []

  const pages = new Set<number>()

  for (const segment of rangeStr.split(',')) {
    const part = segment.trim()
    if (!part) continue

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      let lo = parseInt(rangeMatch[1], 10)
      let hi = parseInt(rangeMatch[2], 10)
      if (lo > hi) [lo, hi] = [hi, lo]           // normalise reversed range
      lo = Math.max(1, lo)
      hi = Math.min(maxPages, hi)
      for (let p = lo; p <= hi; p++) pages.add(p)
    } else {
      const n = parseInt(part, 10)
      if (!isNaN(n) && n >= 1 && n <= maxPages) pages.add(n)
    }
  }

  return [...pages].sort((a, b) => a - b)
}

/**
 * Count the number of pages described by a range string.
 * Returns maxPages when the string is empty (treat as "all").
 */
export function countPagesInRange(rangeStr: string, maxPages: number): number {
  if (!rangeStr.trim()) return maxPages
  return parsePageRange(rangeStr, maxPages).length
}

/**
 * Validate that a range string is syntactically correct.
 * Returns an error message, or null if valid.
 */
export function validatePageRange(rangeStr: string, maxPages: number): string | null {
  if (!rangeStr.trim()) return null

  for (const segment of rangeStr.split(',')) {
    const part = segment.trim()
    if (!part) continue

    if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10)
      if (n < 1 || n > maxPages) return `Page ${n} is out of range (1–${maxPages})`
    } else if (/^\d+\s*-\s*\d+$/.test(part)) {
      // valid range
    } else {
      return `"${part}" is not a valid page or range`
    }
  }

  const count = countPagesInRange(rangeStr, maxPages)
  if (count === 0) return 'The selected range contains no valid pages'

  return null
}

