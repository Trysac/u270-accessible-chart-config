# Security practices

How this repository keeps the package and its users safe. The disclosure policy is in [../SECURITY.md](../SECURITY.md).

## Threat model

Defended:

- Invalid chart input is rejected before a config is produced: type must be `line` or `bar`; title, xLabel, optional yLabel, optional unit and series names are 1-200 characters; x has 1-10,000 entries; series has 1-12 entries; each series value array matches the x length; values are finite numbers or `null`; x values are finite numbers or strings of 1-200 characters.
- Colours must match `#rrggbb`; invalid colours throw `ChartA11yError` with code `invalid_color`.
- Palette colours are filtered by `contrastRatio(colour, background) >= 3` before assignment. If no palette entry passes, `buildChartConfig` throws `insufficient_contrast` instead of assigning a failing colour.
- The implementation imports no runtime packages, performs no network or filesystem I/O, and uses no `eval` or dynamic `Function` construction.

Not defended:

- Caller-provided text is copied into `ariaLabel`, `description`, data-table headers and data-table cells without HTML, CSV or log escaping. Consumers that place the output in another format must escape it for that format.
- The library validates shape, ranges and colour format, not the truth, semantics or provenance of the chart data.
- There is no authentication, authorization, rate limiting or secret handling in the library.
- The 10,000 x-value and 12-series limits apply per `buildChartConfig` call; repeated calls are not throttled by the library.
- The library does not render charts, check rendered output, simulate colour blindness or provide sonification.

## Secrets

- Library code reads no environment variables, tokens or credentials.
- No secret is needed to call any exported function.

## Dependencies

The runtime implementation has no dependencies. Tests use Vitest only as a development dependency. Adding a runtime dependency would expand the threat surface beyond the pure validation and contrast calculations documented here.

## Code

- Public inputs are validated and rejected with `ChartA11yError` and a stable `code`.
- Exported functions are pure: they use their arguments and return values or throw; they do not read shared mutable state or perform I/O.
- `contrastRatio` accepts only `#rrggbb` strings and throws `invalid_color` for malformed input.
- `buildChartConfig` copies series values into the returned config; it does not mutate the input arrays.

## Publishing

The published package requires no runtime secrets or environment-specific configuration. Consumers should review the package version and its exported API before upgrading.
