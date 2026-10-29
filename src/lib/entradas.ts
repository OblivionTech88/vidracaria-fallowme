import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Entrada } from "./finance";

export type EntradaInput = Omit<Entrada, "id">;

async function fetchAll(): Promise<Entrada[]> {
  const out: Entrada[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("entradas")
      .select("id,cliente,obra,valor,data_recebimento,observacoes")
      .order("data_recebimento", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...data.map((d) => ({ ...d, valor: Number(d.valor) })));
    if (data.length < page) return out;
  }
}

export const entradasQuery = queryOptions({ queryKey: ["entradas"], queryFn: fetchAll });

export async function saveEntrada(input: EntradaInput, id?: string) {
  const { error } = id
    ? await supabase.from("entradas").update(input).eq("id", id)
    : await supabase.from("entradas").insert(input);
  if (error) throw error;
}

export async function deleteEntrada(id: string) {
  const { error } = await supabase.from("entradas").delete().eq("id", id);
  if (error) throw error;
}