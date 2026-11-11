# Architecture

## Overview

`@trysac/accessible-chart-config` is a dependency-free TypeScript library published as an ES module with type declarations. It turns chart data into an accessible, library-neutral chart config: WCAG 3:1 contrast-checked colours, dash and marker redundancy, a generated text summary and a data table fallback.

## Modules

| Module | Responsibility |
|---|---|
| `src/index.ts` | Public API and all library logic: validation, WCAG 2.2 contrast, palette filtering, dash and marker selection, description generation and data-table generation. |

There are no internal modules in the provided source. Everything consumers import is exported from `src/index.ts`.

## Boundaries

- No runtime dependencies; the source file imports nothing.
- No I/O at import time or in exported functions. Functions are pure and return values or throw.
- Validation failures and contrast failures are thrown as `ChartA11yError` with a stable `code`, not as built-in `TypeError` or `RangeError`.
- The library does not render charts, adapt output to a chart library, sonify data or simulate colour blindness.

## Build and distribution

`npm run build` compiles `src/` to `dist/` with `tsconfig.build.json`. Only `dist/` is published (`files` in `package.json`).

## Decisions

The source is a single module because the public surface is small and the functions share validation and contrast helpers. Architectural decisions beyond this file are not represented in the provided source.
