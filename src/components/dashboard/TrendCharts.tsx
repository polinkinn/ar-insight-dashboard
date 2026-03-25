import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Invoice, getInvoicePaidUsd } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface TrendChartsProps {
  invoices: Invoice[];
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

export function TrendCharts({ invoices }: TrendChartsProps) {
  const months = getLast12Months();

  const trendData = months.map(({ month, key }) => {
    const issued = invoices
      .filter((i) => i.issueDate.startsWith(key))
      .reduce((s, i) => s + i.amountUsd, 0);

    const collected = invoices.reduce((s, inv) => {
      const monthPayments = inv.payments.filter((p) => p.date.startsWith(key));
      return s + monthPayments.reduce((ps, p) => ps + p.amountUsd, 0);
    }, 0);

    return { month, plan: issued, fact: collected };
  });

  const tooltipStyle = {
    contentStyle: { background: "hsl(240,4%,7%)", border: "1px solid hsl(240,4%,16%)", borderRadius: 4, fontSize: 12 },
    labelStyle: { color: "hsl(0,0%,98%)" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border p-5 rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Тенденция поступлений (План vs Факт)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,65%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(0,0%,65%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(value: number) => [formatUsd(value)]} />
            <Line type="monotone" dataKey="plan" stroke="hsl(217,91%,60%)" strokeWidth={1.5} dot={false} name="План" />
            <Line type="monotone" dataKey="fact" stroke="hsl(142,71%,45%)" strokeWidth={1.5} dot={false} name="Факт" />
            <Legend wrapperStyle={{ fontSize: 11, color: "hsl(0,0%,65%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border p-5 rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Сравнение: выставлено vs собрано
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData}>
            <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,65%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(0,0%,65%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(value: number) => [formatUsd(value)]} />
            <Bar dataKey="plan" fill="hsl(217,91%,60%)" radius={[2, 2, 0, 0]} barSize={14} name="Выставлено" />
            <Bar dataKey="fact" fill="hsl(142,71%,45%)" radius={[2, 2, 0, 0]} barSize={14} name="Собрано" />
            <Legend wrapperStyle={{ fontSize: 11, color: "hsl(0,0%,65%)" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
