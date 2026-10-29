import { useEffect, useState } from "react";
import { Settings, Download, Save, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { entradasQuery } from "@/lib/entradas";
import { toCSV } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SettingsDialog(){
 const {data:entradas=[]}=useQuery(entradasQuery);
 const [company,setCompany]=useState("Vidraçaria Fallow'me");
 const [name,setName]=useState("");
 const [period,setPeriod]=useState("mes");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>{const x=data.user?.user_metadata||{};setCompany(x.company_name||"Vidraçaria Fallow'me");setName(x.display_name||"");setPeriod(x.default_period||"mes")})},[]);
 async function save(){
  setBusy(true);
  try{const {error}=await supabase.auth.updateUser({data:{company_name:company,display_name:name,default_period:period}});if(error)throw error;toast.success("Configurações salvas na sua conta.");}
  catch(e){toast.error(e instanceof Error?e.message:"Erro ao salvar");}finally{setBusy(false)}
 }
 async function changePassword(){if(password.length<8){toast.error("Use uma senha de pelo menos 8 caracteres.");return;}const {error}=await supabase.auth.updateUser({password});if(error)toast.error(error.message);else{toast.success("Senha alterada.");setPassword("")}}
 function exportFile(){const blob=new Blob([toCSV(entradas)],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="fallowme-entradas.csv";a.click();URL.revokeObjectURL(url)}
 return <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Configurações"><Settings className="size-5"/></Button></DialogTrigger>
 <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Configurações | Fallow'me</DialogTitle></DialogHeader>
 <div className="space-y-5 py-3">
  <section className="space-y-3"><h3 className="font-semibold">Empresa e perfil</h3><div><Label>Nome da empresa</Label><Input value={company} onChange={e=>setCompany(e.target.value)}/></div><div><Label>Nome do responsável</Label><Input value={name} onChange={e=>setName(e.target.value)}/></div></section>
  <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">Preferências financeiras</h3><p className="text-sm text-muted-foreground">Moeda: Real brasileiro (BRL) · Fuso: América/São Paulo · Semana: segunda a domingo</p><Label htmlFor="defaultPeriod">Período padrão</Label><select id="defaultPeriod" className="w-full rounded-lg border bg-background p-3" value={period} onChange={e=>setPeriod(e.target.value)}><option value="hoje">Hoje</option><option value="semana">Semana</option><option value="mes">Mês</option><option value="ano">Ano</option></select></section>
  <Button onClick={save} disabled={busy} className="w-full bg-green-600 text-white hover:bg-green-700"><Save className="mr-2 size-4"/>Salvar configurações</Button>
  <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Segurança</h3><Label>Nova senha</Label><Input value={password} type="password" minLength={8} onChange={e=>setPassword(e.target.value)}/><Button variant="outline" onClick={changePassword}><KeyRound className="mr-2 size-4"/>Alterar senha</Button></section>
  <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">Exportação de dados</h3><Button variant="outline" onClick={exportFile}><Download className="mr-2 size-4"/>Baixar entradas em CSV</Button></section>
 </div></DialogContent></Dialog>;
}
