import React, { createContext, useContext, useState, ReactNode } from "react";
import { LegalEntity, Invoice } from "./store";

interface FilterState {
  entity: LegalEntity | "all";
  months: number[];
  clientIds: string[];
  year: number;
}

interface FilterContextValue {
  filters: FilterState;
  setEntity: (e: LegalEntity | "all") => void;
  setMonths: (m: number[]) => void;
  setClientIds: (ids: string[]) => void;
  setYear: (y: number) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    entity: "all",
    months: [],
    clientIds: [],
    year: new Date().getFullYear(),
  });

  return (
    <FilterContext.Provider
      value={{
        filters,
        setEntity: (entity) => setFilters((f) => ({ ...f, entity })),
        setMonths: (months) => setFilters((f) => ({ ...f, months })),
        setClientIds: (clientIds) => setFilters((f) => ({ ...f, clientIds })),
        setYear: (year) => setFilters((f) => ({ ...f, year })),
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
    const issueDate = new Date(inv.issueDate);
    if (issueDate.getFullYear() !== filters.year) return false;
    if (filters.months.length > 0) {
      if (!filters.months.includes(issueDate.getMonth())) return false;
    }
    return true;
  });
}
