"use client";

import { ErrorState, LoadingState } from "@/components/ui/States";
import styles from "../students/ProgramDetail.module.css";

type Q = { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown; isFetching: boolean };

/** Loading / error block for a tab panel's query; null once data is in. */
export default function PanelState({ query, noun }: { query: Q; noun: string }) {
  if (query.isPending) return <LoadingState className={styles.panelState} variant="block" label={`Loading ${noun}…`} />;
  if (query.isError)
    return (
      <div className={styles.panelState}>
        <ErrorState error={query.error} title={`Couldn't load ${noun}`} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </div>
    );
  return null;
}
