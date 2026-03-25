import { useState, useCallback } from "react";
import {
  AppData, loadData, seedDemoData,
  addClient as _addClient, deleteClient as _deleteClient, updateClient as _updateClient,
  addInvoice as _addInvoice, deleteInvoice as _deleteInvoice, updateInvoice as _updateInvoice,
  addPayment as _addPayment,
  Client, Invoice, PaymentResolution,
} from "./store";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const d = loadData();
    if (d.clients.length === 0 && d.invoices.length === 0) return seedDemoData();
    return d;
  });

  const addClient = useCallback((client: Omit<Client, "id" | "createdAt">) => {
    setData((d) => _addClient(d, client));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setData((d) => _deleteClient(d, id));
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setData((d) => _updateClient(d, id, updates));
  }, []);

  const addInvoice = useCallback(
    (inv: Omit<Invoice, "id" | "payments" | "amountUsd" | "currency" | "paymentResolution"> & { amount: number; exchangeRate: number | null }) => {
      setData((d) => _addInvoice(d, inv));
    },
    []
  );

  const updateInvoice = useCallback(
    (invoiceId: string, inv: Omit<Invoice, "id" | "payments" | "amountUsd" | "currency" | "paymentResolution"> & { amount: number; exchangeRate: number | null }) => {
      setData((d) => _updateInvoice(d, invoiceId, inv));
    },
    []
  );

  const deleteInvoice = useCallback((id: string) => {
    setData((d) => _deleteInvoice(d, id));
  }, []);

  const addPayment = useCallback((invoiceId: string, payment: { amount: number; date: string }, resolution?: PaymentResolution) => {
    setData((d) => _addPayment(d, invoiceId, payment, resolution || null));
  }, []);

  return { data, addClient, deleteClient, updateClient, addInvoice, updateInvoice, deleteInvoice, addPayment };
}
