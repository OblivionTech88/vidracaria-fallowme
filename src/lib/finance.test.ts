import { describe, expect, it } from "vitest";
import { periodRange, todayISO, toCSV, totalIn, weekdayIndex, type Entrada } from "./finance";

const e = (data: string, valor: number): Entrada => ({
  id: data, cliente: "A", obra: "B", valor, data_recebimento: data, observacoes: null,
});

describe("finance", () => {
  it("usa fuso America/Sao_Paulo (02:00 UTC ainda é dia anterior)", () => {
    expect(todayISO(new Date("2026-10-30T02:00:00Z"))).toBe("2026-10-29");
  });
  it("semana começa na segunda-feira", () => {
    // 2026-11-01 é domingo
    expect(periodRange("semana", "2026-11-01")).toEqual({ from: "2026-10-26", to: "2026-11-01" });
    expect(weekdayIndex("2026-10-26")).toBe(0);
  });
  it("mês cobre o último dia", () => {
    expect(periodRange("mes", "2026-02-10")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
  it("soma apenas o período", () => {
    const r = periodRange("hoje", "2026-10-29");
    expect(totalIn([e("2026-10-29", 100.1), e("2026-10-28", 50)], r)).toBe(100.1);
  });
  it("CSV usa ponto e vírgula e vírgula decimal", () => {
    expect(toCSV([e("2026-10-29", 1234.5)]).split("\n")[1]).toBe("29/10/2026;A;B;1234,50;");
  });
});