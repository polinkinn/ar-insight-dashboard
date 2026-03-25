import { Invoice, getInvoiceBalance, getDaysOverdue, Client } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface DashboardTablesProps {
  invoices: Invoice[];
  allInvoices: Invoice[];  // entity+client filtered, no date filter
  clients: Client[];
  selectedYear: number;
  selectedMonths: number[];
}

export function DashboardTables({ invoices, allInvoices, clients, selectedYear, selectedMonths }: DashboardTablesProps) {
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Top-5 by receipts: sum payments where payment.date falls in selected period
  const clientReceipts = new Map<string, number>();
  const clientPayDays = new Map<string, number[]>();

  allInvoices.forEach((inv) => {
    inv.payments.forEach((p) => {
      const pd = new Date(p.date);
      if (pd.getFullYear() !== selectedYear) return;
      if (selectedMonths.length > 0 && !selectedMonths.includes(pd.getMonth())) return;

      clientReceipts.set(inv.clientId, (clientReceipts.get(inv.clientId) || 0) + p.amountUsd);

      // Calc days between issueDate and payment date
      const issueDate = new Date(inv.issueDate);
      const diffDays = Math.floor((pd.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (!clientPayDays.has(inv.clientId)) clientPayDays.set(inv.clientId, []);
      clientPayDays.get(inv.clientId)!.push(diffDays);
    });
  });

  const topClients = Array.from(clientReceipts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, receipts]) => {
      const days = clientPayDays.get(id) || [];
      const avgDays = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null;
      return {
        name: clientMap.get(id)?.nameDefacto || id,
        receipts,
        avgDays,
      };
    });

  // Overdue >60 days (from issue-date filtered invoices)
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
          Топ-5 клиентов по поступлениям
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left pb-2">Клиент</th>
              <th className="text-right pb-2">Поступления</th>
              <th className="text-right pb-2">Среднее время оплаты (дни)</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((c) => (
              <tr key={c.name} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                <td className="py-2.5 text-foreground">{c.name}</td>
                <td className="py-2.5 text-right font-mono text-foreground">{formatUsd(c.receipts)}</td>
                <td className="py-2.5 text-right font-mono text-muted-foreground">{c.avgDays !== null ? c.avgDays : "—"}</td>
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
