# accessible-chart-config

[![npm version](https://img.shields.io/npm/v/@trysac/accessible-chart-config.svg)](https://www.npmjs.com/package/@trysac/accessible-chart-config)
[![license: MIT](https://img.shields.io/npm/l/@trysac/accessible-chart-config.svg)](LICENSE)
[![CI](https://github.com/Trysac/u270-accessible-chart-config/actions/workflows/ci.yml/badge.svg)](https://github.com/Trysac/u270-accessible-chart-config/actions/workflows/ci.yml)

Turn chart data into an accessible, library-neutral chart config: WCAG 3:1 contrast-checked colours, dash and marker redundancy, a generated text summary and a data table fallback

## Problem

Charts are often the least accessible part of a dashboard: series are told apart only by colour, colours are too light against the background and there is no text alternative for screen reader users. Teams know the WCAG rules but rarely apply them per chart. This library takes the data and returns a config where every series passes the non-text contrast check (WCAG 2.2 SC 1.4.11), differs by more than colour (SC 1.4.1) and comes with a computed description and data table.

## Install

```sh
npm install @trysac/accessible-chart-config
```

Requires Node.js 20 or newer. The package is an ES module with TypeScript declarations and no runtime dependencies.

## Usage

```ts
import { buildChartConfig, contrastRatio, describeChart, toDataTable } from '@trysac/accessible-chart-config';
const config = buildChartConfig({
  type: 'line', title: 'Revenue', xLabel: 'month', unit: 'USD', x: ['Jan', 'Feb', 'Mar'],
  series: [{ name: 'North', values: [100, 120, 90] }, { name: 'South', values: [80, 85, 95] }],
});
console.log(config.ariaLabel); // 'Line chart: Revenue'
console.log(describeChart(config) === config.description); // true
console.log(toDataTable(config).headers); // ['month', 'North (USD)', 'South (USD)']
console.log(contrastRatio('#767676', '#ffffff')); // 4.54...
```

Each series gets a colour that reaches at least 3:1 contrast against the background, plus a dash pattern and a marker shape. Map the returned config onto a chart library in your own adapter; this package does not render anything.

## API

| Export | Signature | Description |
|---|---|---|
| `contrastRatio` | `(a: string, b: string) => number` | WCAG 2.2 contrast ratio between two `#rrggbb` colours, with the lighter colour as L1. |
| `buildChartConfig` | `(input: ChartInput, opts?: { background?: string; palette?: string[] }) => ChartConfig` | Validates the data, selects contrast-passing colours, applies dash and marker redundancy, and generates the label and description. |
| `describeChart` | `(config: ChartConfig) => string` | Long-form text description with the series count, x range and each series min and max. |
| `toDataTable` | `(config: ChartConfig) => { headers: string[]; rows: string[][] }` | Data-table representation; `null` values become empty cells. |
| `ChartA11yError` | `class extends Error { readonly code: ChartA11yErrorCode }` | Thrown on validation or contrast failures; `code` is one of `insufficient_contrast`, `too_many_series`, `too_many_points`, `length_mismatch`, `invalid_value`, `invalid_color`, `invalid_label`. |

`ChartInput` is `{ type: 'line' | 'bar'; title: string; xLabel: string; yLabel?: string; unit?: string; x: Array<string | number>; series: Array<{ name: string; values: Array<number | null> }> }`. `ChartConfig` is `{ type: 'line' | 'bar'; title: string; ariaLabel: string; description: string; background: string; xLabel: string; unit?: string; x: Array<string | number>; series: Array<{ name: string; color: string; dash: Dash; marker: Marker; values: Array<number | null> }> }`, where `Dash` is `'solid' | 'dashed' | 'dotted' | 'dashdot'` and `Marker` is `'circle' | 'square' | 'triangle' | 'diamond' | 'cross'`.

Options for `buildChartConfig`: `background` defaults to `#ffffff`; `palette` defaults to the Okabe-Ito 2008 colour-blind-safe set `#E69F00`, `#56B4E9`, `#009E73`, `#F0E442`, `#0072B2`, `#D55E00`, `#CC79A7`, `#000000`. Both use `#rrggbb` hex strings. A palette entry is usable only when `contrastRatio(entry, background) >= 3`. Series `i` gets the usable entry at `i % usable.length`, dash `['solid', 'dashed', 'dotted', 'dashdot'][i % 4]`, and marker `['circle', 'square', 'triangle', 'diamond', 'cross'][i % 5]`. If no entry passes, it throws `ChartA11yError` with code `insufficient_contrast`.

Limits: 1-12 series; 1-10,000 x values; x values are finite numbers or strings of 1-200 characters; every series has the same number of values as x; each value is a finite number or `null`; title, xLabel, optional yLabel, optional unit and series names are 1-200 characters. Invalid colours throw `invalid_color`; invalid labels throw `invalid_label`; length mismatches throw `length_mismatch`; oversized x or series arrays throw `too_many_points` or `too_many_series`; invalid values throw `invalid_value`. `contrastRatio` throws `invalid_color` if either argument is not a valid hex colour.

## Why not pick colours by hand

Picking series colours manually leaves three checks to the caller: each colour must be checked against the actual background, the non-colour distinction must be repeated for every series, and the description and table must be maintained when the data changes. This utility computes contrast, assigns redundant dash and marker patterns, and generates the text from the same data. It does not choose colours for aesthetics beyond the supplied or default palette.

## Development

```sh
npm install
npm run check
```

Security practices and the threat model are in [docs/SECURITY.md](docs/SECURITY.md).

## License

[MIT](LICENSE)
