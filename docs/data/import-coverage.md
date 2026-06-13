# Data import coverage

`@auspex/data`'s bake imports every BSData 10e catalogue into one SQLite artifact.
At the pinned ref it produces **36 factions / ~1678 datasheets / ~5200 weapons**.
The bake is reproducible: provenance records the exact BSData commit SHA.

## How it fits together

`scripts/bake.ts` fetches every `.cat`, then `bakeAll` resolves each faction's
`catalogueLink` dependency closure and hands those libraries to the importer, so
thin factions (Astra Militarum, Aeldari, Imperial Knights, the Space Marine
successor chapters, …) find the unit definitions that live in their libraries.
Hand-edited `overrides/<faction>.yaml` patches are applied and re-validated; a
stale patch fails the bake.

## Known residual issues

The artifact's `issues` table is the raw import audit. After the importer and
overrides, the non-size residue falls into three understood buckets:

- **Variable unit size (~385):** BSData prices unit sizes through constraint/
  modifier machinery the importer does not evaluate, so a unit imports at its
  base size with that size's points. Documented limitation, not a bug.
- **No Unit statline (~13):** attached or component models — Wolf Scout,
  Cyber-mastiff, Burna Boy, Loota — that have no standalone datasheet. They are
  correctly **not** emitted as datasheets; the audit line records that the
  importer looked and found no statline.

Random-Strength weapons (the Ork Zzap gun's `2D6` / `D6+6`) are fully modelled —
the engine marginalizes the wound roll over the Strength distribution, so these
weapons import and simulate like any other.

Genuine BSData typos (a bare `3` skill or `8+` strength, an AP printed as `-`) are
either parsed leniently by the importer where the intent is unambiguous, or fixed
by a per-weapon override. The `issues` audit may still list a typo the import hit
even when an override repairs it in the final datasheet — the `datasheets` table
is the resolved source of truth.
