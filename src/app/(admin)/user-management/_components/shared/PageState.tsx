"use client";

import Link from "next/link";
import type { UseQueryResult } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import styles from "../students/StudentProfile.module.css";

/** Loading / not found / error for a detail page's main query; null once data is in. */
export default function PageState({
  query,
  noun,
  backHref,
}: {
  query: Pick<UseQueryResult, "isPending" | "isError" | "error" | "refetch" | "isFetching">;
  noun: string;
  backHref: string;
}) {
  let body: React.ReactNode = null;
  if (query.isPending) body = <LoadingState variant="block" label={`Loading ${noun}…`} />;
  else if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : 0;
    body =
      status === 404 || status === 400 ? (
        <EmptyState title={`${noun[0].toUpperCase()}${noun.slice(1)} not found`} description="It may have been removed, or the link is wrong." />
      ) : (
        <ErrorState error={query.error} title={`Couldn't load this ${noun}`} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      );
  }
  if (!body) return null;
  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href={backHref} className={styles.back}>
          ← Back
        </Link>
      </div>
      {body}
    </div>
  );
}
