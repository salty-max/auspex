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

## Devastating Wounds — planned

> Each time an attack is made with such a weapon, if that attack scores a Critical
> Wound, no saving throw of any kind can be made against that attack (including
> invulnerable saving throws).

A Critical Wound is an **unmodified** 6 on the wound roll.
