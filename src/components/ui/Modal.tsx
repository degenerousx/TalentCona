"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const widths = { sm: "max-w-lg", md: "max-w-[672px]", lg: "max-w-3xl" };

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Line under the title: plain text or richer content. */
  subtitle?: React.ReactNode;
  /** Pinned under the scrolling body (e.g. the primary action). */
  footer?: React.ReactNode;
  titleClassName?: string;
  /** Max width: "lg" (768px, default), "md" (672px) or "sm" (512px). */
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
};

/**
 * Accessible dialog built on the native <dialog> element: it traps focus,
 * closes on Escape and returns focus to the trigger when closed.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  titleClassName = "text-ink",
  size = "lg",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    // Remember the trigger so focus goes back to it, even if the modal unmounts.
    const trigger = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      trigger?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Only user actions report a close. (Not the native "close" event: it
      // also fires when the effect cleanup closes the dialog, which React's
      // dev-mode double effects would turn into an instant close.)
      onCancel={(e) => {
        e.preventDefault(); // Escape: let the parent unmount us instead.
        onClose();
      }}
      // Clicking the backdrop (the dialog element itself) closes it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${widths[size]} overflow-hidden rounded-lg bg-white p-0 shadow-xl backdrop:bg-slate-900/50 open:flex open:flex-col`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-50 px-6 py-6">
        <div className="min-w-0">
          <h2 id={titleId} className={`text-2xl leading-8 font-bold ${titleClassName}`}>
            {title}
          </h2>
          {subtitle}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-slate-900"
        >
          <X aria-hidden className="size-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">{children}</div>

      {footer && <div className="border-t border-slate-50 px-6 pt-4 pb-6">{footer}</div>}
    </dialog>
  );
}

/** Section inside a modal: an 18px heading followed by content. */
export function ModalSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <h3 className="mb-3 text-lg leading-7 font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}
