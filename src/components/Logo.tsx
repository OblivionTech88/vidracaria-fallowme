import { useState } from "react";

/** Usa /logo.png quando existir; caso contrário, mostra o nome em texto. */
export function Logo() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {!failed && (
        <img src="/logo.png" alt="Fallow'me" className="h-9 w-auto" onError={() => setFailed(true)} />
      )}
      {failed && (
        <span className="text-xl font-bold tracking-tight">
          Fallow<span className="text-primary">'me</span>
        </span>
      )}
      <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:inline">
        Controle Financeiro
      </span>
    </div>
  );
}