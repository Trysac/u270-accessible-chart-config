import { describe, expect, it } from "vitest";
import {
  buildChartConfig,
  ChartA11yError,
  contrastRatio,
  describeChart,
  toDataTable,
} from "../src/index.js";

describe("contrastRatio", () => {
  it("computes known ratios", () => {
    expect(Math.round(contrastRatio("#767676", "#ffffff") * 100) / 100).toBe(4.54);
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#ffffff", "#000000")).toBe(21);
  });

  it("accepts case-insensitive colors", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBe(21);
  });

  it("throws invalid_color for malformed inputs", () => {
    expect(() => contrastRatio("not-a-color", "#fff")).toThrow(ChartA11yError);
    expect(() => contrastRatio("#12345", "#ffffff")).toThrow(ChartA11yError);
    try {
      contrastRatio("bad", "#ffffff");
    } catch (error) {
      expect(error).toBeInstanceOf(ChartA11yError);
      expect((error as ChartA11yError).code).toBe("invalid_color");
    }
  });
});

describe("buildChartConfig", () => {
  it("builds basic line chart with default palette", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Revenue",
      xLabel: "month",
      unit: "USD",
      x: ["Jan", "Feb", "Mar"],
      series: [
        { name: "North", values: [100, 120, 90] },
        { name: "South", values: [80, 85, 95] },
      ],
    });

    expect(config.series).toHaveLength(2);
    expect(config.series[0]?.color).toBe("#009E73");
    expect(config.series[0]?.dash).toBe("solid");
    expect(config.series[0]?.marker).toBe("circle");
    expect(config.series[1]?.color).toBe("#0072B2");
    expect(config.series[1]?.dash).toBe("dashed");
    expect(config.series[1]?.marker).toBe("square");
    expect(config.ariaLabel).toBe("Line chart: Revenue");
    expect(config.description).toBe(describeChart(config));
  });

  it("builds bar chart with default palette", () => {
    const config = buildChartConfig({
      type: "bar",
      title: "Sales",
      xLabel: "quarter",
      x: ["Q1", "Q2"],
      series: [{ name: "Sales", values: [10, 20] }],
    });
    expect(config.type).toBe("bar");
    expect(config.ariaLabel).toBe("Bar chart: Sales");
  });

  it("handles numeric x values", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Temperature",
      xLabel: "day",
      x: [1, 2, 3],
      series: [{ name: "Temp", values: [20, 25, 22] }],
    });
    expect(config.x).toEqual([1, 2, 3]);
  });

  it("handles series with only nulls", () => {
    const config = buildChartConfig({
      type: "line",
      title: "No data",
      xLabel: "time",
      x: ["a", "b"],
      series: [{ name: "Empty", values: [null, null] }],
    });
    expect(config.series[0]?.values).toEqual([null, null]);
    expect(describeChart(config)).toContain("Empty: no values.");
  });

  it("reuses colors when series exceed passing colors", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Multi",
      xLabel: "x",
      x: ["a", "b", "c", "d", "e", "f"],
      series: Array.from({ length: 6 }, (_, i) => ({
        name: `S${i + 1}`,
        values: [1, 2, 3, 4, 5, 6],
      })),
    });
    // 5 passing colors on white: #009E73, #0072B2, #D55E00, #CC79A7, #000000
    expect(config.series[0]?.color).toBe("#009E73");
    expect(config.series[5]?.color).toBe("#009E73"); // reuses first
    expect(config.series[5]?.dash).toBe("dashed"); // index 5 % 4 = 1
  });

  it("uses the 7 non-black default colours on a black background", () => {
    const config = buildChartConfig(
      {
        type: "line",
        title: "Multi",
        xLabel: "x",
        x: ["a", "b", "c", "d", "e", "f", "g", "h"],
        series: Array.from({ length: 8 }, (_, i) => ({
          name: `S${i + 1}`,
          values: [1, 2, 3, 4, 5, 6, 7, 8],
        })),
      },
      { background: "#000000" },
    );
    expect(config.series.slice(0, 7).map((s) => s.color)).toEqual([
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
    ]);
    expect(config.series[7]?.color).toBe("#E69F00"); // wraps around
  });

  it("reuses a custom palette with fewer passing colours than series", () => {
    const config = buildChartConfig(
      {
        type: "line",
        title: "Multi",
        xLabel: "x",
        x: ["a", "b"],
        series: Array.from({ length: 3 }, (_, i) => ({
          name: `S${i + 1}`,
          values: [1, 2],
        })),
      },
      { palette: ["#0072B2"] },
    );
    expect(config.series.map((s) => s.color)).toEqual(["#0072B2", "#0072B2", "#0072B2"]);
    expect(config.series.map((s) => s.dash)).toEqual(["solid", "dashed", "dotted"]);
    expect(config.series.map((s) => s.marker)).toEqual(["circle", "square", "triangle"]);
  });

  it("throws insufficient_contrast when no palette color passes", () => {
    expect(() =>
      buildChartConfig(
        {
          type: "line",
          title: "T",
          xLabel: "x",
          x: ["a"],
          series: [{ name: "S", values: [1] }],
        },
        { background: "#ffffff", palette: ["#F0E442"] },
      ),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig(
        {
          type: "line",
          title: "T",
          xLabel: "x",
          x: ["a"],
          series: [{ name: "S", values: [1] }],
        },
        { background: "#ffffff", palette: ["#F0E442"] },
      );
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("insufficient_contrast");
    }
  });

  it("throws too_many_series for 13 series", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: Array.from({ length: 13 }, (_, i) => ({ name: `S${i}`, values: [1] })),
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: Array.from({ length: 13 }, (_, i) => ({ name: `S${i}`, values: [1] })),
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("too_many_series");
    }
  });

  it("throws too_many_series for 0 series", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [],
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [],
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("too_many_series");
    }
  });

  it("throws too_many_points for 10001 x values", () => {
    const bigX = Array.from({ length: 10001 }, (_, i) => i);
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: bigX,
        series: [{ name: "S", values: bigX }],
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: bigX,
        series: [{ name: "S", values: bigX }],
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("too_many_points");
    }
  });

  it("throws length_mismatch when series values length != x length", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a", "b", "c"],
        series: [{ name: "S", values: [1, 2] }],
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a", "b", "c"],
        series: [{ name: "S", values: [1, 2] }],
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("length_mismatch");
    }
  });

  it("throws invalid_value for NaN", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [{ name: "S", values: [NaN] }],
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [{ name: "S", values: [NaN] }],
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("invalid_value");
    }
  });

  it("throws invalid_color for invalid palette color", () => {
    expect(() =>
      buildChartConfig(
        {
          type: "line",
          title: "T",
          xLabel: "x",
          x: ["a"],
          series: [{ name: "S", values: [1] }],
        },
        { palette: ["#12345"] },
      ),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig(
        {
          type: "line",
          title: "T",
          xLabel: "x",
          x: ["a"],
          series: [{ name: "S", values: [1] }],
        },
        { palette: ["#12345"] },
      );
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("invalid_color");
    }
  });

  it("throws invalid_label for 201-char series name", () => {
    const longName = "a".repeat(201);
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [{ name: longName, values: [1] }],
      }),
    ).toThrow(ChartA11yError);
    try {
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [{ name: longName, values: [1] }],
      });
    } catch (error) {
      expect((error as ChartA11yError).code).toBe("invalid_label");
    }
  });

  it("throws invalid_value for invalid type", () => {
    expect(() =>
      buildChartConfig({
        type: "pie",
        title: "T",
        xLabel: "x",
        x: ["a"],
        series: [{ name: "S", values: [1] }],
      } as never),
    ).toThrow(ChartA11yError);
  });

  it("throws invalid_label for empty title", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "",
        xLabel: "x",
        x: ["a"],
        series: [{ name: "S", values: [1] }],
      }),
    ).toThrow(ChartA11yError);
  });

  it("throws invalid_value for non-finite x number", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: [Infinity],
        series: [{ name: "S", values: [1] }],
      }),
    ).toThrow(ChartA11yError);
  });

  it("throws invalid_value for invalid x type", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        x: [true],
        series: [{ name: "S", values: [1] }],
      } as never),
    ).toThrow(ChartA11yError);
  });

  it("throws invalid_label for invalid yLabel length", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        yLabel: "a".repeat(201),
        x: ["a"],
        series: [{ name: "S", values: [1] }],
      }),
    ).toThrow(ChartA11yError);
  });

  it("throws invalid_label for invalid unit length", () => {
    expect(() =>
      buildChartConfig({
        type: "line",
        title: "T",
        xLabel: "x",
        unit: "a".repeat(201),
        x: ["a"],
        series: [{ name: "S", values: [1] }],
      }),
    ).toThrow(ChartA11yError);
  });
});

