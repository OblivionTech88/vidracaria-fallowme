import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { entradasQuery } from "@/lib/entradas";
import { FinanceBento } from "@/components/FinanceBento";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel | Fallow'me Controle Financeiro" },
      { name: "description", content: "Resumo financeiro das entradas da Fallow'me." },
      { property: "og:title", content: "Painel | Fallow'me" },
      { property: "og:description", content: "Resumo financeiro das entradas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useQuery(entradasQuery);
  if (error) return <p className="text-primary">Erro ao carregar dados.</p>;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Painel financeiro</h1>
      {isLoading || !data ? <Skeleton className="h-[600px] rounded-3xl" /> : <FinanceBento entradas={data} />}
    </div>
  );
}