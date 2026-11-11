/**
 * Public entry point of @trysac/accessible-chart-config.
 *
 * This module provides utilities to make charts accessible:
 * - WCAG 2.2 contrast-ratio calculations.
 * - Generation of a chart configuration with contrast-checked series colors,
 *   dash and marker redundancy, and a computed text description.
 * - Generation of a data-table representation for screen readers.
 */

/**
 * Type of a chart series value: a finite number or `null` for missing data.
 */
export type SeriesValue = number | null;

/**
 * Input data for building an accessible chart configuration.
 */
export interface ChartInput {
  /** Chart type: 'line' or 'bar'. */
  type: "line" | "bar";
  /** Chart title, 1–200 characters. */
  title: string;
  /** Label for the X axis, 1–200 characters. */
  xLabel: string;
  /** Optional label for the Y axis, 1–200 characters. */
  yLabel?: string;
  /** Optional unit for data values, 1–200 characters. */
  unit?: string;
  /** X-axis values: strings or finite numbers, length 1–10000. */
  x: Array<string | number>;
  /** Series data: 1–12 series, each with a name and values matching x length. */
  series: Array<{
    name: string;
    values: Array<SeriesValue>;
  }>;
}

/**
 * Dash pattern identifiers.
 */
export type Dash = "solid" | "dashed" | "dotted" | "dashdot";

/**
 * Marker shape identifiers.
 */
export type Marker = "circle" | "square" | "triangle" | "diamond" | "cross";

/**
 * Generated chart configuration with accessibility metadata.
 */
export interface ChartConfig {
  /** Chart type. */
  type: "line" | "bar";
  /** Chart title. */
  title: string;
  /** Accessible label for the chart. */
  ariaLabel: string;
  /** Long-form text description of the chart data. */
  description: string;
  /** Background color used for contrast checks, as provided. */
  background: string;
  /** X-axis label. */
  xLabel: string;
  /** Optional unit for data values. */
  unit?: string;
  /** X-axis values. */
  x: Array<string | number>;
  /** Series configurations with color, dash, marker, and values. */
  series: Array<{
    name: string;
    color: string;
    dash: Dash;
    marker: Marker;
    values: Array<SeriesValue>;
  }>;
}

/**
 * Error codes for chart accessibility issues.
 */
export type ChartA11yErrorCode =
  | "insufficient_contrast"
  | "too_many_series"
  | "too_many_points"
  | "length_mismatch"
  | "invalid_value"
  | "invalid_color"
  | "invalid_label";

/**
 * Error thrown for accessibility-related validation or contrast issues.
 */
export class ChartA11yError extends Error {
  /** Stable machine-readable error code. */
  readonly code: ChartA11yErrorCode;

  constructor(code: ChartA11yErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ChartA11yError";
    this.code = code;
  }
}

/**
 * Okabe-Ito 2008 colorblind-safe palette.
 */
const DEFAULT_PALETTE = [
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#F0E442",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
  "#000000",
] as const;

/** Dash patterns in order. */
const DASHES = ["solid", "dashed", "dotted", "dashdot"] as const;

/** Marker shapes in order. */
const MARKERS = ["circle", "square", "triangle", "diamond", "cross"] as const;

/**
 * Validates that a string is a non-empty string within a given length.
 */
