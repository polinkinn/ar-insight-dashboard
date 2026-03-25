import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Invoice, getInvoiceBalance, getDaysOverdue, isOverdue } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface AgingChartProps {
  invoices: Invoice[];
}

const BUCKETS = ["0-30", "31-60", "61-90", "90+"];
const COLORS = ["hsl(38,92%,50%)", "hsl(25,95%,53%)", "hsl(0,84%,60%)", "hsl(0,62%,40%)"];

export function AgingChart({ invoices }: AgingChartProps) {
  const overdueInvoices = invoices.filter((i) => isOverdue(i));
  const total = overdueInvoices.reduce((s, i) => s + getInvoiceBalance(i), 0);

  const bucketData = BUCKETS.map((bucket) => {
    const filtered = overdueInvoices.filter((inv) => {
      const days = getDaysOverdue(inv);
      if (bucket === "0-30") return days >= 1 && days <= 30;
      if (bucket === "31-60") return days >= 31 && days <= 60;
      if (bucket === "61-90") return days >= 61 && days <= 90;
      return days > 90;
    });
    const amount = filtered.reduce((s, i) => s + getInvoiceBalance(i), 0);
    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : "0";
    return { bucket, amount, pct: `${pct}%` };
  });

  return (
    <div className="bg-card border border-border p-5 rounded-lg">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Старение дебиторской задолженности
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bucketData} layout="vertical" margin={{ left: 10, right: 40 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="bucket" tick={{ fill: "hsl(0,0%,65%)", fontSize: 12 }} width={50} />
          <Tooltip
            contentStyle={{ background: "hsl(240,4%,7%)", border: "1px solid hsl(240,4%,16%)", borderRadius: 4 }}
            labelStyle={{ color: "hsl(0,0%,98%)" }}
            formatter={(value: number) => [formatUsd(value), "Сумма"]}
          />
          <Bar dataKey="amount" radius={[0, 2, 2, 0]} barSize={24}>
            {bucketData.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3">
        {bucketData.map((b, i) => (
          <div key={b.bucket} className="text-xs text-muted-foreground">
            <span style={{ color: COLORS[i] }}>●</span> {b.bucket} дней: <span className="font-mono text-foreground">{formatUsd(b.amount)}</span> ({b.pct})
          </div>
        ))}
      </div>
    </div>
  );
}
