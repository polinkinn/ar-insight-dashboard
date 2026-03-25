import { AlertTriangle, Clock, CheckCircle, DollarSign } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { Invoice, getInvoiceBalance, isOverdue } from "@/lib/store";

const MONTHS_RU_FULL = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

interface KpiCardsProps {
  invoices: Invoice[];        // filtered by all filters (issueDate based)
  allInvoices: Invoice[];     // filtered by entity+client only (for payment-date metrics)
  selectedYear: number;
  selectedMonths: number[];
}

export function KpiCards({ invoices, allInvoices, selectedYear, selectedMonths }: KpiCardsProps) {
  const totalAr = invoices.reduce((s, i) => s + getInvoiceBalance(i), 0);
  const overdueTotal = invoices.filter(isOverdue).reduce((s, i) => s + getInvoiceBalance(i), 0);

  const now = new Date();
  const expectedTotal = invoices
    .filter((i) => {
      const due = new Date(i.dueDate);
      return getInvoiceBalance(i) > 0 && due >= now;
    })
    .reduce((s, i) => s + getInvoiceBalance(i), 0);

  // Payments filtered by payment.date matching year+months, from entity+client filtered invoices
  const paidInPeriod = allInvoices.reduce((s, inv) => {
    const matchingPayments = inv.payments.filter((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() !== selectedYear) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(d.getMonth())) return false;
      return true;
    });
    return s + matchingPayments.reduce((ps, p) => ps + p.amountUsd, 0);
  }, 0);

  // Dynamic subtitle
  let periodLabel: string;
  if (selectedMonths.length === 0 || selectedMonths.length === 12) {
    periodLabel = `за ${selectedYear}`;
  } else if (selectedMonths.length === 1) {
    periodLabel = `за ${MONTHS_RU_FULL[selectedMonths[0]]} ${selectedYear}`;
  } else {
    periodLabel = "за выбранный период";
  }

  const cards = [
    { label: "Общая задолженность", value: totalAr, icon: DollarSign, color: "text-primary" },
    { label: "Просрочено", value: overdueTotal, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ожидается к поступлению", value: expectedTotal, icon: Clock, color: "text-warning" },
    { label: "Поступления (итого)", value: paidInPeriod, icon: CheckCircle, color: "text-success", sub: periodLabel },
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
          {"sub" in card && card.sub && (
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