function isNonEmptyStringWithin(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

/**
 * Validates a hex color string of the form `#rrggbb` (case-insensitive).
 */
function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/**
 * Converts a hex color string to an array of RGB components in the range [0,1].
 * Assumes the input is a valid hex color.
 */
function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.slice(1);
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Computes the relative luminance of a color according to WCAG 2.2.
 * Assumes the input is a valid hex color.
 */
function relativeLuminance(color: string): number {
  const [r, g, b] = hexToRgb01(color);
  const linearize = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const rLin = linearize(r);
  const gLin = linearize(g);
  const bLin = linearize(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes the WCAG 2.2 contrast ratio between two colors.
 *
 * @param a - First color as a `#rrggbb` hex string (case-insensitive).
 * @param b - Second color as a `#rrggbb` hex string (case-insensitive).
 * @returns The contrast ratio, with the lighter color as L1.
 * @throws {ChartA11yError} With code `'invalid_color'` if either argument is not a valid hex color.
 */
export function contrastRatio(a: string, b: string): number {
  if (!isHexColor(a)) {
    throw new ChartA11yError("invalid_color", `Invalid color format: ${a}`);
  }
  if (!isHexColor(b)) {
    throw new ChartA11yError("invalid_color", `Invalid color format: ${b}`);
  }
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns the item at `index % list.length` from a non-empty list.
 */
function pick<T>(list: readonly T[], index: number): T {
  const item = list[index % list.length];
  if (item === undefined) {
    throw new ChartA11yError("invalid_value", "index out of range");
  }
  return item;
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Builds an accessible chart configuration from input data.
 *
 * The function validates the input, selects series colors from the palette that
 * meet a 3:1 contrast ratio against the background, applies redundant dash and
 * marker patterns, and generates the accessible label and description.
 *
 * @param input - Chart input data.
 * @param opts - Optional overrides for background color and palette.
 * @returns A fully populated `ChartConfig`.
 * @throws {ChartA11yError} On any validation error, with a specific code.
 */
export function buildChartConfig(
  input: ChartInput,
  opts: { background?: string; palette?: string[] } = {},
): ChartConfig {
  // Validate chart type.
  if (input.type !== "line" && input.type !== "bar") {
    throw new ChartA11yError("invalid_value", 'type must be "line" or "bar"');
  }

  // Validate strings.
  if (!isNonEmptyStringWithin(input.title, 200)) {
    throw new ChartA11yError("invalid_label", "title must be 1-200 characters");
  }
  if (!isNonEmptyStringWithin(input.xLabel, 200)) {
    throw new ChartA11yError("invalid_label", "xLabel must be 1-200 characters");
  }
  if (input.yLabel !== undefined && !isNonEmptyStringWithin(input.yLabel, 200)) {
    throw new ChartA11yError("invalid_label", "yLabel must be 1-200 characters if provided");
  }
  if (input.unit !== undefined && !isNonEmptyStringWithin(input.unit, 200)) {
    throw new ChartA11yError("invalid_label", "unit must be 1-200 characters if provided");
  }

  // Validate x array.
  if (!Array.isArray(input.x) || input.x.length < 1 || input.x.length > 10_000) {
    throw new ChartA11yError(
      "too_many_points",
      `x must have 1-10000 values, got ${input.x.length}`,
    );
  }
  for (const xVal of input.x) {
    if (typeof xVal === "number") {
      if (!Number.isFinite(xVal)) {
        throw new ChartA11yError(
          "invalid_value",
          "x values must be finite numbers or non-empty strings",
        );
      }
    } else if (typeof xVal === "string") {
      if (!isNonEmptyStringWithin(xVal, 200)) {
        throw new ChartA11yError("invalid_value", "x string values must be 1-200 characters");
      }
    } else {
      throw new ChartA11yError("invalid_value", "x values must be numbers or strings");
    }
  }

  // Validate series array.
  if (!Array.isArray(input.series) || input.series.length < 1 || input.series.length > 12) {
    throw new ChartA11yError(
      "too_many_series",
      `series must have 1-12 items, got ${input.series.length}`,
    );
  }
  for (const series of input.series) {
    if (!isNonEmptyStringWithin(series.name, 200)) {
      throw new ChartA11yError("invalid_label", "series name must be 1-200 characters");
    }
    if (!Array.isArray(series.values) || series.values.length !== input.x.length) {
      throw new ChartA11yError(
        "length_mismatch",
        `series "${series.name}" values length ${series.values.length} does not match x length ${input.x.length}`,
      );
    }
    for (const value of series.values) {
      if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
        throw new ChartA11yError(
          "invalid_value",
          `series "${series.name}" contains invalid value ${String(value)}`,
        );
      }
    }
  }

  // Validate background and palette.
  const background = opts.background ?? "#ffffff";
  if (!isHexColor(background)) {
    throw new ChartA11yError("invalid_color", `Invalid color format: ${background}`);
  }
  const palette = opts.palette ?? [...DEFAULT_PALETTE];
  if (!Array.isArray(palette)) {
    throw new ChartA11yError("invalid_color", "palette must be an array of strings");
  }
  for (const color of palette) {
    if (!isHexColor(color)) {
      throw new ChartA11yError("invalid_color", `Invalid color format: ${color}`);
    }
  }

  // Compute passing colors (contrast ≥ 3:1 against background).
  const passingColors = palette.filter((color) => contrastRatio(color, background) >= 3);
  if (passingColors.length === 0) {
    throw new ChartA11yError(
      "insufficient_contrast",
      "No palette colors meet 3:1 contrast against background",
    );
  }

  // Build series configuration.
  const seriesConfig = input.series.map((series, index) => {
    const color = pick(passingColors, index);
    const dash = pick(DASHES, index);
    const marker = pick(MARKERS, index);
    return {
      name: series.name,
      color,
      dash,
      marker,
      values: [...series.values],
    };
  });

  // Build config object.
  const config: ChartConfig = {
    type: input.type,
    title: input.title,
    ariaLabel: `${capitalizeFirst(input.type)} chart: ${input.title}`,
    description: "",
    background,
    xLabel: input.xLabel,
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    x: input.x,
    series: seriesConfig,
  };

  // Generate description using describeChart.
  config.description = describeChart(config);

  return config;
}

/**
 * Generates a textual description of the chart data for screen readers.
 *
 * The format is:
 * `<Type> chart: <title>. <n> series over <m> <xLabel> values from <x0> to <xlast>.`
 * followed by one sentence per series:
 * ` <name>: min <v>[ <unit>] at <x>, max <v>[ <unit>] at <x>.`
 * For series with only null values, the sentence is ` <name>: no values.`
 *
 * @param config - The chart configuration produced by `buildChartConfig`.
 * @returns A long-form text description.
 */
export function describeChart(config: ChartConfig): string {
  const type = capitalizeFirst(config.type);
  const n = config.series.length;
  const m = config.x.length;
  const x0 = String(config.x[0]);
  const xLast = String(config.x[config.x.length - 1]);

  const intro = `${type} chart: ${config.title}. ${n} series over ${m} ${config.xLabel} values from ${x0} to ${xLast}.`;

  const seriesDescriptions = config.series.map((series) => {
    let minVal: number | null = null;
    let minIndex = -1;
    let maxVal: number | null = null;
    let maxIndex = -1;

    for (const [i, value] of series.values.entries()) {
      if (value === null) continue;
      if (minVal === null || value < minVal) {
        minVal = value;
        minIndex = i;
      }
      if (maxVal === null || value > maxVal) {
        maxVal = value;
        maxIndex = i;
      }
    }

    if (minVal === null) {
      return `${series.name}: no values.`;
    }

    const unitPart = config.unit ? ` ${config.unit}` : "";
    const minAtX = String(config.x[minIndex]);
    const maxAtX = String(config.x[maxIndex]);
    return `${series.name}: min ${String(minVal)}${unitPart} at ${minAtX}, max ${String(maxVal)}${unitPart} at ${maxAtX}.`;
  });

  return intro + seriesDescriptions.map((s) => ` ${s}`).join("");
}

/**
 * Converts a chart configuration into a data-table representation.
 *
 * Headers are `xLabel` followed by each series name, with unit in parentheses if provided.
 * Rows contain string representations of x values and series values (empty string for null).
 *
 * @param config - The chart configuration produced by `buildChartConfig`.
 * @returns An object with `headers` and `rows` suitable for a data table.
 */
export function toDataTable(config: ChartConfig): { headers: string[]; rows: string[][] } {
  const headers = [config.xLabel];
  for (const series of config.series) {
    headers.push(config.unit ? `${series.name} (${config.unit})` : series.name);
  }

  const rows = config.x.map((xVal, i) => {
    const row = [String(xVal)];
    for (const series of config.series) {
      const value = series.values[i];
      row.push(value === null ? "" : String(value));
    }
    return row;
  });

  return { headers, rows };
}
