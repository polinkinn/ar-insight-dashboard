import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Invoice, Client, getInvoiceBalance, getDaysOverdue, isOverdue } from "@/lib/store";
import { formatUsd } from "@/lib/format";

interface AgingChartProps {
  invoices: Invoice[];
  clients?: Client[];
}

const BUCKETS = ["0-30", "31-60", "61-90", "90+"];
const COLORS = ["hsl(38,92%,50%)", "hsl(25,95%,53%)", "hsl(0,84%,60%)", "hsl(0,62%,40%)"];

export function AgingChart({ invoices, clients = [] }: AgingChartProps) {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const overdueInvoices = invoices.filter((i) => isOverdue(i));
  const total = overdueInvoices.reduce((s, i) => s + getInvoiceBalance(i), 0);

  const getBucketInvoices = (bucket: string) => {
    return overdueInvoices.filter((inv) => {
      const days = getDaysOverdue(inv);
      if (bucket === "0-30") return days >= 1 && days <= 30;
      if (bucket === "31-60") return days >= 31 && days <= 60;
      if (bucket === "61-90") return days >= 61 && days <= 90;
      return days > 90;
    });
  };

  const bucketData = BUCKETS.map((bucket) => {
    const filtered = getBucketInvoices(bucket);
    const amount = filtered.reduce((s, i) => s + getInvoiceBalance(i), 0);
    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : "0";
    return { bucket, amount, pct: `${pct}%` };
  });

  const selectedInvoices = selectedBucket ? getBucketInvoices(selectedBucket) : [];
  const selectedTotal = selectedInvoices.reduce((s, i) => s + getInvoiceBalance(i), 0);

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      setSelectedBucket(data.activePayload[0].payload.bucket);
    }
  };

  return (
    <>
      <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Старение дебиторской задолженности
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bucketData} margin={{ left: 10, right: 10, bottom: 5 }} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,96%)" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: "hsl(220,9%,46%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid hsl(220,13%,91%)", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              labelStyle={{ color: "hsl(224,15%,13%)" }}
              formatter={(value: number) => [formatUsd(value), "Сумма"]}
              cursor={{ fill: "hsl(220,14%,96%)" }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={48} style={{ cursor: "pointer" }}>
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
        <p className="text-xs text-muted-foreground mt-2 opacity-60">Нажмите на столбец для детализации</p>
      </div>

      <Dialog open={!!selectedBucket} onOpenChange={(o) => { if (!o) setSelectedBucket(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Детализация: {selectedBucket} дней просрочки — {formatUsd(selectedTotal)}
            </DialogTitle>
          </DialogHeader>
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left pb-2">Инвойс</th>
                <th className="text-left pb-2">Клиент</th>
                <th className="text-left pb-2">Юр. лицо</th>
                <th className="text-right pb-2">Сумма</th>
                <th className="text-right pb-2">Дни</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-foreground text-xs">{inv.invoiceNumber}</td>
                  <td className="py-2 text-foreground">{clientMap.get(inv.clientId)?.nameDefacto || "—"}</td>
                  <td className="py-2 text-muted-foreground text-xs">{inv.entity}</td>
                  <td className="py-2 text-right font-mono text-destructive">{formatUsd(getInvoiceBalance(inv))}</td>
                  <td className="py-2 text-right font-mono text-destructive">{getDaysOverdue(inv)}</td>
                </tr>
              ))}
              {selectedInvoices.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Нет инвойсов</td></tr>
              )}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </>
  );
}
