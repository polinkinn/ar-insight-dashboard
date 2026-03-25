import { useFilters } from "@/lib/filters";
import { Client, LegalEntity, Invoice } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

interface FilterBarProps {
  clients: Client[];
  invoices: Invoice[];
}

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function FilterBar({ clients, invoices }: FilterBarProps) {
  const { filters, setEntity, setMonths, setClientIds, setYear } = useFilters();

  // Derive unique years from invoices
  const years = Array.from(new Set(invoices.map((inv) => new Date(inv.issueDate).getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(filters.year)) {
    years.push(filters.year);
    years.sort((a, b) => b - a);
  }

  const toggleMonth = (m: number) => {
    setMonths(
      filters.months.includes(m)
        ? filters.months.filter((x) => x !== m)
        : [...filters.months, m]
    );
  };

  const monthLabel = filters.months.length === 0
    ? "Все месяцы"
    : filters.months.length <= 2
      ? filters.months.map((m) => MONTHS_RU[m].slice(0, 3)).join(", ")
      : `${filters.months.length} мес.`;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Год</span>
        <Select value={String(filters.year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[90px] h-8 text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Месяцы</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border gap-1">
              {monthLabel} <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex justify-between mb-2">
              <button className="text-xs text-primary hover:underline" onClick={() => setMonths([0,1,2,3,4,5,6,7,8,9,10,11])}>Все</button>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setMonths([])}>Сбросить</button>
            </div>
            {MONTHS_RU.map((name, i) => (
              <label key={i} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-surface-alt rounded">
                <Checkbox
                  checked={filters.months.includes(i)}
                  onCheckedChange={() => toggleMonth(i)}
                  className="h-3.5 w-3.5"
                />
                {name}
              </label>
            ))}
          </PopoverContent>
        </Popover>
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
