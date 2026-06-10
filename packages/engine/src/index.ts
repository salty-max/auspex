export type { DiceExpr } from './dice'
export { diceDistribution } from './dice'
export type { Distribution } from './distribution'
export {
  binomial,
  convolve,
  die,
  mean,
  normalize,
  percentile,
  point,
  probAtLeast,
  shift,
  variance,
} from './distribution'
export {
  atLeastOnD6,
  critProbability,
  hitProbability,
  type Reroll,
  rollProbability,
  type SaveContext,
  saveFailProbability,
  woundProbability,
  woundThreshold,
} from './rules'
export { simulate } from './sequence'
export type { Modifiers, SimResult, Target, Weapon } from './types'
