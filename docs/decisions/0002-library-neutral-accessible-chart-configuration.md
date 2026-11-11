# Library-neutral accessible chart configuration

Status: accepted (generated, pending human review)

## Context

Charts often fail accessibility because colors are used as the only differentiator, contrast is insufficient, and no text alternative exists. The specification requires a library that takes chart data and returns a configuration with WCAG 2.2 contrast-checked colors, redundant dash and marker patterns, and generated description and table.

## Decision

Implement a pure TypeScript module with no runtime dependencies. Use the Okabe-Ito colorblind-safe palette as default, filter colors by a 3:1 contrast ratio against the background, and cycle through the passing colors for series. Assign dash and marker patterns based on series index to ensure non-color differentiation. Generate text descriptions and data tables directly from the validated data.

## Consequences

The library is self-contained and easy to integrate. Contrast and redundancy are computed automatically, reducing manual effort. Text descriptions provide a baseline for screen readers. The lack of rendering adapters keeps the scope focused, but mapping to specific chart libraries is straightforward as documented in the demo.
