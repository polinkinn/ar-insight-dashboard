import { AlertTriangle, Clock, CheckCircle, DollarSign } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { Invoice, getInvoiceBalance, isOverdue } from "@/lib/store";

interface KpiCardsProps {
  invoices: Invoice[];        // filtered by issueDate (for total AR)
  allInvoices: Invoice[];     // all invoices (for payment-date based metrics)
  selectedYear: number;
  selectedMonths: number[];   // empty = all months
}

export function KpiCards({ invoices, allInvoices, selectedYear, selectedMonths }: KpiCardsProps) {
  // Total AR: from filtered invoices (by issue date)
  const totalAr = invoices.reduce((s, i) => s + getInvoiceBalance(i), 0);

  // Overdue: from filtered invoices where dueDate < today and balance > 0
  const overdueTotal = invoices.filter(isOverdue).reduce((s, i) => s + getInvoiceBalance(i), 0);

  // Expected: from filtered invoices where dueDate >= today and balance > 0
  const now = new Date();
  const expectedTotal = invoices
    .filter((i) => {
      const due = new Date(i.dueDate);
      return getInvoiceBalance(i) > 0 && due >= now;
    })
    .reduce((s, i) => s + getInvoiceBalance(i), 0);

  // Paid: sum ALL payments where payment.date falls in selected year+months
  // This searches across ALL invoices, not just filtered ones
  const paidInPeriod = allInvoices.reduce((s, inv) => {
    const matchingPayments = inv.payments.filter((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() !== selectedYear) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(d.getMonth())) return false;
      return true;
    });
    return s + matchingPayments.reduce((ps, p) => ps + p.amountUsd, 0);
  }, 0);

  const periodLabel = selectedMonths.length === 0
    ? `за ${selectedYear}`
    : selectedMonths.length === 1
      ? "за месяц"
      : "за период";

  const cards = [
    { label: "Общая задолженность", value: totalAr, icon: DollarSign, color: "text-primary" },
    { label: "Просрочено", value: overdueTotal, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ожидается к поступлению", value: expectedTotal, icon: Clock, color: "text-warning" },
    { label: `Оплачено (${periodLabel})`, value: paidInPeriod, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {card.label}
            </span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <span className={`font-mono text-2xl font-semibold ${card.color}`}>
            {formatUsd(card.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
