# 40k 10th Edition — Weapon Abilities

Reference for the weapon abilities the engine implements or plans to implement.
Quotes are verbatim from the official 10th edition Core Rules.

Sources:

- [Wahapedia — Core Rules](https://wahapedia.ru/wh40k10ed/the-rules/core-rules/)
- [Warhammer Community — Core Rules downloads](https://www.warhammer-community.com/warhammer-40000-downloads/)

## Torrent — implemented

> Weapons with [TORRENT] in their profile are known as Torrent weapons. Each time an
> attack is made with such a weapon, that attack automatically hits the target.

**Engine:** `Weapon.skill: 'torrent'` sets the hit probability to 1 in `sequence.ts`.

## Blast — implemented

> Each time you determine how many attacks are made with a Blast weapon, add 1 to
> the result for every five models that were in the target unit when you selected
> it as the target (rounding down).

> Blast weapons can never be used to make attacks against a unit that is within
> Engagement Range of one or more units from the attacking model's army (including
> its own unit).

**Engine:** `WeaponKeywords.blast` in `types.ts`. The attack distribution shifts up
by `floor(target.models / 5)` before the hit stage. The Engagement Range targeting
restriction is a legality question, not a math one — enforcing it is the caller's
responsibility.

## Rapid Fire X — implemented

> Weapons with [RAPID FIRE X] in their profile are known as Rapid Fire weapons.
> Each time such a weapon targets a unit within half that weapon's range, the
> Attacks characteristic of that weapon is increased by the amount denoted by 'x'.

**Engine:** `WeaponKeywords.rapidFire` in `types.ts`. The engine has no notion of
range — `Modifiers.halfRange` is caller-supplied (mirroring `cover`) and shifts the
attack distribution up by X. Composes with Blast's bonus.

## Melta X — implemented

> Weapons with [MELTA X] in their profile are known as Melta weapons. Each time an
> attack made with such a weapon targets a unit within half that weapon's range,
> that attack's Damage characteristic is increased by the amount denoted by 'x'.

**Engine:** `WeaponKeywords.melta` in `types.ts`, driven by the same
`Modifiers.halfRange` flag. The damage distribution shifts up by X **before** Feel
No Pain — the characteristic increases, then each point is saved against
individually.

## Sustained Hits X — implemented

> Each time an attack is made with such a weapon, if a Critical Hit is rolled, that
> attack scores a number of additional hits on the target as denoted by 'x'.

A Critical Hit is an **unmodified** 6, so the extra hits trigger with probability 1/6
per attack regardless of modifiers (more with re-rolls — see the re-rolls section of
the attack sequence).

**Engine:** `WeaponKeywords.sustainedHits` in `types.ts`. Each attack's hits become a
three-point distribution (miss / hit / critical hit scoring `1 + X`) instead of a
Bernoulli trial; the critical probability comes from `critProbability`, so re-rolls
raise it. Torrent weapons make no hit roll, so they can never score a Critical Hit
and Sustained Hits is inert on them.

## Lethal Hits — implemented

> Each time an attack is made with such a weapon, a Critical Hit automatically wounds
> the target.

Attacks that critically hit skip the wound roll; the rest wound as normal. The
automatic wound still takes the saving throw — it is not a Critical Wound (no wound
roll was made), so it does not trigger Devastating Wounds.

**Engine:** `WeaponKeywords.lethalHits` in `types.ts`. The per-attack distribution
tracks successful wounds directly: the critical slice contributes one automatic
wound, the normal-hit slice rolls to wound. With Sustained Hits X, only the critting
hit auto-wounds — the X extra hits roll to wound normally. Torrent weapons never
crit, so the keyword is inert on them.

## Devastating Wounds — implemented

> Each time an attack is made with such a weapon, if that attack scores a Critical
> Wound, no saving throw of any kind can be made against that attack (including
> invulnerable saving throws).

A Critical Wound is an **unmodified** 6 on the wound roll.

**Engine:** `WeaponKeywords.devastatingWounds` in `types.ts`. Each rolled wound
splits into its critical slice (bypasses armour and invulnerable saves alike) and
its normal slice (takes the save); the critical-wound probability comes from
`critProbability` over the wound threshold, so wound re-rolls raise it. Feel No
Pain still applies — only the saving throw is bypassed. Lethal Hits' automatic
wounds never roll, so they are never critical and always take the save. Torrent
weapons are affected normally: the wound roll is always made, so Critical Wounds
still occur. Re-rolling successful non-critical wounds to fish for Critical Wounds
is not modelled (same rational-play assumption as the re-rolls section).
