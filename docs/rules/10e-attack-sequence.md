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

| Strength vs Toughness             | Wound on |
| --------------------------------- | -------- |
| S is twice (or more than twice) T | 2+       |
| S is greater than T               | 3+       |
| S is equal to T                   | 4+       |
| S is less than T                  | 5+       |
| S is half (or less than half) T   | 6+       |

- > An unmodified Wound roll of 6 is called a Critical Wound and is always successful.
- > An unmodified Wound roll of 1 always fails.
- > A Wound roll can never be modified by more than -1 or +1.

**Engine:** `woundThreshold` + `woundProbability` in `rules.ts`, same auto-fail /
auto-success / ±1 clamp as the hit roll.

## 3. Allocate attack

> If a model in the target unit has already lost one or more wounds, or has already
> had attacks allocated to it this phase, that attack must be allocated to that model.

**Engine:** modelled in aggregate by `inflictDamage` in `sequence.ts`: unsaved
wounds are allocated sequentially, each to the model currently carrying damage,
which matches the rule for units of identical models. Mixed-wounds units and
defender-chosen allocation order are not modelled.

## 4. Saving throw

> Roll one D6, then modify the result by the Armour Penetration (AP) characteristic of
> the attack.

- > An unmodified saving throw of 1 always fails.
- > A saving throw can never be improved by more than +1.
- Invulnerable saves: > invulnerable saving throws are never modified by an attack's
  > Armour Penetration characteristic.
- The model uses whichever save (armour or invulnerable) gives the better result.

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

**Engine:** `inflictDamage` in `sequence.ts` walks each unsaved wound's damage
through the unit: the current model takes at most its remaining wounds (the excess
is lost), the next wound starts on a fresh model, and a destroyed unit absorbs
nothing further. `SimResult.damageDistribution` is therefore the damage actually
inflicted, bounded by `wounds × models`, and `modelsSlainDistribution` is its
marginal over whole models.

## Dice expressions and modifiers

The Core Rules define **no minimum result for a modified dice roll** — there is no
clause clamping `D3-2`-style rolls at 0 or 1 (verified against the rules text; the
only caps are the ±1 modifier limits on hit/wound rolls quoted above). The engine's
convention: modified rolls clamp at 0, and 0 damage simply inflicts nothing.
Abilities that state their own floor ("to a minimum of 1") are the caller's
responsibility.

## Re-rolls

> Some rules allow you to re-roll a dice roll, which means you get to roll some or
> all of the dice again. If a rule allows you to re-roll a dice roll that was made by
> adding several dice together (e.g. 2D6, 3D6, etc.) then, unless otherwise stated,
> you must re-roll all of those dice again.

> You can never re-roll a dice more than once, and re-rolls happen before modifiers
> (if any) are applied. Rules that refer to the value of an 'unmodified' dice roll
> are referring to the dice result after any re-rolls, but before any modifiers are
> applied.

**Engine:** `rollProbability` / `critProbability` in `rules.ts` accept a re-roll
allowance, `'ones'` (re-roll unmodified 1s) or `'full'` (re-roll the roll), wired
into the hit and wound stages via `Modifiers.rerollHit` / `Modifiers.rerollWound`.
Each die is re-rolled at most once and the re-rolled die takes the same modifier.
The engine assumes rational play: under `'full'`, exactly the dice that would fail
(after modifiers) are re-rolled. Re-rolling successful non-6s to fish for critical
hits (relevant once Sustained/Lethal Hits land) is not modelled yet. A critical is
an unmodified 6 **after** any re-roll, so re-rolls raise the critical probability —
`critProbability` accounts for this.

## Feel No Pain

> Each time a model with this ability suffers damage and so would lose a wound
> (including wounds lost due to mortal wounds), roll one D6: if the result is greater
> than or equal to the number denoted by 'x', that wound is ignored and is not lost.

**Engine:** `applyFeelNoPain` in `sequence.ts` — each damage point is an independent
D6 trial, so surviving damage is binomial.
