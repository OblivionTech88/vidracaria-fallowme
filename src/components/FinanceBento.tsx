import { useMemo, type ReactNode } from "react";
import { ArrowUpRight, CalendarDays, CalendarRange, Sun, TrendingUp } from "lucide-react";
import {
  formatBRL,
  monthlySeries,
  periodRange,
  todayISO,
  topBy,
  totalIn,
  weekdayTotals,
  type Entrada,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

function Card({ className, title, icon, children }: { className?: string; title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn("bento-card flex flex-col p-5", className)}>
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

const Empty = () => <p className="m-auto text-sm text-muted-foreground">Sem entradas registradas</p>;

function AreaChart({ data }: { data: { label: string; total: number }[] }) {
  const W = 600, H = 220, P = 8;
  const max = Math.max(...data.map((d) => d.total), 1);
  const pts = data.map((d, i) => [P + (i * (W - 2 * P)) / (data.length - 1), H - P - (d.total / max) * (H - 2 * P)]);
  const line = pts.map(([x = 0, y = 0], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W - P},${H} L${P},${H} Z`;
  return (
    <div className="flex flex-1 flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full min-h-48 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fa" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--color-border)" />
        ))}
        <path d={area} fill="url(#fa)" className="animate-in fade-in duration-1000" />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" className="animate-draw" style={{ ["--len" as string]: 2000 }} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        {data.map((d) => <span key={d.label + d.total}>{d.label}</span>)}
      </div>
    </div>
  );
}

function Bars({ data, highlightMax }: { data: { label: string; total: number }[]; highlightMax?: boolean }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex flex-1 items-end gap-1.5">
      {data.map((d, i) => {
        const isMax = highlightMax && d.total === max && d.total > 0;
        return (
          <div key={d.label + i} className="flex flex-1 flex-col items-center gap-2" title={formatBRL(d.total)}>
            <svg viewBox="0 0 10 100" preserveAspectRatio="none" className="h-28 w-full">
              <rect x="0" y="0" width="10" height="100" rx="2" fill="var(--color-secondary)" />
              <rect
                x="0" y={100 - (d.total / max) * 100} width="10" height={(d.total / max) * 100} rx="2"
                fill={isMax || !highlightMax ? "var(--color-primary)" : "var(--color-chart-4)"}
                className="animate-grow" style={{ animationDelay: `${i * 50}ms` }}
              />
            </svg>
            <span className="font-mono text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const GAUGE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

function Gauge({ items, total }: { items: { label: string; total: number }[]; total: number }) {
  const R = 80, C = Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-1 flex-col items-center justify-between">
      <svg viewBox="0 0 200 110" className="w-full max-w-64">
        <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="var(--color-secondary)" strokeWidth="16" strokeLinecap="round" />
        {items.map((it, i) => {
          const len = (it.total / total) * C;
          const el = (
            <path key={it.label} d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke={GAUGE_COLORS[i]} strokeWidth="16"
              strokeDasharray={`${len} ${C}`} strokeDashoffset={-acc} className="animate-in fade-in duration-1000" />
          );
          acc += len;
          return el;
        })}
        <text x="100" y="92" textAnchor="middle" className="fill-foreground text-[15px] font-semibold">{formatBRL(total)}</text>
      </svg>
      <ul className="mt-4 w-full space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: GAUGE_COLORS[i] }} />
              <span className="truncate">{it.label}</span>
            </span>
            <span className="font-mono text-muted-foreground">{Math.round((it.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({ title, value, icon, hint }: { title: string; value: number; icon: ReactNode; hint: string }) {
  return (
    <Card title={title} icon={icon} className="col-span-1 md:col-span-3">
      <p className="text-2xl font-semibold tracking-tight lg:text-3xl">{formatBRL(value)}</p>
      <p className="mt-auto pt-3 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export function FinanceBento({ entradas }: { entradas: Entrada[] }) {
  const v = useMemo(() => {
    const today = todayISO();
    const ano = periodRange("ano", today);
    const anoList = entradas.filter((e) => e.data_recebimento >= ano!.from && e.data_recebimento <= ano!.to);
    const obras = topBy(entradas, "obra", 100);
    const top3 = obras.slice(0, 3);
    const rest = obras.slice(3).reduce((s, o) => s + o.total, 0);
    return {
      hoje: totalIn(entradas, periodRange("hoje", today)),
      semana: totalIn(entradas, periodRange("semana", today)),
      mes: totalIn(entradas, periodRange("mes", today)),
      ano: totalIn(entradas, ano),
      total: totalIn(entradas, null),
      serie12: monthlySeries(entradas, today, 12),
      fluxoAno: monthlySeries(anoList, `${today.slice(0, 4)}-12-01`, 12),
      gauge: rest > 0 ? [...top3, { label: "Outras", total: rest }] : top3,
      clientes: topBy(entradas, "cliente", 5),
      obrasTop: obras.slice(0, 5),
      semanaDias: weekdayTotals(entradas),
    };
  }, [entradas]);

  const has = entradas.length > 0;
  const prev = v.serie12.at(-2)?.total ?? 0;
  const cur = v.serie12.at(-1)?.total ?? 0;
  const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
      <Card title="Evolução de receitas · 12 meses" icon={<TrendingUp />} className="md:col-span-6 lg:col-span-8 lg:row-span-2">
        <div className="mb-4 flex items-end gap-3">
          <p className="text-4xl font-semibold tracking-tight">{formatBRL(v.total)}</p>
          {delta !== null && (
            <span className={cn("mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", delta >= 0 ? "bg-success/15 text-success" : "bg-primary/15 text-primary")}>
              <ArrowUpRight className={cn("size-3", delta < 0 && "rotate-90")} /> {delta}% vs mês anterior
            </span>
          )}
        </div>
        {has ? <AreaChart data={v.serie12} /> : <Empty />}
      </Card>

      <Card title="Distribuição por obras" className="md:col-span-6 lg:col-span-4 lg:row-span-2">
        {has ? <Gauge items={v.gauge} total={v.total} /> : <Empty />}
      </Card>

      <div className="contents md:[&>*]:col-span-3">
        <Kpi title="Hoje" value={v.hoje} icon={<Sun />} hint="Entradas recebidas hoje" />
        <Kpi title="Semana" value={v.semana} icon={<CalendarRange />} hint="Segunda a domingo" />
        <Kpi title="Mês" value={v.mes} icon={<CalendarDays />} hint="Mês corrente" />
        <Kpi title="Ano" value={v.ano} icon={<TrendingUp />} hint="Ano corrente" />
      </div>

      <Card title="Fluxo mensal · ano atual" className="md:col-span-6 lg:col-span-5">
        {has ? <Bars data={v.fluxoAno} highlightMax /> : <Empty />}
      </Card>

      <Card title="Maiores clientes / obras" className="md:col-span-3 lg:col-span-4">
        {has ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[["Clientes", v.clientes], ["Obras", v.obrasTop]].map(([t, list]) => (
              <div key={t as string}>
                <p className="mb-2 text-xs text-muted-foreground">{t as string}</p>
                <ol className="space-y-2">
                  {(list as { label: string; total: number }[]).map((x, i) => (
                    <li key={x.label} className="min-w-0">
                      <p className="truncate"><span className="mr-1 font-mono text-primary">{i + 1}</span>{x.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">{formatBRL(x.total)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : <Empty />}
      </Card>

      <Card title="Entradas por dia da semana" className="md:col-span-3 lg:col-span-3">
        {has ? <Bars data={v.semanaDias} highlightMax /> : <Empty />}
      </Card>
    </div>
  );
}