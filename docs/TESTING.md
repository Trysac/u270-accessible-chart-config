# Testing

## Tools

- Vitest runs the suite in `test/index.test.ts` using `describe`, `expect` and `it`.
- The tests import the public entry point from `../src/index.js`.
- No other test files, conformance suites, browser tests or integration tests are present in the provided repository files.

## Commands

```sh
npm test
npx vitest
npm run check
```

## Rules

- Tests exercise the public API: `contrastRatio`, `buildChartConfig`, `describeChart`, `toDataTable` and `ChartA11yError`.
- Assertions cover exact return values, exact description strings, table headers and rows, and the `code` property of thrown `ChartA11yError` instances.
- Each test builds its own input inline. The suite uses no network, clock, randomness, temporary files or shared mutable state.

## Tiers

- Only local unit tests exist: `test/index.test.ts`. It covers contrast calculations, chart configuration, descriptions and data tables.
- `contrastRatio` tests cover the known ratios 4.54 for `#767676` on `#ffffff`, 21 for black on white and 21 for white on black, case-insensitive hex input, and `invalid_color` for malformed colours.
- `buildChartConfig` tests cover line and bar charts, the default palette on white, the default palette on black, numeric x values, all-null series, colour reuse when series exceed passing colours, custom palettes with fewer passing colours than series, and error codes `insufficient_contrast`, `too_many_series` for 0 and 13 series, `too_many_points` for 10,001 x values, `length_mismatch`, `invalid_value` for `NaN`, invalid type, non-finite x numbers and invalid x types, `invalid_color` for a malformed palette colour, and `invalid_label` for empty or overlong labels.
- `describeChart` tests cover the exact Revenue description, nulls and tied values, unit inclusion and capitalisation of the chart type.
- `toDataTable` tests cover headers and rows with a unit, empty cells for `null`, min/max skipping `null`, and output without a unit.

## Reports

The test file writes no reports. Any coverage output is produced by the Vitest invocation, not by the tests themselves.
