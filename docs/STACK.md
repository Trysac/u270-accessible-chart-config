# Stack

## Used

| Tool | Purpose | Why |
|---|---|---|
| TypeScript | Language and type declarations | Provides the public `ChartInput`, `ChartConfig`, `Dash`, `Marker`, `SeriesValue` and error-code types. |
| Node.js 20+ | Runtime | The package is distributed as an ES module with TypeScript declarations. |
| Vitest | Tests | Runs `test/index.test.ts` against the public entry point. |

No runtime dependencies are used. The implementation imports no packages.

## Discarded

| Tool | Why not |
|---|---|
| Chart rendering library | Rendering is out of scope; consumers map `ChartConfig` onto their own chart library. |
| Runtime dependency for colour or table handling | The required contrast, palette, description and table logic is implemented directly in `src/index.ts`. |
| Sonification and colour-blindness simulation | Both are out of scope for this utility. |
