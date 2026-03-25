import { Invoice, getInvoiceBalance, getDaysOverdue, isOverdue, Client } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface DashboardTablesProps {
  invoices: Invoice[];
  clients: Client[];
}

export function DashboardTables({ invoices, clients }: DashboardTablesProps) {
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const clientBalances = new Map<string, number>();
  const clientTerms = new Map<string, string>();
  invoices.forEach((inv) => {
    const bal = getInvoiceBalance(inv);
    clientBalances.set(inv.clientId, (clientBalances.get(inv.clientId) || 0) + bal);
    if (!clientTerms.has(inv.clientId)) clientTerms.set(inv.clientId, inv.paymentTerms);
  });

  const topClients = Array.from(clientBalances.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, balance]) => ({
      name: clientMap.get(id)?.nameDefacto || id,
      balance,
      terms: clientTerms.get(id) || "—",
    }));

  const overdueInvoices = invoices
    .filter((i) => getDaysOverdue(i) > 60)
    .sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))
    .map((inv) => ({
      number: inv.invoiceNumber,
      days: getDaysOverdue(inv),
      amount: getInvoiceBalance(inv),
      client: clientMap.get(inv.clientId)?.nameDefacto || "",
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Топ-5 клиентов по балансу
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left pb-2">Клиент</th>
              <th className="text-right pb-2">Баланс</th>
              <th className="text-right pb-2">Условия</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((c) => (
              <tr key={c.name} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                <td className="py-2.5 text-foreground">{c.name}</td>
                <td className="py-2.5 text-right font-mono text-foreground">{formatUsd(c.balance)}</td>
                <td className="py-2.5 text-right text-muted-foreground">{c.terms}</td>
              </tr>
            ))}
            {topClients.length === 0 && (
              <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Нет данных</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Просрочено более 60 дней
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left pb-2">Инвойс</th>
              <th className="text-left pb-2">Клиент</th>
              <th className="text-right pb-2">Дни</th>
              <th className="text-right pb-2">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {overdueInvoices.map((inv) => (
              <tr key={inv.number} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                <td className="py-2.5 font-mono text-foreground">{inv.number}</td>
                <td className="py-2.5 text-foreground">{inv.client}</td>
                <td className="py-2.5 text-right font-mono text-destructive font-medium">{inv.days}</td>
                <td className="py-2.5 text-right font-mono text-destructive">{formatUsd(inv.amount)}</td>
              </tr>
            ))}
            {overdueInvoices.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Нет просроченных счетов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
