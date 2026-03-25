export function formatAmount(value: number): string {
  const parts = value.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${intPart},${parts[1]}`;
}

export function formatUsd(value: number): string {
  return `$${formatAmount(value)}`;
}

export function formatUsdFull(value: number): string {
  return `$${formatAmount(value)}`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}
