import { describe, it, expect } from "vitest";
import { money, compactMoney } from "./api";

describe("money", () => {
  it("turns kobo (minor units) into naira", () => {
    expect(money(2160000)).toBe("₦21,600");
  });

  it("treats a missing amount as zero", () => {
    expect(money(null)).toBe("₦0");
  });

  it("labels other currencies with their code", () => {
    expect(money(150000, "USD", 100)).toBe("USD 1,500");
  });
});

describe("compactMoney", () => {
  it.each([
    [1243000000, "₦12.4M"],
    [19800000, "₦198K"],
    [50000, "₦500"],
  ])("shows %i kobo as %s", (minor, expected) => {
    expect(compactMoney(minor)).toBe(expected);
  });
});
