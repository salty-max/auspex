# Auspex list DSL

A terse, line-oriented text format for Warhammer 40,000 army lists. Designed to be
typed on a phone, diffed in a pull request, and **parsed without a datasheet
database** — the parser is purely syntactic; binding unit names to real datasheets
(from `@auspex/data`) is a separate resolution step.

Parsed by `@auspex/dsl` using [parsil](https://www.npmjs.com/package/parsil).

## Example

```
list "Strike Force Auspex"
faction Space Marines
detachment Gladius Task Force
points 2000

# Characters
Captain in Gravis Armour @95 * warlord, Artificer Armour

# Battleline
10x Intercessor Squad @160 * 2x Plasma pistol
5x Terminator Squad @185
Ballistus Dreadnought @140
```

## Structure

A list file is a sequence of lines. Blank lines and `#` comments (to end of line)
are ignored. Every other line is either a **header** line or a **unit** line.

```
file    := line*
line    := blank | comment | header | unit
comment := '#' .* EOL
```

A line is a header when it begins with a reserved lowercase keyword followed by
whitespace; otherwise it is a unit. Datasheet names are title-case in 40k, so this
never collides in practice — but `list`, `faction`, `detachment` and `points` are
**reserved** at the start of a line.

## Header

```
header     := list | faction | detachment | points
list       := 'list' string        EOL     # required, the list's name
faction    := 'faction' text       EOL      # required
detachment := 'detachment' text    EOL      # optional
points     := 'points' integer     EOL       # optional, the points limit
```

- `string` is double-quoted (`"Strike Force Auspex"`).
- `text` is the rest of the line, trimmed.
- `list` and `faction` are required; omitting either is an error. `detachment` and
  `points` are optional. Declaring the same header twice is an error.

## Unit

```
unit    := [count 'x'] name ['@' points] ['*' options] EOL
count    := integer                          # models, default 1
name     := text up to '@', '*' or EOL, trimmed
points   := integer                          # declared cost, verified later
options  := option (',' option)*
option   := [count 'x'] text                 # 'warlord' (any case) sets the warlord flag
```

- `10x Intercessor Squad` — a ten-model unit. Without the `count x` prefix the unit
  is one model.
- `@160` — the points the author wrote down. The parser keeps it verbatim; checking
  it against the datasheet's real cost is the resolver's job.
- `* a, b, c` — the `*` ("with") marker introduces a comma-separated option list.
  Each option is a wargear or enhancement name, optionally prefixed with `Nx`. The
  reserved word `warlord` (matched case-insensitively) sets the unit's warlord flag
  instead of becoming an option.

The name stops at the first `@` or `*`, so a datasheet name may contain spaces but
not those two characters (no 40k datasheet does).

Free-text fields (unit names, option names, `faction`, `detachment`) have their
internal whitespace collapsed to single spaces, so a stray double space typed on a
phone still resolves. The quoted `list` name is kept literally.

## What the parser does and does not do

The parser produces a typed AST (`ArmyList`) and a list of **source-mapped
diagnostics** (`{ message, line, column }`). It is intentionally datasheet-agnostic:

- It **does** check syntax: a malformed line, a missing required header, a duplicate
  header, an unparseable points value.
- It does **not** check that a unit name is a real datasheet, that the points are
  right, that the wargear is legal, or that the list obeys detachment rules. Those
  need the data layer and live in the **resolver** step (`@auspex/resolver`), which
  takes the AST plus a datasheet source and returns a validated, costed army.

Parsing is line-by-line: a line that fails to parse yields one diagnostic pinned to
its line and column, and parsing continues — so one bad line never hides the rest of
the list.
