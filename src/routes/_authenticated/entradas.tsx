import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEntrada, entradasQuery, saveEntrada, type EntradaInput } from "@/lib/entradas";
import {
  filterEntradas, formatBRL, formatDateBR, periodRange, sumValor, toCSV, todayISO,
  type Entrada, type Period,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const Route = createFileRoute("/_authenticated/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas | Fallow'me Controle Financeiro" },
      { name: "description", content: "Cadastro e consulta de entradas recebidas." },
      { property: "og:title", content: "Entradas | Fallow'me" },
      { property: "og:description", content: "Cadastro e consulta de entradas recebidas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntradasPage,
});

const PERIODS: { v: Period; l: string }[] = [
  { v: "todos", l: "Todos" }, { v: "hoje", l: "Hoje" }, { v: "semana", l: "Semana" },
  { v: "mes", l: "Mês" }, { v: "ano", l: "Ano" }, { v: "personalizado", l: "Personalizado" },
];

function EntradasPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(entradasQuery);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("todos");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [editing, setEditing] = useState<Entrada | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Entrada | null>(null);

  const list = useMemo(
    () => filterEntradas(data, search, periodRange(period, todayISO(), custom)),
    [data, search, period, custom],
  );

  const del = useMutation({
    mutationFn: deleteEntrada,
    onSuccess: () => { toast.success("Entrada excluída"); qc.invalidateQueries({ queryKey: ["entradas"] }); },
    onError: () => toast.error("Erro ao excluir"),
  });

  const exportCSV = () => {
    const url = URL.createObjectURL(new Blob([toCSV(list)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fallowme-entradas-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Entradas recebidas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!list.length}><Download /> CSV</Button>
          <Button onClick={() => setEditing("new")}><Plus /> Nova entrada</Button>
        </div>
      </div>

      <div className="bento-card space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar cliente, obra ou observação" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as Period)} className="flex-wrap justify-start">
          {PERIODS.map((p) => <ToggleGroupItem key={p.v} value={p.v} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{p.l}</ToggleGroupItem>)}
        </ToggleGroup>
        {period === "personalizado" && (
          <div className="flex flex-wrap gap-3">
            <Input type="date" className="w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="De" />
            <Input type="date" className="w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="Até" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {list.length} entrada(s) · Total <span className="font-semibold text-foreground">{formatBRL(sumValor(list))}</span>
        </p>
      </div>

      <div className="bento-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b">
              <th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Obra</th>
              <th className="p-3 text-right">Valor</th><th className="p-3">Observações</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && !list.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma entrada encontrada</td></tr>}
            {list.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/50">
                <td className="p-3 font-mono">{formatDateBR(e.data_recebimento)}</td>
                <td className="p-3">{e.cliente}</td>
                <td className="p-3">{e.obra}</td>
                <td className="p-3 text-right font-mono">{formatBRL(e.valor)}</td>
                <td className="max-w-64 truncate p-3 text-muted-foreground">{e.observacoes}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="edit" onClick={() => setEditing(e)}><Pencil /> Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => setToDelete(e)} aria-label="Excluir"><Trash2 /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <EntradaDialog entrada={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.cliente} · ${toDelete.obra} · ${formatBRL(toDelete.valor)}. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => toDelete && del.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntradaDialog({ entrada, onClose }: { entrada: Entrada | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    cliente: entrada?.cliente ?? "",
    obra: entrada?.obra ?? "",
    valor: entrada ? String(entrada.valor).replace(".", ",") : "",
    data_recebimento: entrada?.data_recebimento ?? todayISO(),
    observacoes: entrada?.observacoes ?? "",
  });
  const save = useMutation({
    mutationFn: (input: EntradaInput) => saveEntrada(input, entrada?.id),
    onSuccess: () => { toast.success("Entrada salva"); qc.invalidateQueries({ queryKey: ["entradas"] }); onClose(); },
    onError: () => toast.error("Erro ao salvar"),
  });
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const valor = Number(f.valor.replace(/\./g, "").replace(",", "."));
    if (!(valor > 0)) {
      toast.error("Informe um valor válido");
      return;
    }
    save.mutate({
      cliente: f.cliente.trim(), obra: f.obra.trim(), valor,
      data_recebimento: f.data_recebimento, observacoes: f.observacoes.trim() || null,
    });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{entrada ? "Editar entrada" : "Nova entrada"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="c">Cliente</Label><Input id="c" required maxLength={120} value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="o">Obra</Label><Input id="o" required maxLength={120} value={f.obra} onChange={(e) => setF({ ...f, obra: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="v">Valor (R$)</Label><Input id="v" required inputMode="decimal" placeholder="0,00" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="d">Data do recebimento</Label><Input id="d" type="date" required value={f.data_recebimento} onChange={(e) => setF({ ...f, data_recebimento: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="obs">Observações</Label><Textarea id="obs" maxLength={1000} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="save" disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}