describe("describeChart", () => {
  it("describes the revenue chart", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Revenue",
      xLabel: "month",
      unit: "USD",
      x: ["Jan", "Feb", "Mar"],
      series: [
        { name: "North", values: [100, 120, 90] },
        { name: "South", values: [80, 85, 95] },
      ],
    });
    const expected =
      "Line chart: Revenue. 2 series over 3 month values from Jan to Mar. " +
      "North: min 90 USD at Mar, max 120 USD at Feb. " +
      "South: min 80 USD at Jan, max 95 USD at Mar.";
    expect(describeChart(config)).toBe(expected);
  });

  it("describes series with nulls and ties", () => {
    const config = buildChartConfig({
      type: "line",
      title: "T",
      xLabel: "x",
      x: ["a", "b", "c", "d"],
      series: [
        { name: "S1", values: [1, null, 2, 2] },
        { name: "S2", values: [null, null, null, null] },
      ],
    });
    const description = describeChart(config);
    expect(description).toContain("S1: min 1 at a, max 2 at c"); // tie: first occurrence
    expect(description).toContain("S2: no values.");
  });

  it("includes unit", () => {
    const config = buildChartConfig({
      type: "line",
      title: "T",
      xLabel: "x",
      unit: "kg",
      x: ["a"],
      series: [{ name: "S", values: [1] }],
    });
    expect(describeChart(config)).toContain("min 1 kg at a");
  });

  it("capitalizes type", () => {
    const config = buildChartConfig({
      type: "bar",
      title: "B",
      xLabel: "x",
      x: ["a"],
      series: [{ name: "S", values: [1] }],
    });
    expect(describeChart(config)).toMatch(/^Bar chart:/);
  });
});

