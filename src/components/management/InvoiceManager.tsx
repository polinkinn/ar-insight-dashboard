import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Client, Invoice, LegalEntity, getInvoiceBalance, getInvoiceBalanceNative, getDaysOverdue, isOverdue, parseNetDays, PaymentResolution } from "@/lib/store";
import { formatUsd, formatUsdFull, formatDate, formatAmount } from "@/lib/format";
import { Plus, Trash2, CreditCard, Pencil, CalendarIcon, Copy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InvoiceManagerProps {
  invoices: Invoice[];
  clients: Client[];
  onAddInvoice: (inv: any) => void;
  onUpdateInvoice: (id: string, inv: any) => void;
  onDeleteInvoice: (id: string) => void;
  onAddPayment: (invoiceId: string, payment: { amount: number; date: string }, resolution?: PaymentResolution) => void;
}

export function InvoiceManager({ invoices, clients, onAddInvoice, onUpdateInvoice, onDeleteInvoice, onAddPayment }: InvoiceManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [resolutionOpen, setResolutionOpen] = useState<{ invoiceId: string; remainder: number; payAmount: number; payDate: string } | null>(null);

  // Invoice form state
  const [invNumber, setInvNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [entity, setEntity] = useState<LegalEntity>("DMZ");
  const [terms, setTerms] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState<Date | undefined>(new Date());

  const isUzs = entity === "DM" || entity === "NWL";
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Auto-fill payment terms when client changes
  useEffect(() => {
    if (clientId && !editingId) {
      const client = clientMap.get(clientId);
      if (client?.paymentTerms) {
        setTerms(client.paymentTerms);
      }
    }
  }, [clientId]);

  // Auto-calculate due date when issue date or terms change
  useEffect(() => {
    if (issueDate && terms) {
      const days = parseNetDays(terms);
      if (days !== null) {
        const due = new Date(issueDate);
        due.setDate(due.getDate() + days);
        setDueDate(due);
      }
    }
  }, [issueDate, terms]);

  const resetForm = () => {
    setInvNumber(""); setClientId(""); setEntity("DMZ"); setTerms(""); setDescription("");
    setAmount(""); setRate(""); setIssueDate(new Date()); setDueDate(undefined);
    setEditingId(null);
  };

  const openEditForm = (inv: Invoice) => {
    setEditingId(inv.id);
    setInvNumber(inv.invoiceNumber);
    setClientId(inv.clientId);
    setEntity(inv.entity);
    setTerms(inv.paymentTerms);
    setDescription(inv.description || "");
    setAmount(String(inv.amount));
    setRate(inv.exchangeRate ? String(inv.exchangeRate) : "");
    setIssueDate(new Date(inv.issueDate));
    setDueDate(new Date(inv.dueDate));
    setOpen(true);
  };

  const handleSaveInvoice = () => {
    if (!invNumber || !clientId || !amount || !issueDate || !dueDate) return;
    if (isUzs && !rate) return;

    const invData = {
      invoiceNumber: invNumber.trim(),
      clientId,
      entity,
      paymentTerms: terms.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      exchangeRate: isUzs ? parseFloat(rate) : null,
      issueDate: format(issueDate, "yyyy-MM-dd"),
      dueDate: format(dueDate, "yyyy-MM-dd"),
    };

    if (editingId) {
      onUpdateInvoice(editingId, invData);
    } else {
      onAddInvoice(invData);
    }

    resetForm();
    setOpen(false);
  };

  const handlePayment = (invoiceId: string) => {
    if (!payAmount || !payDate) return;
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const payAmountNum = parseFloat(payAmount);
    const balanceNative = getInvoiceBalanceNative(inv);

    if (payAmountNum < balanceNative - 0.01) {
      setResolutionOpen({
        invoiceId,
        remainder: balanceNative - payAmountNum,
        payAmount: payAmountNum,
        payDate: format(payDate, "yyyy-MM-dd"),
      });
      setPayOpen(null);
    } else {
      onAddPayment(invoiceId, { amount: payAmountNum, date: format(payDate, "yyyy-MM-dd") });
      setPayAmount("");
      setPayDate(new Date());
      setPayOpen(null);
    }
  };

  const handleResolution = (resolution: PaymentResolution) => {
    if (!resolutionOpen) return;
    const { invoiceId, payAmount, payDate, remainder } = resolutionOpen;

    if (resolution === "bank_commission") {
      // Pay the full remaining amount (mark as commission)
      const inv = invoices.find((i) => i.id === invoiceId);
      if (inv) {
        const balanceNative = getInvoiceBalanceNative(inv);
        onAddPayment(invoiceId, { amount: balanceNative, date: payDate }, "bank_commission");
      }
    } else {
      onAddPayment(invoiceId, { amount: payAmount, date: payDate }, resolution);
    }

    setResolutionOpen(null);
    setPayAmount("");
    setPayDate(new Date());
  };

  const remainderFormatted = resolutionOpen
    ? (() => {
        const inv = invoices.find((i) => i.id === resolutionOpen.invoiceId);
        if (!inv) return "$0,00";
        const remUsd = inv.currency === "USD" ? resolutionOpen.remainder : resolutionOpen.remainder / (inv.exchangeRate || 1);
        return formatUsd(remUsd);
      })()
    : "$0,00";

  return (
    <div className="bg-card border border-border p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Инвойсы</h3>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Создать счет
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Редактировать инвойс" : "Новый инвойс"}</DialogTitle>
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
                    <SelectItem value="NOVEX">NOVEX (USD)</SelectItem>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1 bg-background border-border", !issueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "dd.MM.yyyy") : "Выберите"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={issueDate} onSelect={setIssueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дата оплаты (срок)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1 bg-background border-border", !dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd.MM.yyyy") : "Выберите"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Расшифровка / Описание</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Транспортные услуги за март 2026" className="bg-background border-border mt-1 min-h-[60px]" />
              </div>
            </div>
            {isUzs && amount && rate && (
              <div className="text-xs text-muted-foreground mt-2">
                Эквивалент: <span className="font-mono text-foreground">{formatUsdFull(parseFloat(amount) / parseFloat(rate))}</span>
              </div>
            )}
            <Button onClick={handleSaveInvoice} className="w-full mt-2">
              {editingId ? "Сохранить изменения" : "Создать инвойс"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resolution modal */}
      <Dialog open={!!resolutionOpen} onOpenChange={(o) => { if (!o) setResolutionOpen(null); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Остаток {remainderFormatted} — куда отнести?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-xs h-auto py-3" onClick={() => handleResolution("bank_commission")}>
              <div className="text-left">
                <div className="font-medium">Списать как банковская комиссия</div>
                <div className="text-muted-foreground mt-0.5">Разница списывается, инвойс закрыт</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs h-auto py-3" onClick={() => handleResolution("partial_remaining")}>
              <div className="text-left">
                <div className="font-medium">Оставить как незакрытый остаток</div>
                <div className="text-muted-foreground mt-0.5">Не отображается как просрочка до даты оплаты</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs h-auto py-3" onClick={() => handleResolution("awaiting_topup")}>
              <div className="text-left">
                <div className="font-medium">Ожидать доплаты</div>
                <div className="text-muted-foreground mt-0.5">Частично оплачен, ожидается доплата</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left pb-2">Инвойс</th>
              <th className="text-left pb-2">Клиент</th>
              <th className="text-left pb-2">Юр. лицо</th>
              <th className="text-left pb-2">Расшифровка</th>
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
              const paid = balance <= 0.01;

              return (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                  <td className="py-2 font-mono text-foreground text-xs">{inv.invoiceNumber}</td>
                  <td className="py-2 text-foreground">{clientMap.get(inv.clientId)?.nameDefacto || "—"}</td>
                  <td className="py-2 text-muted-foreground text-xs">{inv.entity}</td>
                  <td className="py-2 text-muted-foreground text-xs max-w-[150px] truncate">{inv.description || "—"}</td>
                  <td className="py-2 text-right font-mono text-foreground">{formatUsd(inv.amountUsd)}</td>
                  <td className={`py-2 text-right font-mono ${overdue ? "text-destructive" : "text-foreground"}`}>{formatUsd(balance)}</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">{formatDate(inv.dueDate)}</td>
                  <td className="py-2 text-center">
                    {inv.paymentResolution === "bank_commission" ? (
                      <span className="text-xs px-2 py-0.5 bg-muted/30 text-muted-foreground rounded">Комиссия</span>
                    ) : paid ? (
                      <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded">Оплачен</span>
                    ) : overdue ? (
                      <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">{days}д просрочки</span>
                    ) : inv.paymentResolution === "awaiting_topup" ? (
                      <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded">Ожидает доплаты</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">Активен</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditForm(inv)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!paid && (
                        <Dialog open={payOpen === inv.id} onOpenChange={(o) => { setPayOpen(o ? inv.id : null); if (o) { setPayAmount(""); setPayDate(new Date()); } }}>
                          <DialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-sm">Внести оплату: {inv.invoiceNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <div>
                                Остаток: <span className="font-mono text-foreground">
                                  {inv.currency === "USD" ? formatUsd(balance) : `${formatAmount(getInvoiceBalanceNative(inv))} UZS`}
                                </span>
                                {inv.currency === "UZS" && <span className="ml-1">(≈ {formatUsd(balance)})</span>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs gap-1 text-primary"
                                onClick={() => setPayAmount(String(inv.currency === "USD" ? balance : getInvoiceBalanceNative(inv)))}
                              >
                                <Copy className="w-3 h-3" /> Полная сумма
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Сумма ({inv.currency})</Label>
                                <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="bg-background border-border mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Дата оплаты</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1 bg-background border-border", !payDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {payDate ? format(payDate, "dd.MM.yyyy") : "Выберите"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={payDate} onSelect={setPayDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                                  </PopoverContent>
                                </Popover>
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
              <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Нет инвойсов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
