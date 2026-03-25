// Data layer with localStorage persistence

export type LegalEntity = "DMZ" | "DM" | "NWL";
export type Currency = "USD" | "UZS";

export interface Client {
  id: string;
  nameDejure: string;
  nameDefacto: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  entity: LegalEntity;
  paymentTerms: string;
  amount: number;
  currency: Currency;
  exchangeRate: number | null; // UZS/USD rate
  amountUsd: number;
  issueDate: string;
  dueDate: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  amountUsd: number;
  date: string;
}

export interface AppData {
  clients: Client[];
  invoices: Invoice[];
}

const STORAGE_KEY = "ar_dashboard_data";

function generateId(): string {
  return crypto.randomUUID();
}

function getDefaultData(): AppData {
  return { clients: [], invoices: [] };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultData();
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Client operations
export function addClient(data: AppData, client: Omit<Client, "id" | "createdAt">): AppData {
  const newData = {
    ...data,
    clients: [...data.clients, { ...client, id: generateId(), createdAt: new Date().toISOString() }],
  };
  saveData(newData);
  return newData;
}

export function deleteClient(data: AppData, clientId: string): AppData {
  const newData = {
    clients: data.clients.filter((c) => c.id !== clientId),
    invoices: data.invoices.filter((i) => i.clientId !== clientId),
  };
  saveData(newData);
  return newData;
}

// Invoice operations
export function addInvoice(
  data: AppData,
  inv: Omit<Invoice, "id" | "payments" | "amountUsd" | "currency"> & { amount: number; exchangeRate: number | null }
): AppData {
  const entity = inv.entity;
  const currency: Currency = entity === "DMZ" ? "USD" : "UZS";
  const amountUsd = currency === "USD" ? inv.amount : inv.amount / (inv.exchangeRate || 1);

  const newInvoice: Invoice = {
    ...inv,
    id: generateId(),
    currency,
    amountUsd,
    payments: [],
  };

  const newData = { ...data, invoices: [...data.invoices, newInvoice] };
  saveData(newData);
  return newData;
}

export function deleteInvoice(data: AppData, invoiceId: string): AppData {
  const newData = { ...data, invoices: data.invoices.filter((i) => i.id !== invoiceId) };
  saveData(newData);
  return newData;
}

export function addPayment(
  data: AppData,
  invoiceId: string,
  payment: { amount: number; date: string }
): AppData {
  const newData = {
    ...data,
    invoices: data.invoices.map((inv) => {
      if (inv.id !== invoiceId) return inv;
      const paymentCurrency = inv.currency;
      const paymentAmountUsd =
        paymentCurrency === "USD" ? payment.amount : payment.amount / (inv.exchangeRate || 1);
      return {
        ...inv,
        payments: [
          ...inv.payments,
          { id: generateId(), amount: payment.amount, currency: paymentCurrency, amountUsd: paymentAmountUsd, date: payment.date },
        ],
      };
    }),
  };
  saveData(newData);
  return newData;
}

// Computed helpers
export function getInvoiceBalance(inv: Invoice): number {
  const totalPaid = inv.payments.reduce((s, p) => s + p.amountUsd, 0);
  return inv.amountUsd - totalPaid;
}

export function getInvoicePaidUsd(inv: Invoice): number {
  return inv.payments.reduce((s, p) => s + p.amountUsd, 0);
}

export function isOverdue(inv: Invoice): boolean {
  return new Date(inv.dueDate) < new Date() && getInvoiceBalance(inv) > 0;
}

export function getDaysOverdue(inv: Invoice): number {
  if (!isOverdue(inv)) return 0;
  const diff = new Date().getTime() - new Date(inv.dueDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getAgingBucket(inv: Invoice): string {
  const days = getDaysOverdue(inv);
  if (days <= 0) return "current";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

// Seed demo data
export function seedDemoData(): AppData {
  const clients: Client[] = [
    { id: "c1", nameDejure: 'ООО "ДМЗ Трейд"', nameDefacto: "DMZ Trade", createdAt: "2025-01-15" },
    { id: "c2", nameDejure: 'ТОО "Альфа Групп"', nameDefacto: "Alfa Group", createdAt: "2025-02-01" },
    { id: "c3", nameDejure: 'ООО "Бета Строй"', nameDefacto: "Beta Stroy", createdAt: "2025-03-10" },
    { id: "c4", nameDejure: 'ЧП "Гамма Сервис"', nameDefacto: "Gamma Service", createdAt: "2025-04-01" },
    { id: "c5", nameDejure: 'ООО "Дельта Логистик"', nameDefacto: "Delta Logistic", createdAt: "2025-05-15" },
  ];

  const now = new Date();
  const invoices: Invoice[] = [
    { id: "i1", invoiceNumber: "DMZ#10001", clientId: "c1", entity: "DMZ", paymentTerms: "Net 30", amount: 45000, currency: "USD", exchangeRate: null, amountUsd: 45000, issueDate: "2025-11-01", dueDate: "2025-12-01", payments: [{ id: "p1", amount: 15000, currency: "USD", amountUsd: 15000, date: "2025-12-15" }] },
    { id: "i2", invoiceNumber: "DM#20001", clientId: "c2", entity: "DM", paymentTerms: "Net 45", amount: 500000000, currency: "UZS", exchangeRate: 12800, amountUsd: 39062.5, issueDate: "2025-10-15", dueDate: "2025-11-29", payments: [] },
    { id: "i3", invoiceNumber: "NWL#30001", clientId: "c3", entity: "NWL", paymentTerms: "Предоплата 50%", amount: 250000000, currency: "UZS", exchangeRate: 12750, amountUsd: 19607.84, issueDate: "2026-01-10", dueDate: "2026-02-24", payments: [{ id: "p2", amount: 125000000, currency: "UZS", amountUsd: 9803.92, date: "2026-01-20" }] },
    { id: "i4", invoiceNumber: "DMZ#10002", clientId: "c4", entity: "DMZ", paymentTerms: "Net 30", amount: 78500, currency: "USD", exchangeRate: null, amountUsd: 78500, issueDate: "2026-01-05", dueDate: "2026-02-04", payments: [{ id: "p3", amount: 78500, currency: "USD", amountUsd: 78500, date: "2026-02-01" }] },
    { id: "i5", invoiceNumber: "DM#20002", clientId: "c5", entity: "DM", paymentTerms: "Net 60", amount: 1200000000, currency: "UZS", exchangeRate: 12850, amountUsd: 93385.21, issueDate: "2025-09-01", dueDate: "2025-10-31", payments: [{ id: "p4", amount: 400000000, currency: "UZS", amountUsd: 31128.4, date: "2025-11-15" }] },
    { id: "i6", invoiceNumber: "DMZ#10003", clientId: "c1", entity: "DMZ", paymentTerms: "Net 30", amount: 125000, currency: "USD", exchangeRate: null, amountUsd: 125000, issueDate: "2026-02-01", dueDate: "2026-03-03", payments: [] },
    { id: "i7", invoiceNumber: "NWL#30002", clientId: "c2", entity: "NWL", paymentTerms: "Net 30", amount: 380000000, currency: "UZS", exchangeRate: 12900, amountUsd: 29457.36, issueDate: "2026-03-01", dueDate: "2026-03-31", payments: [] },
    { id: "i8", invoiceNumber: "DM#20003", clientId: "c3", entity: "DM", paymentTerms: "Net 45", amount: 650000000, currency: "UZS", exchangeRate: 12800, amountUsd: 50781.25, issueDate: "2025-12-01", dueDate: "2026-01-15", payments: [] },
  ];

  const data = { clients, invoices };
  saveData(data);
  return data;
}
