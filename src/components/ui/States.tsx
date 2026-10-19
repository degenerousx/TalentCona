"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Inbox, Lock, RotateCw, SearchX, TriangleAlert, WifiOff, type LucideIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Card } from "./Card";
import { Spinner } from "./Spinner";

/**
 * Loading, error and empty states for anything fetched from the API.
 * Same look as the Laptops "No laptops found" card: flat Card, muted icon,
 * semibold title, slate description, optional action.
 *
 * Most screens only need <QueryState> at the bottom of this file.
 */

const frame = "flex min-h-48 flex-col items-center justify-center gap-1 px-6 py-10 text-center";

// ---- Loading ---------------------------------------------------------------

type LoadingStateProps = {
  /**
   * "list": skeleton rows in a card (tables, lists).
   * "block": brand spinner centred in a card (detail pages, charts, forms).
   * "inline": small spinner + text for tight spots.
   */
  variant?: "list" | "block" | "inline";
  /** Skeleton rows for the "list" variant. Match roughly how many rows you expect. */
  rows?: number;
  /** Read out by screen readers. */
  label?: string;
  className?: string;
};

export function LoadingState({ variant = "list", rows = 5, label = "Loading…", className }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <span role="status" className={cn("inline-flex items-center gap-2 text-sm leading-5 text-slate-500", className)}>
        <Spinner size="sm" />
        {label}
      </span>
    );
  }

  if (variant === "block") {
    return (
      <Card role="status" flat className={cn(frame, "gap-3", className)}>
        <Spinner size="lg" />
        <p className="text-sm leading-5 text-slate-500">{label}</p>
      </Card>
    );
  }

  return (
    <Card role="status" flat className={cn("overflow-hidden", className)}>
      <span className="sr-only">{label}</span>
      {/* Header strip like DataTable's. */}
      <div aria-hidden className="border-b border-gray-200 bg-gray-50 px-6 py-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
      <ul aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 border-b border-gray-200 px-6 py-4 last:border-b-0">
            <div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
            <div className="flex flex-1 flex-col gap-2">
              {/* Varying widths so it reads as content, not stripes. */}
              <div className="h-3 animate-pulse rounded bg-gray-200" style={{ width: `${60 - ((i * 13) % 25)}%` }} />
              <div className="h-3 w-1/4 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="hidden h-6 w-20 animate-pulse rounded-full bg-gray-100 sm:block" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---- Error -----------------------------------------------------------------

type ErrorCopy = { icon: LucideIcon; title: string; message: string; canRetry: boolean };

/** Turns any thrown error into user-facing copy. Backend messages are shown as-is for 4xx. */
export function describeError(error: unknown): ErrorCopy {
  if (!(error instanceof ApiError)) {
    return { icon: TriangleAlert, title: "Something went wrong", message: "Please try again.", canRetry: true };
  }
  if (error.status === 0) {
    return {
      icon: WifiOff,
      title: "Can't reach the server",
      message: "Check your internet connection, then try again.",
      canRetry: true,
    };
  }
  if (error.status === 403) {
    return {
      icon: Lock,
      title: "You don't have access",
      message: "Your admin account doesn't have permission for this. Ask a super admin if you need it.",
      canRetry: false,
    };
  }
  if (error.status === 404) {
    return { icon: SearchX, title: "Not found", message: "This item doesn't exist or was removed.", canRetry: false };
  }
  if (error.status === 429) {
    return {
      icon: TriangleAlert,
      title: "Too many requests",
      message: "Wait a moment, then try again.",
      canRetry: true,
    };
  }
  if (error.status >= 500) {
    return {
      icon: TriangleAlert,
      title: "Something went wrong on our side",
      message: "The server couldn't complete this request. Try again in a moment.",
      canRetry: true,
    };
  }
  return { icon: TriangleAlert, title: "Couldn't load this", message: error.message, canRetry: true };
}

type ErrorStateProps = {
  error: unknown;
  /** Shows a Try again button when the error is retryable. Pass the query's `refetch`. */
  onRetry?: () => void;
  /** Spins the button while the retry runs. Pass the query's `isFetching`. */
  retrying?: boolean;
  /** Replaces the default title, e.g. "Couldn't load admins". */
  title?: string;
  className?: string;
};

export function ErrorState({ error, onRetry, retrying, title, className }: ErrorStateProps) {
  const copy = describeError(error);
  const Icon = copy.icon;
  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <Card role="alert" flat className={cn(frame, className)}>
      <Icon aria-hidden className="mb-2 size-7 text-danger" />
      <p className="text-sm leading-5 font-semibold text-gray-900">{title ?? copy.title}</p>
      <p className="max-w-md text-sm leading-5 text-slate-500">{copy.message}</p>
      {onRetry && copy.canRetry && (
        <Button
          variant="outline"
          size="md"
          className="mt-3"
          onClick={onRetry}
          disabled={retrying}
          icon={<RotateCw aria-hidden className={cn("size-4", retrying && "animate-spin")} />}
        >
          {retrying ? "Retrying…" : "Try again"}
        </Button>
      )}
      {/* For bug reports: the backend finds the exact request by this id. */}
      {requestId && (
        <p className="mt-3 text-xs leading-4 text-muted">
          Reference: <span className="font-mono break-all select-all">{requestId}</span>
        </p>
      )}
    </Card>
  );
}

// ---- Empty -----------------------------------------------------------------

type EmptyStateProps = {
  /** e.g. "No admins yet", or "No results" when a search/filter is active. */
  title: string;
  /** What to do next: "Invite an admin to get started." / "Try changing your search or filters." */
  description?: string;
  /** Lucide icon. Defaults to Inbox; use Search for filtered lists. */
  icon?: LucideIcon;
  /** A Button or ButtonLink, e.g. "Add Laptop". */
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <Card role="status" flat className={cn(frame, className)}>
      <Icon aria-hidden className="mb-2 size-7 text-muted" />
      <p className="text-sm leading-5 font-semibold text-gray-900">{title}</p>
      {description && <p className="max-w-md text-sm leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}

// ---- QueryState ------------------------------------------------------------

type QueryStateProps<T> = {
  query: UseQueryResult<T>;
  /** Decide when the data counts as empty, e.g. `(d) => d.items.length === 0`. */
  isEmpty?: (data: T) => boolean;
  /** Shown when `isEmpty` is true. Defaults to a generic "Nothing here yet". */
  empty?: React.ReactNode;
  /** Replaces the default skeleton, e.g. <LoadingState rows={3} />. */
  loading?: React.ReactNode;
  /** Title for the error card, e.g. "Couldn't load admins". */
  errorTitle?: string;
  /** Renders the loaded data. */
  children: (data: T) => React.ReactNode;
};

/**
 * Picks the right state for a TanStack query:
 *
 *   <QueryState query={useTeamMembers(page)} isEmpty={(d) => d.items.length === 0}
 *               empty={<EmptyState title="No admins yet" />}>
 *     {(data) => <DataTable rows={data.items} … />}
 *   </QueryState>
 *
 * If data is already on screen and a background refetch fails, the data stays —
 * a stale list beats an error card.
 */
export function QueryState<T>({ query, isEmpty, empty, loading, errorTitle, children }: QueryStateProps<T>) {
  if (query.data !== undefined) {
    if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
    return <>{children(query.data)}</>;
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title={errorTitle}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }
  return <>{loading ?? <LoadingState />}</>;
}
