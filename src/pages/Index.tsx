import { useState } from "react";
import { useAppData } from "@/lib/useAppData";
import { FilterProvider, useFilters, filterInvoices } from "@/lib/filters";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { TrendCharts } from "@/components/dashboard/TrendCharts";
import { DashboardTables } from "@/components/dashboard/DashboardTables";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ClientManager } from "@/components/management/ClientManager";
import { InvoiceManager } from "@/components/management/InvoiceManager";
import { BarChart3, Users, FileText } from "lucide-react";

type Tab = "dashboard" | "clients" | "invoices";

function DashboardContent() {
  const { data, addClient, deleteClient, addInvoice, updateInvoice, deleteInvoice, addPayment } = useAppData();
  const { filters } = useFilters();
  const [tab, setTab] = useState<Tab>("dashboard");

  const filtered = filterInvoices(data.invoices, filters);

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "dashboard", label: "Дашборд", icon: BarChart3 },
    { id: "invoices", label: "Инвойсы", icon: FileText },
    { id: "clients", label: "Клиенты", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1720px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Дебиторская задолженность
            </h1>
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-alt"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <FilterBar clients={data.clients} invoices={data.invoices} />
        </div>
      </header>

      <main className="max-w-[1720px] mx-auto px-6 py-5 space-y-4">
        {tab === "dashboard" && (
          <>
            <KpiCards invoices={filtered} />
            <AgingChart invoices={filtered} clients={data.clients} />
            <TrendCharts invoices={filtered} />
            <DashboardTables invoices={filtered} clients={data.clients} />
          </>
        )}

        {tab === "invoices" && (
          <InvoiceManager
            invoices={filtered}
            clients={data.clients}
            onAddInvoice={addInvoice}
            onUpdateInvoice={updateInvoice}
            onDeleteInvoice={deleteInvoice}
            onAddPayment={addPayment}
          />
        )}

        {tab === "clients" && (
          <ClientManager
            clients={data.clients}
            onAdd={addClient}
            onDelete={deleteClient}
          />
        )}
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
}
