import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortState<K extends string = string> {
  key: K | null;
  direction: SortDirection;
}

export function useSortable<T, K extends string = string>(
  data: T[],
  getters: Record<K, (item: T) => string | number | null>
) {
  const [sort, setSort] = useState<SortState<K>>({ key: null, direction: null });

  const toggle = useCallback((key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    const getter = getters[sort.key];
    if (!getter) return data;
    const dir = sort.direction === "asc" ? 1 : -1;
    // Decorate with original index to guarantee a stable, deterministic order
    // when primary keys compare equal (independent of engine sort stability).
    const indexed = data.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      const va = getter(a.item);
      const vb = getter(b.item);
      let cmp = 0;
      if (va === null && vb === null) cmp = 0;
      else if (va === null) cmp = 1;
      else if (vb === null) cmp = -1;
      else if (typeof va === "string" && typeof vb === "string") cmp = va.localeCompare(vb) * dir;
      else cmp = ((va as number) - (vb as number)) * dir;
      // Secondary key: original index (always ascending) for deterministic tie-breaks.
      if (cmp !== 0) return cmp;
      return a.index - b.index;
    });
    return indexed.map((x) => x.item);
  }, [data, sort, getters]);

  return { sorted, sort, toggle };
}
