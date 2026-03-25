import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, CartesianGrid } from "recharts";
import { Invoice } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface TrendChartsProps {
  invoices: Invoice[];      // filtered by issueDate (for Начисление)
  allInvoices: Invoice[];   // all invoices (for payment-date based data)
}

const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function getLast12Months() {
  const result: { month: string; key: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: `${MONTHS_RU[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return result;
}

export function TrendCharts({ invoices, allInvoices }: TrendChartsProps) {
  const months = getLast12Months();

  const trendData = months.map(({ month, key }) => {
    // Начисление: invoices issued in this month (from filtered set)
    const issued = invoices
      .filter((i) => i.issueDate.startsWith(key))
      .reduce((s, i) => s + i.amountUsd, 0);

    // Оплаты (Fact): payments with payment.date in this month (from ALL invoices)
    const collected = allInvoices.reduce((s, inv) => {
      const monthPayments = inv.payments.filter((p) => p.date.startsWith(key));
      return s + monthPayments.reduce((ps, p) => ps + p.amountUsd, 0);
    }, 0);

    // План: invoices with dueDate in this month (from filtered set) - expected receipts
    const planned = invoices
      .filter((i) => i.dueDate.startsWith(key))
      .reduce((s, i) => s + i.amountUsd, 0);

    return { month, issued, collected, planned };
  });

  const tooltipStyle = {
    contentStyle: { background: "#ffffff", border: "1px solid hsl(220,13%,91%)", borderRadius: 6, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    labelStyle: { color: "hsl(224,15%,13%)" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Тенденция поступлений (План vs Факт)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,96%)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(value: number) => [formatUsd(value)]} />
            <Line type="monotone" dataKey="planned" stroke="hsl(217,91%,60%)" strokeWidth={1.5} dot={false} name="План" />
            <Line type="monotone" dataKey="collected" stroke="hsl(160,84%,39%)" strokeWidth={1.5} dot={false} name="Факт" />
            <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220,9%,46%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Начисление и Оплаты
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,96%)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(value: number) => [formatUsd(value)]} />
            <Bar dataKey="issued" fill="hsl(217,91%,60%)" radius={[2, 2, 0, 0]} barSize={14} name="Начисление" />
            <Bar dataKey="collected" fill="hsl(160,84%,39%)" radius={[2, 2, 0, 0]} barSize={14} name="Оплаты" />
            <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220,9%,46%)" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
