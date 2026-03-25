import { useFilters } from "@/lib/filters";
import { Client, LegalEntity } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  clients: Client[];
}

export function FilterBar({ clients }: FilterBarProps) {
  const { filters, setEntity, setPeriod, setClientIds } = useFilters();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Период</span>
        <Select value={filters.period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Юр. лицо</span>
        <Select value={filters.entity} onValueChange={(v) => setEntity(v as LegalEntity | "all")}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="DMZ">DMZ</SelectItem>
            <SelectItem value="DM">DM</SelectItem>
            <SelectItem value="NWL">NWL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Клиент</span>
        <Select
          value={filters.clientIds.length === 0 ? "all" : filters.clientIds[0]}
          onValueChange={(v) => setClientIds(v === "all" ? [] : [v])}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-border">
            <SelectValue placeholder="Все клиенты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все клиенты</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nameDefacto}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