describe("toDataTable", () => {
  it("builds headers and rows with unit", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Revenue",
      xLabel: "month",
      unit: "USD",
      x: ["Jan", "Feb", "Mar"],
      series: [
        { name: "North", values: [100, 120, 90] },
        { name: "South", values: [80, 85, 95] },
      ],
    });
    const table = toDataTable(config);
    expect(table).toEqual({
      headers: ["month", "North (USD)", "South (USD)"],
      rows: [
        ["Jan", "100", "80"],
        ["Feb", "120", "85"],
        ["Mar", "90", "95"],
      ],
    });
  });

  it("keeps null cells empty and skips them in min and max", () => {
    const config = buildChartConfig({
      type: "line",
      title: "Revenue",
      xLabel: "month",
      unit: "USD",
      x: ["Jan", "Feb", "Mar"],
      series: [
        { name: "North", values: [100, 120, 90] },
        { name: "South", values: [80, null, 95] },
      ],
    });
    const table = toDataTable(config);
    expect(table.rows[1]?.[2]).toBe("");
    expect(describeChart(config)).toContain("South: min 80 USD at Jan, max 95 USD at Mar.");
  });

  it("handles no unit", () => {
    const config = buildChartConfig({
      type: "line",
      title: "T",
      xLabel: "x",
      x: ["a"],
      series: [{ name: "S", values: [1] }],
    });
    const table = toDataTable(config);
    expect(table.headers).toEqual(["x", "S"]);
    expect(table.rows).toEqual([["a", "1"]]);
  });

  it("null becomes empty string", () => {
    const config = buildChartConfig({
      type: "line",
      title: "T",
      xLabel: "x",
      x: ["a", "b"],
      series: [{ name: "S", values: [1, null] }],
    });
    const table = toDataTable(config);
    expect(table.rows[1]?.[1]).toBe("");
  });
});
