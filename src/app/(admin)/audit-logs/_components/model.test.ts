import { describe, it, expect } from "vitest";
import { humanize, moduleOf, typeOf } from "./model";

describe("humanize", () => {
  it("turns an action code into a sentence and keeps acronyms", () => {
    expect(humanize("ADMIN_MFA_RESET_BY_ADMIN")).toBe("Admin MFA reset by admin");
  });
});

describe("moduleOf", () => {
  it("uses the backend's action list", () => {
    expect(moduleOf("WALLET", "WALLET_ENROLLMENT_DEBITED")).toBe("Financial Ops");
    expect(moduleOf("ADMIN", "ADMIN_MFA_RESET_BY_ADMIN")).toBe("Admin Management");
  });
});

describe("typeOf", () => {
  it("does not mistake 'BANK' for 'ban'", () => {
    expect(typeOf("BANK_EVIDENCE_UPDATED")).toBe("Change");
  });

  it("marks failed logins as Security", () => {
    expect(typeOf("LOGIN_FAILED")).toBe("Security");
  });
});
