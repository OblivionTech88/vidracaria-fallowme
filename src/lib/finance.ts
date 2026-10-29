// Pure finance helpers — no I/O, fully unit-testable.
export const TZ = "America/Sao_Paulo";

export type Entrada = {
  id: string;
  cliente: string;
  obra: string;
  valor: number;
  data_recebimento: string; // YYYY-MM-DD
  observacoes: string | null;
};

export type Period = "todos" | "hoje" | "semana" | "mes" | "ano" | "personalizado";
export type Range = { from: string; to: string };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const parse = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
};

/** 0 = segunda ... 6 = domingo */
export const weekdayIndex = (iso: string) => (parse(iso).getUTCDay() + 6) % 7;

export function periodRange(p: Period, today: string, custom?: Partial<Range>): Range | null {
  const [y, m] = today.split("-");
  switch (p) {
    case "hoje":
      return { from: today, to: today };
    case "semana": {
      const from = addDays(today, -weekdayIndex(today));
      return { from, to: addDays(from, 6) };
    }
    case "mes": {
      const last = new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate();
      return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, "0")}` };
    }
    case "ano":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "personalizado":
      return custom?.from || custom?.to
        ? { from: custom.from || "0000-01-01", to: custom.to || "9999-12-31" }
        : null;
    default:
      return null;
  }
}

export const inRange = (iso: string, r: Range | null) => !r || (iso >= r.from && iso <= r.to);

export const sumValor = (list: Entrada[]) =>
  Math.round(list.reduce((s, e) => s + Number(e.valor), 0) * 100) / 100;

export const totalIn = (list: Entrada[], r: Range | null) =>
  sumValor(list.filter((e) => inRange(e.data_recebimento, r)));

export function filterEntradas(list: Entrada[], search: string, r: Range | null) {
  const q = search.trim().toLowerCase();
  return list.filter(
    (e) =>
      inRange(e.data_recebimento, r) &&
      (!q ||
        e.cliente.toLowerCase().includes(q) ||
        e.obra.toLowerCase().includes(q) ||
        (e.observacoes ?? "").toLowerCase().includes(q)),
  );
}

export function topBy(list: Entrada[], key: "cliente" | "obra", n = 5) {
  const map = new Map<string, number>();
  for (const e of list) map.set(e[key], (map.get(e[key]) ?? 0) + Number(e.valor));
  return [...map.entries()]
    .map(([label, total]) => ({ label, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

/** Totais dos últimos `n` meses, terminando no mês de `today`. */
export function monthlySeries(list: Entrada[], today: string, n = 12) {
  const [y = 0, m = 1] = today.split("-").map(Number);
  const out: { key: string; label: string; total: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = fmt(d).slice(0, 7);
    out.push({ key, label: MESES[d.getUTCMonth()] ?? "", total: 0 });
  }
  const idx = new Map(out.map((o, i) => [o.key, i]));
  for (const e of list) {
    const i = idx.get(e.data_recebimento.slice(0, 7));
    const o = i === undefined ? undefined : out[i];
    if (o) o.total += Number(e.valor);
  }
  return out;
}

export function weekdayTotals(list: Entrada[]) {
  const t = Array(7).fill(0) as number[];
  for (const e of list) {
    const i = weekdayIndex(e.data_recebimento);
    t[i] = (t[i] ?? 0) + Number(e.valor);
  }
  return DIAS_SEMANA.map((label, i) => ({ label, total: t[i] ?? 0 }));
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);
export const formatDateBR = (iso: string) => iso.split("-").reverse().join("/");

const csvCell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV com ";" (padrão Excel pt-BR) e BOM UTF-8. */
export function toCSV(list: Entrada[]) {
  const header = "Data;Cliente;Obra;Valor;Observações";
  const rows = list.map((e) =>
    [
      formatDateBR(e.data_recebimento),
      e.cliente,
      e.obra,
      Number(e.valor).toFixed(2).replace(".", ","),
      e.observacoes ?? "",
    ]
      .map(csvCell)
      .join(";"),
  );
  return "\uFEFF" + [header, ...rows].join("\n");
}