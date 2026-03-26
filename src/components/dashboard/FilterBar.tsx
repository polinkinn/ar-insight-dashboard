import { useFilters } from "@/lib/filters";
import { Client, LegalEntity, Invoice } from "@/lib/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Search } from "lucide-react";

interface FilterBarProps {
  clients: Client[];
  invoices: Invoice[];
}

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const ENTITIES: LegalEntity[] = ["DMZ", "DM", "NWL", "NOVEX"];

export function FilterBar({ clients, invoices }: FilterBarProps) {
  const { filters, setEntities, setMonths, setClientIds, setYears, setSearch } = useFilters();

  // Derive unique years from invoices
  const allYears = Array.from(new Set(invoices.map((inv) => new Date(inv.issueDate).getFullYear()))).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  if (!allYears.includes(currentYear)) {
    allYears.push(currentYear);
    allYears.sort((a, b) => b - a);
  }

  const toggleMonth = (m: number) => {
    setMonths(
      filters.months.includes(m)
        ? filters.months.filter((x) => x !== m)
        : [...filters.months, m]
    );
  };

  const toggleYear = (y: number) => {
    setYears(
      filters.years.includes(y)
        ? filters.years.filter((x) => x !== y)
        : [...filters.years, y]
    );
  };

  const toggleEntity = (e: LegalEntity) => {
    setEntities(
      filters.entities.includes(e)
        ? filters.entities.filter((x) => x !== e)
        : [...filters.entities, e]
    );
  };

  const monthLabel = filters.months.length === 0
    ? "Все месяцы"
    : filters.months.length <= 2
      ? filters.months.map((m) => MONTHS_RU[m].slice(0, 3)).join(", ")
      : `${filters.months.length} мес.`;

  const yearLabel = filters.years.length === 0
    ? "Все годы"
    : filters.years.length === 1
      ? String(filters.years[0])
      : `${filters.years.length} года`;

  const entityLabel = filters.entities.length === 0
    ? "Все"
    : filters.entities.length <= 2
      ? filters.entities.join(", ")
      : `${filters.entities.length} юр.`;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск инвойса..."
          className="h-8 w-[160px] text-xs pl-7 bg-card border-border"
        />
      </div>

      {/* Year multi-select */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Год</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border gap-1">
              {yearLabel} <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <div className="flex justify-between mb-2">
              <button className="text-xs text-primary hover:underline" onClick={() => setYears([...allYears])}>Все</button>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setYears([])}>Сбросить</button>
            </div>
            {allYears.map((y) => (
              <label key={y} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-secondary rounded">
                <Checkbox
                  checked={filters.years.includes(y)}
                  onCheckedChange={() => toggleYear(y)}
                  className="h-3.5 w-3.5"
                />
                {y}
              </label>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Months */}
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
              <label key={i} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-secondary rounded">
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

      {/* Entity multi-select */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Юр. лицо</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-card border-border gap-1">
              {entityLabel} <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <div className="flex justify-between mb-2">
              <button className="text-xs text-primary hover:underline" onClick={() => setEntities([...ENTITIES])}>Все</button>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setEntities([])}>Сбросить</button>
            </div>
            {ENTITIES.map((e) => (
              <label key={e} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-secondary rounded">
                <Checkbox
                  checked={filters.entities.includes(e)}
                  onCheckedChange={() => toggleEntity(e)}
                  className="h-3.5 w-3.5"
                />
                {e}
              </label>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Client */}
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
