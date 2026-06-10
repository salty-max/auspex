# 40k 10th Edition — Attack Sequence

Reference for the rules implemented by `@auspex/engine`. Quotes are verbatim from the
official 10th edition Core Rules (free download from Games Workshop, mirrored on
Wahapedia). Each section notes how the engine implements the rule.

Sources:

- [Wahapedia — Core Rules](https://wahapedia.ru/wh40k10ed/the-rules/core-rules/)
- [Wahapedia — Quick Start Guide](https://wahapedia.ru/wh40k10ed/the-rules/quick-start-guide/)
- [Warhammer Community — Core Rules downloads](https://www.warhammer-community.com/warhammer-40000-downloads/)

The sequence: **Hit roll → Wound roll → Allocate attack → Saving throw → Inflict
damage**, with Feel No Pain applied as wounds are lost.

## 1. Hit roll

> If the result of the Hit roll is greater than or equal to the attack's Ballistic
> Skill (if the attack is being made with a ranged weapon) or its Weapon Skill (if the
> attack is being made with a melee weapon), then that Hit roll is successful and
> scores one hit against the target unit.

- > An unmodified Hit roll of 6 is called a Critical Hit and is always successful.
- > An unmodified Hit roll of 1 always fails.
- > A Hit roll can never be modified by more than -1 or +1.

**Engine:** `hitProbability` in `rules.ts`. Auto-fail on 1, auto-success on 6, and the
net modifier is clamped to ±1. Torrent weapons skip the roll entirely (see
[weapon abilities](10e-weapon-abilities.md)).

## 2. Wound roll

| Strength vs Toughness                  | Wound on |
| -------------------------------------- | -------- |
| S is twice (or more than twice) T      | 2+       |
| S is greater than T                    | 3+       |
| S is equal to T                        | 4+       |
| S is less than T                       | 5+       |
| S is half (or less than half) T        | 6+       |

- > An unmodified Wound roll of 6 is called a Critical Wound and is always successful.
- > An unmodified Wound roll of 1 always fails.
- > A Wound roll can never be modified by more than -1 or +1.

**Engine:** `woundThreshold` + `woundProbability` in `rules.ts`, same auto-fail /
auto-success / ±1 clamp as the hit roll.

## 3. Allocate attack

> If a model in the target unit has already lost one or more wounds, or has already
> had attacks allocated to it this phase, that attack must be allocated to that model.

**Engine:** not modelled yet — allocation only matters once per-model wound tracking
(overkill) is implemented.

## 4. Saving throw

> Roll one D6, then modify the result by the Armour Penetration (AP) characteristic of
> the attack.

- > An unmodified saving throw of 1 always fails.
- > A saving throw can never be improved by more than +1.
- Invulnerable saves: > invulnerable saving throws are never modified by an attack's
  > Armour Penetration characteristic.
  The model uses whichever save (armour or invulnerable) gives the better result.

### Benefit of Cover

> Each time a ranged attack is allocated to a model that has the Benefit of Cover, add
> 1 to the saving throw made for that attack.

- > Models with a Save characteristic of 3+ or better cannot have the Benefit of Cover
  > against attacks with an Armour Penetration characteristic of 0.
- Cover never improves invulnerable saves, and multiple instances are not cumulative.
- Cover applies to **ranged attacks only** — callers must not pass `cover` for melee.

**Engine:** `saveFailProbability` in `rules.ts`. AP degrades the armour save, cover
improves it by 1 (with the 3+/AP 0 exception), the invulnerable save is compared
unmodified, and a natural 1 always fails. Cover is the only save improvement the
engine models, so the "+1 at most" cap is satisfied structurally.

## 5. Inflict damage

> A model loses one wound for each point of damage it suffers. If a model's wounds are
> reduced to 0 or less, it is destroyed and removed from play. If a model loses
> several wounds from an attack and is destroyed, any excess damage inflicted by that
> attack is lost and has no effect.

**Engine:** each unsaved wound carries the weapon's Damage distribution and totals are
summed (`sequence.ts`). The excess-damage ("overkill") rule is **not implemented
yet** — totals are exact for single-model targets and an upper bound for multi-model
units where damage can spill past a model's last wound.

## Feel No Pain

> Each time a model with this ability suffers damage and so would lose a wound
> (including wounds lost due to mortal wounds), roll one D6: if the result is greater
> than or equal to the number denoted by 'x', that wound is ignored and is not lost.

**Engine:** `applyFeelNoPain` in `sequence.ts` — each damage point is an independent
D6 trial, so surviving damage is binomial.
