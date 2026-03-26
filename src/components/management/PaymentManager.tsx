import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Client, Invoice, PaymentResolution, getInvoiceBalance } from "@/lib/store";
import { formatUsd, formatDate } from "@/lib/format";
import { Pencil, Trash2, CalendarIcon, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type PaymentStatus = "all" | "paid" | "partial" | "commission";

interface PaymentManagerProps {
  invoices: Invoice[];
  clients: Client[];
  selectedYears: number[];
  selectedMonths: number[];
  onUpdatePayment: (invoiceId: string, paymentId: string, updates: { amount?: number; date?: string; bankCommission?: number }, resolution?: PaymentResolution) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
}

interface FlatPayment {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  entity: string;
  paymentId: string;
  paymentDate: string;
  invoiceAmountUsd: number;
  paymentAmountUsd: number;
  paymentAmount: number;
  bankCommission: number;
  remainder: number;
  status: "paid" | "partial" | "commission";
  resolution: PaymentResolution;
}

export function PaymentManager({ invoices, clients, selectedYears, selectedMonths, onUpdatePayment, onDeletePayment }: PaymentManagerProps) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("all");
  const [editPayment, setEditPayment] = useState<FlatPayment | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editAmount, setEditAmount] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editComment, setEditComment] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FlatPayment | null>(null);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.nameDefacto));
    return m;
  }, [clients]);

  const allPayments = useMemo(() => {
    const result: FlatPayment[] = [];
    for (const inv of invoices) {
      for (const p of inv.payments) {
        const pDate = new Date(p.date);
        if (selectedYears.length > 0 && !selectedYears.includes(pDate.getFullYear())) continue;
        if (selectedMonths.length > 0 && !selectedMonths.includes(pDate.getMonth())) continue;

        const totalPaid = inv.payments.reduce((s, pp) => s + pp.amountUsd, 0);
        const isFullyPaid = Math.abs(inv.amountUsd - totalPaid) < 0.01;
        const commission = inv.paymentResolution === "bank_commission" ? inv.amountUsd - totalPaid : 0;
        const remainder = inv.amountUsd - totalPaid - (commission > 0 ? commission : 0);

        let status: "paid" | "partial" | "commission" = "partial";
        if (inv.paymentResolution === "bank_commission") status = "commission";
        else if (isFullyPaid) status = "paid";

        result.push({
          invoiceId: inv.id, invoiceNumber: inv.invoiceNumber,
          clientName: clientMap[inv.clientId] || "—", entity: inv.entity,
          paymentId: p.id, paymentDate: p.date,
          invoiceAmountUsd: inv.amountUsd, paymentAmountUsd: p.amountUsd,
          paymentAmount: p.amount, bankCommission: commission > 0 ? commission : 0,
          remainder: Math.max(0, remainder), status, resolution: inv.paymentResolution,
        });
      }
    }
    result.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return result;
  }, [invoices, selectedYears, selectedMonths, clientMap]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return allPayments;
    return allPayments.filter((p) => p.status === statusFilter);
  }, [allPayments, statusFilter]);

  const totalReceived = allPayments.reduce((s, p) => s + p.paymentAmountUsd, 0);
  const totalCommissions = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const p of allPayments) {
      if (p.resolution === "bank_commission" && !seen.has(p.invoiceId)) {
        seen.add(p.invoiceId);
        sum += p.bankCommission;
      }
    }
    return sum;
  }, [allPayments]);
  const totalAwaitingTopup = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const inv of invoices) {
      if (inv.paymentResolution === "awaiting_topup" && !seen.has(inv.id)) {
        const hasPaymentInPeriod = inv.payments.some((p) => {
          const d = new Date(p.date);
          if (selectedYears.length > 0 && !selectedYears.includes(d.getFullYear())) return false;
          if (selectedMonths.length > 0 && !selectedMonths.includes(d.getMonth())) return false;
          return true;
        });
        if (hasPaymentInPeriod) {
          seen.add(inv.id);
          sum += getInvoiceBalance(inv);
        }
      }
    }
    return sum;
  }, [invoices, selectedYears, selectedMonths]);

  function openEdit(p: FlatPayment) {
    setEditPayment(p);
    setEditDate(new Date(p.paymentDate));
    setEditAmount(String(p.paymentAmount));
    setEditCommission(String(p.bankCommission));
    setEditComment("");
  }

  function handleSaveEdit() {
    if (!editPayment || !editDate) return;
    onUpdatePayment(editPayment.invoiceId, editPayment.paymentId, {
      amount: parseFloat(editAmount) || 0,
      date: format(editDate, "yyyy-MM-dd"),
      bankCommission: parseFloat(editCommission) || 0,
    });
    setEditPayment(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    onDeletePayment(deleteTarget.invoiceId, deleteTarget.paymentId);
    setDeleteTarget(null);
  }

  const statusBadge = (s: "paid" | "partial" | "commission") => {
    switch (s) {
      case "paid": return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Оплачен</Badge>;
      case "partial": return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20">Частично</Badge>;
      case "commission": return <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20">Комиссия списана</Badge>;
    }
  };

  const kpis = [
    { label: "ИТОГО ПОЛУЧЕНО", value: totalReceived, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "БАНКОВСКИЕ КОМИССИИ", value: totalCommissions, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "ОЖИДАЕТ ДОПЛАТЫ", value: totalAwaitingTopup, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", k.bg)}>
                  <k.icon className={cn("w-4 h-4", k.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">{k.label}</p>
                  <p className={cn("text-lg font-bold tabular-nums", k.color)}>{formatUsd(k.value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Статус:</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus)}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="paid">Оплачен</SelectItem>
            <SelectItem value="partial">Частично</SelectItem>
            <SelectItem value="commission">Комиссия списана</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase">Инвойс #</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase">Клиент</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase">Юр. лицо</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase">Дата оплаты</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase text-right">Сумма инвойса</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase text-right">Сумма оплаты</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase text-right">Банк. комиссия</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase text-right">Остаток</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase">Статус</TableHead>
              <TableHead className="text-[10px] font-semibold tracking-wider uppercase text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8 text-sm">Нет платежей за выбранный период</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.paymentId}>
                <TableCell className="text-xs font-medium">{p.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{p.clientName}</TableCell>
                <TableCell className="text-xs">{p.entity}</TableCell>
                <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{formatUsd(p.invoiceAmountUsd)}</TableCell>
                <TableCell className="text-xs text-right tabular-nums font-medium">{formatUsd(p.paymentAmountUsd)}</TableCell>
                <TableCell className={cn("text-xs text-right tabular-nums", p.bankCommission > 0 && "text-orange-600 font-medium")}>
                  {p.bankCommission > 0 ? formatUsd(p.bankCommission) : "—"}
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums">{p.remainder > 0.01 ? formatUsd(p.remainder) : "—"}</TableCell>
                <TableCell>{statusBadge(p.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editPayment} onOpenChange={(o) => !o && setEditPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-sm">Редактировать платёж</DialogTitle></DialogHeader>
          {editPayment && (
            <div className="space-y-4">
              <div><Label className="text-xs">Инвойс #</Label><Input value={editPayment.invoiceNumber} disabled className="mt-1 h-9 text-xs bg-muted" /></div>
              <div>
                <Label className="text-xs">Дата оплаты</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 h-9 justify-start text-xs", !editDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />{editDate ? format(editDate, "dd.MM.yyyy") : "Выбрать дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div><Label className="text-xs">Сумма оплаты</Label><Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="mt-1 h-9 text-xs" /></div>
              <div><Label className="text-xs">Банковская комиссия</Label><Input type="number" value={editCommission} onChange={(e) => setEditCommission(e.target.value)} className="mt-1 h-9 text-xs" /></div>
              <div><Label className="text-xs">Комментарий</Label><Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="mt-1 text-xs" placeholder="Необязательно" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditPayment(null)}>Отмена</Button>
                <Button size="sm" onClick={handleSaveEdit}>Сохранить</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Удалить этот платёж?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Статус инвойса будет пересчитан.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
