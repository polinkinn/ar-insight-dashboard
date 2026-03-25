import { AlertTriangle, Clock, CheckCircle, DollarSign } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { Invoice, getInvoiceBalance, isOverdue, getInvoicePaidUsd } from "@/lib/store";

interface KpiCardsProps {
  invoices: Invoice[];
}

export function KpiCards({ invoices }: KpiCardsProps) {
  const totalAr = invoices.reduce((s, i) => s + getInvoiceBalance(i), 0);
  const overdueTotal = invoices.filter(isOverdue).reduce((s, i) => s + getInvoiceBalance(i), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expectedTotal = invoices
    .filter((i) => {
      const due = new Date(i.dueDate);
      return getInvoiceBalance(i) > 0 && due >= now;
    })
    .reduce((s, i) => s + getInvoiceBalance(i), 0);

  const paidThisMonth = invoices.reduce((s, inv) => {
    const monthPayments = inv.payments.filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return s + monthPayments.reduce((ps, p) => ps + p.amountUsd, 0);
  }, 0);

  const cards = [
    { label: "Общая задолженность", value: totalAr, icon: DollarSign, color: "text-primary" },
    { label: "Просрочено", value: overdueTotal, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ожидается к поступлению", value: expectedTotal, icon: Clock, color: "text-warning" },
    { label: "Оплачено (месяц)", value: paidThisMonth, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border p-5 rounded-lg hover:border-muted-foreground/30 transition-colors"
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
