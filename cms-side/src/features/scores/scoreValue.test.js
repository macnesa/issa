import { describe, expect, test } from "vitest";
import { parseScoreInput } from "./scoreValue";

describe("parseScoreInput", () => {
  test("keeps zero valid but rejects empty values", () => {
    expect(parseScoreInput(0)).toBe(0);
    expect(parseScoreInput("0")).toBe(0);
    expect(parseScoreInput("")).toBeNull();
    expect(parseScoreInput("   ")).toBeNull();
    expect(parseScoreInput(null)).toBeNull();
  });

  test("only accepts whole scores from 0 to 100", () => {
    expect(parseScoreInput("82")).toBe(82);
    expect(parseScoreInput("82.5")).toBeNull();
    expect(parseScoreInput(-1)).toBeNull();
    expect(parseScoreInput(101)).toBeNull();
    expect(parseScoreInput("abc")).toBeNull();
  });
});
