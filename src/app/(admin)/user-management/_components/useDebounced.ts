import { useEffect, useState } from "react";

/** `value`, updated only after it stops changing for `ms` (for search boxes that query the API). */
export function useDebounced<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
