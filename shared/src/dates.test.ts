import { describe, expect, it } from "vitest";
import { dateToYmd, ymdToDate } from "./dates";

describe("ymdToDate", () => {
  it("parses to UTC midnight", () => {
    const d = ymdToDate("2026-08-08");
    expect(d.toISOString()).toBe("2026-08-08T00:00:00.000Z");
  });

  it("round-trips with dateToYmd", () => {
    for (const ymd of ["2026-01-01", "2026-02-28", "2024-02-29", "1999-12-31"]) {
      expect(dateToYmd(ymdToDate(ymd))).toBe(ymd);
    }
  });

  it.each(["2026-02-30", "2026-13-01", "2026-00-10", "2026-01-32"])(
    "rejects impossible date %s instead of silently wrapping",
    (ymd) => {
      expect(() => ymdToDate(ymd)).toThrow(RangeError);
    },
  );

  it.each(["08/08/2026", "2026-8-8", "20260808", "", "2026-08-08T00:00:00Z"])(
    "rejects malformed input %s",
    (input) => {
      expect(() => ymdToDate(input)).toThrow(RangeError);
    },
  );
});

describe("dateToYmd", () => {
  it("uses UTC fields, immune to local timezone", () => {
    // 23:30 UTC on Aug 8 is already Aug 9 in Dhaka and still Aug 8 in New York;
    // UTC fields give one stable answer.
    expect(dateToYmd(new Date("2026-08-08T23:30:00.000Z"))).toBe("2026-08-08");
  });
});
