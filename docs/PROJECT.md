# Project record: accessible-chart-config

## Objective

Provide `@trysac/accessible-chart-config`, a TypeScript library that turns chart data into a library-neutral chart configuration with WCAG 2.2 contrast-checked series colours, redundant dash and marker patterns, a generated text description and a data-table representation. It is for developers who build chart interfaces and need per-chart accessibility data without applying the WCAG checks by hand.

Measurable outcomes: `contrastRatio('#000000', '#ffffff')` returns 21, `contrastRatio('#767676', '#ffffff')` rounds to 4.54, and `buildChartConfig` returns series that use only palette colours with at least 3:1 contrast against the background, each with a dash and marker value.

## Scope

In scope:

- Public functions `contrastRatio`, `buildChartConfig`, `describeChart` and `toDataTable`, plus `ChartA11yError` and the exported TypeScript types.
- WCAG 2.2 relative-luminance contrast calculations for `#rrggbb` colours.
- Palette filtering at 3:1 contrast against the background, with series colours selected modulo the usable palette entries.
- Dash patterns `solid`, `dashed`, `dotted`, `dashdot` and markers `circle`, `square`, `triangle`, `diamond`, `cross`, selected by series index.
- Generated `ariaLabel`, long-form `description` and data-table headers and rows.
- Input validation for chart type, label lengths, x length, series count, series value lengths, finite values and colours.

Out of scope:

- Rendering charts or providing adapters for specific chart libraries.
- Sonification.
- Colour-blindness simulation.
- Runtime dependencies.

## Timeline

| Date | Milestone |
|---|---|
| 2026 | Repository created from the factory utility template. |

## Effort metrics

Measured values only. Leave pending measurement until a real figure is recorded; never estimate here.

| Metric | Value | Source |
|---|---|---|
| Tokens (input / output) | 706201 / 53877 | factory ledger |
| Hours (human) | pending measurement | time log |
| Cost (USD) | 0.0716 | factory ledger |

## Factory run u270 (measured from API usage)

| Date (UTC) | Phase | Model | Batch | Input | Output | Cache write | Cache read | Cost (USD) |
|---|---|---|---|---|---|---|---|---|
| 2026-11-10 | generation | deepseek-v4-pro | yes | 1664 | 18466 | 0 | 3584 | 0.0377 |
| 2026-11-10 | fix-1 | deepseek-flash | no | 12639 | 1849 | 0 | 42368 | 0.0031 |
| 2026-11-10 | audit | deepseek-flash | no | 33000 | 16396 | 0 | 494848 | 0.0163 |
| 2026-11-10 | fix-2 | deepseek-flash | no | 11043 | 4483 | 0 | 91648 | 0.0046 |
| 2026-11-10 | docs | deepseek-flash | no | 15023 | 12683 | 0 | 384 | 0.0099 |

Total: $0.0716. Prices: deepseek line, as measured by its adapter. Providers serve the current version of each model id, so the date tells which version answered; versions, launch stages and price sources per line are in the factory's model register (docs/MODELS.md).
