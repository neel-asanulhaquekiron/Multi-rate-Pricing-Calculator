import { describe, expect, it } from "vitest";
import { formatMoney, formatPercent, parseMoney, parsePercent } from "./money";

describe("parseMoney", () => {
  it.each([
    ["100", 10000],
    ["100.00", 10000],
    ["100.5", 10050],
    ["0.05", 5],
    ["0", 0],
    [" 42.10 ", 4210],
  ])("parses %s -> %d cents", (input, cents) => {
    expect(parseMoney(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1.234", "1,000", "1.2.3", ".", "1e3"])("rejects %s", (input) => {
    expect(() => parseMoney(input)).toThrow(RangeError);
  });
});

describe("formatMoney", () => {
  it.each([
    [10000, "100.00"],
    [5, "0.05"],
    [0, "0.00"],
    [4210, "42.10"],
    [-150, "-1.50"],
  ])("formats %d cents -> %s", (cents, out) => {
    expect(formatMoney(cents)).toBe(out);
  });

  it("round-trips with parseMoney", () => {
    for (const cents of [0, 1, 99, 100, 12345, 999999]) {
      expect(parseMoney(formatMoney(cents))).toBe(cents);
    }
  });

  it("rejects fractional cents", () => {
    expect(() => formatMoney(10.5)).toThrow(RangeError);
  });
});

describe("parsePercent", () => {
  it.each([
    ["7.25", 725],
    ["10", 1000],
    ["0", 0],
    ["100", 10000],
    ["0.5", 50],
  ])("parses %s%% -> %d bp", (input, bp) => {
    expect(parsePercent(input)).toBe(bp);
  });

  it.each(["100.01", "101", "-5", "7.253", "abc", ""])("rejects %s", (input) => {
    expect(() => parsePercent(input)).toThrow(RangeError);
  });
});

describe("formatPercent", () => {
  it.each([
    [725, "7.25"],
    [1000, "10"],
    [0, "0"],
    [10000, "100"],
    [50, "0.5"],
    [705, "7.05"],
  ])("formats %d bp -> %s", (bp, out) => {
    expect(formatPercent(bp)).toBe(out);
  });
});
