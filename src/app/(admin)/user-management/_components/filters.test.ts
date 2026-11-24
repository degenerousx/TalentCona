import { describe, it, expect } from "vitest";
import { applicationStatusLabel } from "./filters";

describe("applicationStatusLabel", () => {
  it("shows Draft as Not Submitted", () => {
    expect(applicationStatusLabel("Draft")).toBe("Not Submitted");
  });

  it("shows a dash when there is no status", () => {
    expect(applicationStatusLabel(null)).toBe("—");
  });
});
