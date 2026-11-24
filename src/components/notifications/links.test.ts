import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { resolveTarget } from "./links";
import type { AppNotification } from "./api";

// Replace the real backend call with a fake we control.
vi.mock("@/lib/api", () => ({ api: vi.fn() }));
const fakeApi = vi.mocked(api);

const notification = (overrides: Partial<AppNotification>): AppNotification => ({
  id: "n-1",
  type: "",
  title: "",
  body: null,
  data: null,
  readAt: null,
  createdAt: "2026-11-24T10:00:00Z",
  ...overrides,
});

describe("resolveTarget", () => {
  beforeEach(() => fakeApi.mockReset());

  it("uses data.url when the backend sends one", async () => {
    const n = notification({ type: "ANY", data: { url: "/referrals#queue" } });
    expect(await resolveTarget(n)).toEqual({ href: "/referrals#queue", external: false });
  });

  it("opens Audit & System Logs for an audit export", async () => {
    const n = notification({ type: "AUDIT_LOG_EXPORT_COMPLETED", title: "Audit export ready" });
    expect(await resolveTarget(n)).toEqual({ href: "/audit-logs", external: false });
  });

  it("has nothing to open for a password change", async () => {
    expect(await resolveTarget(notification({ type: "PASSWORD_CHANGED", title: "Password changed" }))).toBeNull();
  });

  it("finds the student and program for an urgent mentor request", async () => {
    fakeApi.mockResolvedValue({
      items: [{ id: "s-1", fullName: "Semi Lore", programs: [{ enrollmentId: "e-9", title: "Project Management" }] }],
    });
    const n = notification({
      type: "URGENT_MENTOR_REQUEST",
      title: "Urgent mentor request",
      body: "Semi Lore needs a mentor for Project Management.",
    });

    expect(await resolveTarget(n)).toEqual({ href: "/user-management/s-1/e-9", external: false });
    expect(fakeApi).toHaveBeenCalledWith("/students/admin", expect.objectContaining({ query: { search: "Semi Lore", limit: 20 } }));
  });
});
