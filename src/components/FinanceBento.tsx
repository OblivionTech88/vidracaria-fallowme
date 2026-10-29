import { useMemo } from "react";
import { FinanceBento as OriginalBento } from "@/components/ui/finance-bento";
import { type Entrada, todayISO, periodRange, totalIn, topBy, weekdayTotals, monthlySeries } from "@/lib/finance";

const sum = (items: Entrada[]) => items.reduce((v,e)=>v+Number(e.valor),0);
const today = () => todayISO();

export function FinanceBento({entradas}:{entradas:Entrada[]}) {
 const data = useMemo(()=>{
   const now=today(), y=Number(now.slice(0,4)), m=Number(now.slice(5,7));
   const clients=topBy(entradas,"cliente",2).map(c=>c.label);
   const byMonth = new Map<string,{fiat:number;stocks:number;crypto:number}>();
   for(const e of entradas) {
     const k=e.data_recebimento.slice(0,7);
     const row=byMonth.get(k)||{fiat:0,stocks:0,crypto:0};
     const key=e.cliente===clients[0]?"stocks":e.cliente===clients[1]?"crypto":"fiat";
     row[key]+=Number(e.valor);byMonth.set(k,row);
   }
   const totals={fiat:0,stocks:0,crypto:0};
   const initial= new Date(Date.UTC(y,m-35,1)).toISOString().slice(0,7);
   for(const [k,r] of byMonth) if(k<initial) {totals.fiat+=r.fiat;totals.stocks+=r.stocks;totals.crypto+=r.crypto;}
   const history=Array.from({length:36},(_,i)=>{
     const date=new Date(Date.UTC(y,m-35+i,28));
     const key=date.toISOString().slice(0,7),r=byMonth.get(key);
     if(r){totals.fiat+=r.fiat;totals.stocks+=r.stocks;totals.crypto+=r.crypto;}
     return {date:date.toISOString(),...totals};
   });
   const last6=monthlySeries(entradas,now,6);
   const income=last6.map(x=>x.total/1000);
   const last6Prev=last6.map(x=>{
     const yy=Number(x.key.slice(0,4))-1;
     return sum(entradas.filter(e=>e.data_recebimento.startsWith(yy+"-"+x.key.slice(5))))/1000;
   });
   const obras=topBy(entradas,"obra",3);
   const amount=sum(entradas)||1;
   const crypto=Array.from({length:3},(_,i)=>{
     const obra=obras[i],items=obra?entradas.filter(e=>e.obra===obra.label):[];
     const daily=Array.from({length:7},(_,d)=>{
       const date=new Date(Date.UTC(y,m-1,Number(now.slice(8))-6+d)).toISOString().slice(0,10);
       return sum(items.filter(e=>e.data_recebimento===date))/1000;
     });
     return {name:obra?.label||"Sem obra",symbol:["OB1","OB2","OB3"][i],share:(obra?.total||0)/amount,change:"0%",ohlc:daily.map(v=>[v,v,v,v])};
   });
   const weekly=weekdayTotals(entradas.filter(e=>{const r=periodRange("semana",now)!;return e.data_recebimento>=r.from&&e.data_recebimento<=r.to;}));
   return {
     kpis:{today:totalIn(entradas,periodRange("hoje",now)),week:totalIn(entradas,periodRange("semana",now)),month:totalIn(entradas,periodRange("mes",now)),year:totalIn(entradas,periodRange("ano",now))},
     history,
     payments:entradas.slice().sort((a,b)=>b.data_recebimento.localeCompare(a.data_recebimento)).slice(0,3).map(e=>({name:e.cliente,date:e.data_recebimento.slice(5),amount:Number(e.valor)})),
     goals:[{name:"Entradas do mês",progress:1,target:totalIn(entradas,periodRange("mes",now))},{name:"Entradas do ano",progress:1,target:totalIn(entradas,periodRange("ano",now))}],
     cashflow:{months:last6.map(x=>x.label),income:[income,last6Prev,[0,0,0,0,0,0]],spending:[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]]},
     crypto,
     stocks:{days:weekly.slice(0,5).map(x=>x.label),values:weekly.slice(0,5).map(x=>x.total/1000)}
   };
 },[entradas]);
 return <OriginalBento data={data} title="Fallow'me | Financeiro" subtitle="Recebimentos da vidraçaria" credit={false}/>;
}
