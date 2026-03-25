import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, Invoice, LegalEntity, getInvoiceBalance, getDaysOverdue, isOverdue } from "@/lib/store";
import { formatUsd, formatUsdFull, formatDate } from "@/lib/format";
import { Plus, Trash2, CreditCard } from "lucide-react";

interface InvoiceManagerProps {
  invoices: Invoice[];
  clients: Client[];
  onAddInvoice: (inv: any) => void;
  onDeleteInvoice: (id: string) => void;
  onAddPayment: (invoiceId: string, payment: { amount: number; date: string }) => void;
}

export function InvoiceManager({ invoices, clients, onAddInvoice, onDeleteInvoice, onAddPayment }: InvoiceManagerProps) {
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);

  // New invoice form state
  const [invNumber, setInvNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [entity, setEntity] = useState<LegalEntity>("DMZ");
  const [terms, setTerms] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");

  const isUzs = entity === "DM" || entity === "NWL";

  const handleAddInvoice = () => {
    if (!invNumber || !clientId || !amount || !issueDate || !dueDate) return;
    if (isUzs && !rate) return;

    onAddInvoice({
      invoiceNumber: invNumber.trim(),
      clientId,
      entity,
      paymentTerms: terms.trim(),
      amount: parseFloat(amount),
      exchangeRate: isUzs ? parseFloat(rate) : null,
      issueDate,
      dueDate,
    });

    setInvNumber(""); setClientId(""); setTerms(""); setAmount(""); setRate(""); setIssueDate(""); setDueDate("");
    setOpen(false);
  };

  const handlePayment = (invoiceId: string) => {
    if (!payAmount || !payDate) return;
    onAddPayment(invoiceId, { amount: parseFloat(payAmount), date: payDate });
    setPayAmount(""); setPayDate("");
    setPayOpen(null);
  };

  const clientMap = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="bg-card border border-border p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Инвойсы</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Создать счет
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Новый инвойс</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">ID Инвойса</Label>
                <Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="DM#10452" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Клиент</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-background border-border mt-1"><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameDefacto}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Юр. лицо</Label>
                <Select value={entity} onValueChange={(v) => setEntity(v as LegalEntity)}>
                  <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DMZ">DMZ (USD)</SelectItem>
                    <SelectItem value="DM">DM (UZS)</SelectItem>
                    <SelectItem value="NWL">NWL (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Условия оплаты</Label>
                <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Net 30" className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Сумма ({isUzs ? "UZS" : "USD"})</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-background border-border mt-1" />
              </div>
              {isUzs && (
                <div>
                  <Label className="text-xs text-muted-foreground">Курс UZS/USD</Label>
                  <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="12800" className="bg-background border-border mt-1" />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Дата выставления</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дата оплаты (срок)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background border-border mt-1" />
              </div>
            </div>
            {isUzs && amount && rate && (
              <div className="text-xs text-muted-foreground mt-2">
                Эквивалент: <span className="font-mono text-foreground">{formatUsdFull(parseFloat(amount) / parseFloat(rate))}</span>
              </div>
            )}
            <Button onClick={handleAddInvoice} className="w-full mt-2">Создать инвойс</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left pb-2">Инвойс</th>
              <th className="text-left pb-2">Клиент</th>
              <th className="text-left pb-2">Юр. лицо</th>
              <th className="text-right pb-2">Сумма (USD)</th>
              <th className="text-right pb-2">Баланс</th>
              <th className="text-right pb-2">Срок</th>
              <th className="text-center pb-2">Статус</th>
              <th className="text-right pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const balance = getInvoiceBalance(inv);
              const overdue = isOverdue(inv);
              const days = getDaysOverdue(inv);
              const paid = balance <= 0;

              return (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                  <td className="py-2 font-mono text-foreground text-xs">{inv.invoiceNumber}</td>
                  <td className="py-2 text-foreground">{clientMap.get(inv.clientId)?.nameDefacto || "—"}</td>
                  <td className="py-2 text-muted-foreground text-xs">{inv.entity}</td>
                  <td className="py-2 text-right font-mono text-foreground">{formatUsd(inv.amountUsd)}</td>
                  <td className={`py-2 text-right font-mono ${overdue ? "text-destructive" : "text-foreground"}`}>{formatUsd(balance)}</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">{formatDate(inv.dueDate)}</td>
                  <td className="py-2 text-center">
                    {paid ? (
                      <span className="text-xs px-2 py-0.5 bg-success/10 text-success">Оплачен</span>
                    ) : overdue ? (
                      <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive">{days}д просрочки</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary">Активен</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!paid && (
                        <Dialog open={payOpen === inv.id} onOpenChange={(o) => setPayOpen(o ? inv.id : null)}>
                          <DialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-sm">Внести оплату: {inv.invoiceNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="text-xs text-muted-foreground mb-2">
                              Остаток: <span className="font-mono text-foreground">{formatUsdFull(balance)}</span>
                              {inv.currency === "UZS" && <span> (курс: {inv.exchangeRate})</span>}
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Сумма ({inv.currency})</Label>
                                <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="bg-background border-border mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Дата оплаты</Label>
                                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="bg-background border-border mt-1" />
                              </div>
                              <Button onClick={() => handlePayment(inv.id)} className="w-full">Внести оплату</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <button onClick={() => onDeleteInvoice(inv.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Нет инвойсов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
