import React, { createContext, useContext, useState, ReactNode } from "react";
import { LegalEntity, Invoice } from "./store";

interface FilterState {
  entities: LegalEntity[];
  months: number[];
  clientIds: string[];
  years: number[];
  search: string;
}

interface FilterContextValue {
  filters: FilterState;
  setEntities: (e: LegalEntity[]) => void;
  setMonths: (m: number[]) => void;
  setClientIds: (ids: string[]) => void;
  setYears: (y: number[]) => void;
  setSearch: (s: string) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    entities: [],
    months: [],
    clientIds: [],
    years: [new Date().getFullYear()],
    search: "",
  });

  return (
    <FilterContext.Provider
      value={{
        filters,
        setEntities: (entities) => setFilters((f) => ({ ...f, entities })),
        setMonths: (months) => setFilters((f) => ({ ...f, months })),
        setClientIds: (clientIds) => setFilters((f) => ({ ...f, clientIds })),
        setYears: (years) => setFilters((f) => ({ ...f, years })),
        setSearch: (search) => setFilters((f) => ({ ...f, search })),
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

/** Filter by ALL criteria: years + months + entities + client + search (based on issueDate) */
export function filterInvoices(invoices: Invoice[], filters: FilterState): Invoice[] {
  return invoices.filter((inv) => {
    if (filters.entities.length > 0 && !filters.entities.includes(inv.entity)) return false;
    if (filters.clientIds.length > 0 && !filters.clientIds.includes(inv.clientId)) return false;
    const issueDate = new Date(inv.issueDate);
    if (filters.years.length > 0 && !filters.years.includes(issueDate.getFullYear())) return false;
    if (filters.months.length > 0 && !filters.months.includes(issueDate.getMonth())) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchText = inv.invoiceNumber.toLowerCase().includes(q) || (inv.description || "").toLowerCase().includes(q);
      const matchAmount = !isNaN(Number(q)) && (Math.abs(inv.amountUsd - Number(q)) < 0.01 || Math.abs(inv.amount - Number(q)) < 0.01);
      if (!matchText && !matchAmount) return false;
    }
    return true;
  });
}

/** Filter by entities + client only (no date filter). Used for payment-date based metrics. */
export function filterInvoicesNonDate(invoices: Invoice[], filters: FilterState): Invoice[] {
  return invoices.filter((inv) => {
    if (filters.entities.length > 0 && !filters.entities.includes(inv.entity)) return false;
    if (filters.clientIds.length > 0 && !filters.clientIds.includes(inv.clientId)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchText = inv.invoiceNumber.toLowerCase().includes(q) || (inv.description || "").toLowerCase().includes(q);
      const matchAmount = !isNaN(Number(q)) && (Math.abs(inv.amountUsd - Number(q)) < 0.01 || Math.abs(inv.amount - Number(q)) < 0.01);
      if (!matchText && !matchAmount) return false;
    }
    return true;
  });
}
