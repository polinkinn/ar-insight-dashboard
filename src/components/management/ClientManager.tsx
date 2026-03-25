import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, LegalEntity } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";

interface ClientManagerProps {
  clients: Client[];
  onAdd: (client: { nameDejure: string; nameDefacto: string }) => void;
  onDelete: (id: string) => void;
}

export function ClientManager({ clients, onAdd, onDelete }: ClientManagerProps) {
  const [open, setOpen] = useState(false);
  const [dejure, setDejure] = useState("");
  const [defacto, setDefacto] = useState("");

  const handleAdd = () => {
    if (!dejure.trim() || !defacto.trim()) return;
    onAdd({ nameDejure: dejure.trim(), nameDefacto: defacto.trim() });
    setDejure("");
    setDefacto("");
    setOpen(false);
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
            <th className="text-right pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
              <td className="py-2 text-foreground">{c.nameDefacto}</td>
              <td className="py-2 text-muted-foreground text-xs">{c.nameDejure}</td>
              <td className="py-2 text-right">
                <button onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Нет клиентов</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
