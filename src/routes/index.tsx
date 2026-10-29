import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fallow'me | Controle Financeiro" },
      { name: "description", content: "Painel financeiro da Vidraçaria Fallow'me." },
      { property: "og:title", content: "Fallow'me | Controle Financeiro" },
      { property: "og:description", content: "Painel financeiro da Vidraçaria Fallow'me." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/auth" });
  },
  component: () => null,
});