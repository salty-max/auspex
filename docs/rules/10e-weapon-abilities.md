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

## Sustained Hits X — planned

> Each time an attack is made with such a weapon, if a Critical Hit is rolled, that
> attack scores a number of additional hits on the target as denoted by 'x'.

A Critical Hit is an **unmodified** 6, so the extra hits trigger with probability 1/6
per attack regardless of modifiers.

## Lethal Hits — planned

> Each time an attack is made with such a weapon, a Critical Hit automatically wounds
> the target.

Attacks that critically hit skip the wound roll; the rest wound as normal.

## Devastating Wounds — planned

> Each time an attack is made with such a weapon, if that attack scores a Critical
> Wound, no saving throw of any kind can be made against that attack (including
> invulnerable saving throws).

A Critical Wound is an **unmodified** 6 on the wound roll.
