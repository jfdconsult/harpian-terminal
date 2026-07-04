"use client";
import { useEffect, useMemo, useState } from "react";
import { EXAMPLE_PORTFOLIO } from "@/lib/market";
import { publishScreenData } from "@/lib/jim-data";

// Valores de perfil/contrato/motor interno (NÃO são dados de mercado).
const PROD_HPC22 = 38; // risk_number.py (motor interno)
const PROD_HPC11 = 34;
const CLIENTE = 62;    // tolerância (questionário)
const MANDATO = 55;    // teto contratual

interface Quote { symbol: string; riskNumber?: number | null; error?: boolean }

export default function Risco() {
  const [portRN, setPortRN] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [x, setX] = useState(0); // % migrado para o HPC22

  useEffect(() => {
    const syms = EXAMPLE_PORTFOLIO.map((p) => p.symbol).join(",");
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`)
      .then((r) => r.json())
      .then((d: Quote[]) => {
        let acc = 0, wsum = 0;
        for (const p of EXAMPLE_PORTFOLIO) {
          const q = d.find((x) => x.symbol === p.symbol);
          if (q && q.riskNumber != null) { acc += q.riskNumber * p.weight; wsum += p.weight; }
        }
        setPortRN(wsum > 0 ? Math.round(acc / wsum) : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const blended = useMemo(() => {
    if (portRN == null) return null;
    return Math.round((1 - x / 100) * portRN + (x / 100) * PROD_HPC22);
  }, [portRN, x]);

  const gap = blended != null ? blended - MANDATO : null;

  // Publica pro JIM os 4 níveis de risco na mesma régua.
  useEffect(() => {
    publishScreenData(
      "risco",
      "Comparação de risco na régua do Número de Risco (0–100, S&P 500 ≈ 27). Quatro níveis: produto (fundo), cliente (tolerância do perfil), mandato (teto contratual) e portfólio (carteira ao vivo).",
      {
        riscoProduto_HPC22: PROD_HPC22, riscoProduto_HPC11: PROD_HPC11,
        riscoCliente: CLIENTE, riscoMandato: MANDATO,
        riscoPortfolioHoje: blended, acimaDoMandato: gap,
        cliente: "Vera Hollanda",
      },
      {
        briefing:
          `Você está vendo os 4 níveis de risco da Vera Hollanda na mesma régua (0–100): ` +
          `produto HPC22 **${PROD_HPC22}**, cliente **${CLIENTE}**, mandato **${MANDATO}**, ` +
          `portfólio hoje **${blended ?? "…"}**` +
          (gap != null ? (gap > 0 ? ` (▲ ${gap} acima do mandato)` : ` (dentro do mandato)`) : "") + ".",
        suggestions: [
          "O portfólio está dentro do mandato?",
          "O que significa o Número de Risco 62 do cliente?",
          "Migrar pro HPC22 reduz quanto o risco?",
        ],
      }
    );
  }, [blended, gap]);

  // Marcadores ordenados por valor; rótulos alternam 2 alturas p/ nunca colidirem.
  const markers = [
    { v: PROD_HPC22, color: "var(--gold)", label: `HPC22 ${PROD_HPC22}` },
    { v: MANDATO, color: "var(--blue)", label: `mandato ${MANDATO}` },
    { v: CLIENTE, color: "var(--tx)", label: `cliente ${CLIENTE}` },
    ...(blended != null ? [{ v: blended, color: "var(--red)", label: `portfólio ${blended}` }] : []),
  ].sort((a, b) => a.v - b.v);

  return (
    <div className="screen">
      <div className="crumb">Risco › <b>Comparação · 4 níveis</b></div>
      <div className="h1">Risco — os 4 níveis na mesma régua</div>
      <div className="sub">Cliente: Vera Hollanda · tudo no Número de Risco (0–100).</div>

      <div className="grid g4 mb">
        <div className="card"><h3><i className="ti ti-coin" />Risco produto</h3><div className="big" style={{ color: "var(--orange)" }}>{PROD_HPC22}</div><div className="muted mt">HPC22 (o fundo). HPC11 = {PROD_HPC11}.</div></div>
        <div className="card"><h3><i className="ti ti-user-heart" />Risco cliente</h3><div className="big">{CLIENTE}</div><div className="muted mt">Tolerância da pessoa (perfil/questionário).</div></div>
        <div className="card"><h3><i className="ti ti-file-certificate" />Risco mandato</h3><div className="big">{MANDATO}</div><div className="muted mt">Teto contratual da conta.</div></div>
        <div className="card" style={{ borderColor: "rgba(231,76,60,.3)" }}>
          <h3><i className="ti ti-wallet" />Risco portfólio</h3>
          <div className="big r">{loading ? "…" : blended ?? "—"}</div>
          <div className="muted mt" style={{ color: gap != null && gap > 0 ? "var(--red)" : "var(--green)" }}>
            {gap == null ? "carteira exemplo (Yahoo)" : gap > 0 ? `▲ +${gap} acima do mandato` : `✓ dentro do mandato`}
          </div>
        </div>
      </div>

      <div className="card">
        <h3><i className="ti ti-scale" />Na mesma régua — Número de Risco</h3>
        <div style={{ position: "relative", height: 72, margin: "8px 8px 0" }}>
          <div style={{ position: "absolute", top: 48, left: 0, right: 0, height: 9, borderRadius: 5, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
          {markers.map((m, i) => (
            <div key={m.label}>
              <div style={{ position: "absolute", top: i % 2 === 0 ? 2 : 22, left: `${m.v}%`, transform: "translateX(-50%)", fontSize: 10.5, color: m.color, whiteSpace: "nowrap", fontFamily: "var(--mono)", transition: "left .2s" }}>{m.label}</div>
              <div style={{ position: "absolute", top: 44, left: `${m.v}%`, transform: "translateX(-50%)", width: 2, height: 17, background: m.color, transition: "left .2s" }} />
            </div>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 10 }}>
          <i><b style={{ background: "#C9A02C" }} />HPC22 (produto) {PROD_HPC22}</i>
          <i><b style={{ background: "#4A90D9" }} />Mandato (teto) {MANDATO}</i>
          <i><b style={{ background: "#EAF0F7" }} />Cliente (tolera) {CLIENTE}</i>
          <i><b style={{ background: "#E74C3C" }} />Portfólio (hoje) {blended ?? "—"}</i>
        </div>
        <div className="flex mt" style={{ gap: 14 }}>
          <span className="muted" style={{ minWidth: 190 }}>Simular: migrar para o HPC22</span>
          <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--mono)", minWidth: 46, textAlign: "right" }}>{x}%</span>
        </div>
        <div className="muted mt">
          Mova o slider: ao migrar parte da carteira para o HPC22, o risco do portfólio cai em direção ao mandato.
        </div>
      </div>

      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-info-circle" style={{ color: "var(--blue)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>
            O Risco de portfólio é calculado ao vivo a partir da carteira exemplo (Yahoo Finance), pela média ponderada do Número de Risco dos ativos (aproximação sem correlação). Produto, cliente e mandato vêm do motor interno / perfil / contrato. Escala calibrada ao S&amp;P 500 ≈ 27.
          </div>
        </div>
      </div>
    </div>
  );
}
