import React, { createContext, useContext, useState, ReactNode } from "react";
import { LegalEntity } from "./store";

interface FilterState {
  entity: LegalEntity | "all";
  period: "month" | "quarter" | "year";
  clientIds: string[];
}

interface FilterContextValue {
  filters: FilterState;
  setEntity: (e: LegalEntity | "all") => void;
  setPeriod: (p: "month" | "quarter" | "year") => void;
  setClientIds: (ids: string[]) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    entity: "all",
    period: "year",
    clientIds: [],
  });

  return (
    <FilterContext.Provider
      value={{
        filters,
        setEntity: (entity) => setFilters((f) => ({ ...f, entity })),
        setPeriod: (period) => setFilters((f) => ({ ...f, period })),
        setClientIds: (clientIds) => setFilters((f) => ({ ...f, clientIds })),
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}

// Filter invoices
import { Invoice } from "./store";

export function filterInvoices(invoices: Invoice[], filters: FilterState): Invoice[] {
  return invoices.filter((inv) => {
    if (filters.entity !== "all" && inv.entity !== filters.entity) return false;
    if (filters.clientIds.length > 0 && !filters.clientIds.includes(inv.clientId)) return false;
    return true;
  });
}
