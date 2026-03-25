import { useState, useCallback, useEffect } from "react";
import {
  AppData, loadData, seedDemoData,
  addClient as _addClient, deleteClient as _deleteClient,
  addInvoice as _addInvoice, deleteInvoice as _deleteInvoice,
  addPayment as _addPayment,
  Client, Invoice, LegalEntity,
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

  const addInvoice = useCallback(
    (inv: Omit<Invoice, "id" | "payments" | "amountUsd" | "currency"> & { amount: number; exchangeRate: number | null }) => {
      setData((d) => _addInvoice(d, inv));
    },
    []
  );

  const deleteInvoice = useCallback((id: string) => {
    setData((d) => _deleteInvoice(d, id));
  }, []);

  const addPayment = useCallback((invoiceId: string, payment: { amount: number; date: string }) => {
    setData((d) => _addPayment(d, invoiceId, payment));
  }, []);

  return { data, addClient, deleteClient, addInvoice, deleteInvoice, addPayment };
}
