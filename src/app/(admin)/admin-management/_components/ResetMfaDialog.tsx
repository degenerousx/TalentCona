"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { stepUp } from "@/lib/auth";
import { useClearMemberMfa } from "./api";
import type { Admin } from "./data";

/**
 * Reset a member's MFA (DELETE /admin-portal/team/members/:id/mfa). The backend
 * wants a fresh MFA step-up, so the signed-in admin confirms with their own
 * authenticator code first.
 */
export function ResetMfaDialog({ admin, onClose }: { admin: Admin; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clear = useClearMemberMfa();

  async function confirm() {
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your authenticator app.");
    setError(null);
    setBusy(true);
    try {
      await stepUp(code);
    } catch (err) {
      setBusy(false);
      return setError(err instanceof ApiError && err.status < 500 && err.status > 0 ? "That code didn't work. Try the newest one." : "Couldn't check your code. Try again.");
    }
    clear.mutate(admin.id, {
      onSuccess: () => {
        toast.success(`${admin.name} will set up MFA again at their next sign-in`);
        onClose();
      },
      onError: (err) => {
        setBusy(false);
        setError(err instanceof Error && err.message ? err.message : "Couldn't reset MFA. Try again.");
      },
    });
  }

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Reset MFA?"
      subtitle={`${admin.name} · ${admin.email}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="px-5" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" className="px-4" onClick={() => void confirm()} disabled={busy}>
            {busy ? "Resetting…" : "Reset MFA"}
          </Button>
        </div>
      }
    >
      <p className="text-base leading-6 text-slate-700">
        Their authenticator is removed and they set up a new one at their next sign-in. Use this when they lose their phone.
      </p>
      <label className="flex flex-col gap-2 text-sm leading-5 font-medium text-slate-700">
        Your 6-digit authenticator code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="h-11 rounded-lg border border-slate-300 px-3 text-base font-normal tracking-widest focus:border-accent focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm leading-5 text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
