import React, { createContext, useContext, useState, ReactNode } from "react";
import { LegalEntity, Invoice } from "./store";

interface FilterState {
  entity: LegalEntity | "all";
  months: number[]; // 0-11
  clientIds: string[];
}

interface FilterContextValue {
  filters: FilterState;
  setEntity: (e: LegalEntity | "all") => void;
  setMonths: (m: number[]) => void;
  setClientIds: (ids: string[]) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    entity: "all",
    months: [],
    clientIds: [],
  });

  return (
    <FilterContext.Provider
      value={{
        filters,
        setEntity: (entity) => setFilters((f) => ({ ...f, entity })),
        setMonths: (months) => setFilters((f) => ({ ...f, months })),
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

export function filterInvoices(invoices: Invoice[], filters: FilterState): Invoice[] {
  return invoices.filter((inv) => {
    if (filters.entity !== "all" && inv.entity !== filters.entity) return false;
    if (filters.clientIds.length > 0 && !filters.clientIds.includes(inv.clientId)) return false;
    if (filters.months.length > 0) {
      const issueMonth = new Date(inv.issueDate).getMonth();
      if (!filters.months.includes(issueMonth)) return false;
    }
    return true;
  });
}
