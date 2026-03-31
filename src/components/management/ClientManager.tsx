import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from "@/lib/store";
import { Plus, Trash2, Pencil } from "lucide-react";

interface ClientManagerProps {
  clients: Client[];
  onAdd: (client: { nameDejure: string; nameDefacto: string; paymentTerms: string }) => void;
  onEdit: (id: string, updates: Partial<Client>) => void;
  onDelete: (id: string) => void;
}

export function ClientManager({ clients, onAdd, onEdit, onDelete }: ClientManagerProps) {
  const [open, setOpen] = useState(false);
  const [dejure, setDejure] = useState("");
  const [defacto, setDefacto] = useState("");
  const [terms, setTerms] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDejure, setEditDejure] = useState("");
  const [editDefacto, setEditDefacto] = useState("");
  const [editTerms, setEditTerms] = useState("");

  const handleAdd = () => {
    if (!dejure.trim() || !defacto.trim()) return;
    onAdd({ nameDejure: dejure.trim(), nameDefacto: defacto.trim(), paymentTerms: terms.trim() });
    setDejure("");
    setDefacto("");
    setTerms("");
    setOpen(false);
  };

  const openEdit = (c: Client) => {
    setEditId(c.id);
    setEditDejure(c.nameDejure);
    setEditDefacto(c.nameDefacto);
    setEditTerms(c.paymentTerms || "");
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editId || !editDejure.trim() || !editDefacto.trim()) return;
    onEdit(editId, { nameDejure: editDejure.trim(), nameDefacto: editDefacto.trim(), paymentTerms: editTerms.trim() });
    setEditOpen(false);
  };

  return (
    <div className="bg-card border border-border p-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Клиенты</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="w-3 h-3" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Новый клиент</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Юр. наименование (De Jure)</Label>
                <Input value={dejure} onChange={(e) => setDejure(e.target.value)} className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Факт. наименование (De Facto)</Label>
                <Input value={defacto} onChange={(e) => setDefacto(e.target.value)} className="bg-background border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Условия оплаты</Label>
                <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Net 30" className="bg-background border-border mt-1" />
              </div>
              <Button onClick={handleAdd} className="w-full">Создать клиента</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="text-left pb-2">Наименование</th>
            <th className="text-left pb-2">Юр. имя</th>
            <th className="text-left pb-2">Условия оплаты</th>
            <th className="text-right pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
              <td className="py-2 text-foreground">{c.nameDefacto}</td>
              <td className="py-2 text-muted-foreground text-xs">{c.nameDejure}</td>
              <td className="py-2 text-muted-foreground text-xs">{c.paymentTerms || "—"}</td>
              <td className="py-2 text-right flex items-center justify-end gap-2">
                <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                      <AlertDialogDescription>Клиент «{c.nameDefacto}» будет удалён. Это действие нельзя отменить.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Нет клиентов</td></tr>
          )}
        </tbody>
      </table>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Юр. наименование (De Jure)</Label>
              <Input value={editDejure} onChange={(e) => setEditDejure(e.target.value)} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Факт. наименование (De Facto)</Label>
              <Input value={editDefacto} onChange={(e) => setEditDefacto(e.target.value)} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Условия оплаты</Label>
              <Input value={editTerms} onChange={(e) => setEditTerms(e.target.value)} placeholder="Net 30" className="bg-background border-border mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEdit} className="flex-1">Сохранить</Button>
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Отмена</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}