/**
 * A probability distribution over non-negative integers.
 *
 * `dist[k]` is the probability that the value equals `k`. Entries are expected to
 * sum to 1 (within floating-point tolerance) and the array is dense from index 0.
 */
export type Distribution = readonly number[]

/** A distribution with all of its mass on a single value. */
export function point(value: number): Distribution {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `Invalid point value: ${value} (non-negative integer required)`
    )
  }
  const d = new Array<number>(value + 1).fill(0)
  d[value] = 1
  return d
}

/** The uniform distribution over the faces of a single `sides`-sided die (1..sides). */
export function die(sides: number): Distribution {
  if (!Number.isInteger(sides) || sides < 1) {
    throw new Error(`Invalid die sides: ${sides} (positive integer required)`)
  }
  const d = new Array<number>(sides + 1).fill(0)
  for (let face = 1; face <= sides; face++) {
    d[face] = 1 / sides
  }
  return d
}

/**
 * Convolution of two distributions: the distribution of the sum of two independent
 * variables drawn from `a` and `b`.
 */
export function convolve(a: Distribution, b: Distribution): Distribution {
  const out = new Array<number>(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0) continue
    for (let j = 0; j < b.length; j++) {
      if (b[j] === 0) continue
      out[i + j] += a[i] * b[j]
    }
  }
  return out
}

/** Shift every value by `offset`, clamping into index 0 when the result would be negative. */
export function shift(d: Distribution, offset: number): Distribution {
  if (offset === 0) return d
  const out = new Array<number>(Math.max(1, d.length + offset)).fill(0)
  for (let i = 0; i < d.length; i++) {
    out[Math.max(0, i + offset)] += d[i]
  }
  return out
}

/**
 * The binomial distribution: the number of successes in `n` independent trials, each
 * succeeding with probability `p`.
 */
export function binomial(n: number, p: number): Distribution {
  if (n <= 0) return point(0)
  if (p >= 1) return point(n)
  if (p <= 0) return point(0)

  const out = new Array<number>(n + 1).fill(0)
  let term = (1 - p) ** n
  out[0] = term
  for (let k = 1; k <= n; k++) {
    term = (term * (n - k + 1) * p) / (k * (1 - p))
    out[k] = term
  }
  return out
}

/** The expected value of a distribution. */
export function mean(d: Distribution): number {
  let m = 0
  for (let k = 0; k < d.length; k++) {
    m += k * d[k]
  }
  return m
}

/** The variance of a distribution. */
export function variance(d: Distribution): number {
  const m = mean(d)
  let v = 0
  for (let k = 0; k < d.length; k++) {
    v += d[k] * (k - m) ** 2
  }
  return v
}

/** The probability that the value is at least `x` (fractional `x` rounds up). */
export function probAtLeast(d: Distribution, x: number): number {
  let p = 0
  for (let k = Math.max(0, Math.ceil(x)); k < d.length; k++) {
    p += d[k]
  }
  return p
}

/** The smallest value `v` such that `P(value <= v) >= p` (the `p`-quantile). */
export function percentile(d: Distribution, p: number): number {
  let cumulative = 0
  for (let k = 0; k < d.length; k++) {
    cumulative += d[k]
    if (cumulative >= p) return k
  }
  return Math.max(0, d.length - 1)
}

/** Rescale so the entries sum to 1, guarding against accumulated floating-point drift. */
export function normalize(d: Distribution): Distribution {
  const total = d.reduce((sum, x) => sum + x, 0)
  if (total === 0) return d
  return d.map((x) => x / total)
}
