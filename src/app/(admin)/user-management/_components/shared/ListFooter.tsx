import styles from "../UserManagement.module.css";

/** "Showing 20" + Load more, for cursor-paged lists. */
export default function ListFooter({
  shown,
  noun,
  hasMore,
  loading,
  onMore,
}: {
  shown: number;
  noun: string;
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
}) {
  if (!shown) return null;
  return (
    <div className={styles.loadMoreRow}>
      <span>
        Showing {shown} {shown === 1 ? noun.replace(/s$/, "") : noun}
        {hasMore ? " so far" : ""}
      </span>
      {hasMore && (
        <button type="button" className={styles.loadMore} onClick={onMore} disabled={loading}>
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
