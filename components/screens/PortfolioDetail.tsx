"use client";
import { useEffect, useState } from "react";
import { findClient } from "@/lib/clientStore";
import { brl, type Client, type Portfolio } from "@/lib/clients";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";

interface Quote { symbol: string; price?: number; dayPct?: number | null; error?: boolean }

const pctFmt = (v: number) => (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
const usd = (n: number) => "US$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

function sumBy<T>(rows: T[], key: (r: T) => string, val: (r: T) => number): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + val(r));
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default function PortfolioDetail({ arg, go }: { arg?: string; go: (id: ScreenId, param?: string) => void }) {
  const [clientId, portfolioId] = (arg || "").split(":");
  const client: Client = findClient(clientId || "");
  const portfolios = client.portfolios || [];
  const [selectedId, setSelectedId] = useState(portfolioId || portfolios[0]?.id);
  useEffect(() => { if (portfolioId) setSelectedId(portfolioId); }, [portfolioId]);

  const portfolio: Portfolio | undefined = portfolios.find((p) => p.id === selectedId) || portfolios[0];
  const account = client.accounts?.find((a) => a.id === portfolio?.accountId);
  const items = portfolio?.items || [];
  const hasDetail = items.length > 0;

  const totalUsd = hasDetail ? items.reduce((s, i) => s + i.valorUsd, 0) : 0;
  const byGeo = hasDetail ? sumBy(items, (i) => i.geografia, (i) => i.valorUsd) : [];
  const byCat = hasDetail ? sumBy(items, (i) => i.categoria, (i) => i.valorUsd) : [];
  const byRisco = hasDetail ? sumBy(items, (i) => i.perfilRisco, (i) => i.valorUsd) : [];
  const top = hasDetail ? [...items].sort((a, b) => b.valorUsd - a.valorUsd)[0] : null;
  const concentracaoTop5 = hasDetail
    ? [...items].sort((a, b) => b.valorUsd - a.valorUsd).slice(0, 5).reduce((s, i) => s + i.valorUsd, 0) / (totalUsd || 1)
    : 0;
  const retornoPondUsd = hasDetail
    ? items.reduce((s, i) => s + (i.retornoUsdPct ?? 0) * i.valorUsd, 0) / (totalUsd || 1)
    : null;
  const volPond = hasDetail
    ? items.reduce((s, i) => s + (i.volatilidadePct ?? 0) * i.valorUsd, 0) / (totalUsd || 1)
    : null;

  // Sem detalhamento (items) — carteira só com posições simples (CSV importado) — busca cotação ao vivo.
  const [live, setLive] = useState<Record<string, Quote>>({});
  useEffect(() => {
    if (hasDetail || !portfolio?.positions.length) return;
    const syms = portfolio.positions.map((p) => p.ticker).join(",");
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`)
      .then((r) => r.json())
      .then((d: Quote[]) => setLive(d.reduce((m, q) => { m[q.symbol] = q; return m; }, {} as Record<string, Quote>)))
      .catch(() => {});
  }, [portfolio, hasDetail]);

  // Publica pro JIM o detalhamento COMPLETO do portfólio — produto a produto, categoria,
  // geografia, perfil de risco — pra ele conseguir analisar concentração/diversificação de verdade.
  useEffect(() => {
    if (!portfolio) return;
    publishScreenData(
      "portfolio-detalhe",
      `Detalhamento completo do portfólio "${portfolio.name}" do cliente ${client.name}${account ? ` (conta ${account.bank})` : ""}. Mostra cada produto (emissor, categoria, sub-categoria, geografia, ticker, alocação %, valor, perfil de risco, retorno e volatilidade estimados).`,
      hasDetail
        ? {
            cliente: client.name, portfolio: portfolio.name, banco: account?.bank || null,
            modelo: portfolio.modelLabel || null, valorTotalUsd: totalUsd, nProdutos: items.length,
            concentracaoTop5Pct: concentracaoTop5, retornoPonderadoUsdPct: retornoPondUsd, volatilidadePonderadaPct: volPond,
            porGeografia: byGeo, porCategoria: byCat, porPerfilRisco: byRisco,
            produtos: items.map((i) => ({
              produto: i.produto, emissor: i.emissor, categoria: i.categoria, subCategoria: i.subCategoria,
              geografia: i.geografia, ticker: i.ticker, alocacaoPct: i.alocacaoPct, valorUsd: i.valorUsd,
              perfilRisco: i.perfilRisco, retornoUsdPct: i.retornoUsdPct ?? null, volatilidadePct: i.volatilidadePct ?? null,
            })),
          }
        : { cliente: client.name, portfolio: portfolio.name, posicoes: portfolio.positions },
      {
        briefing: hasDetail
          ? `Você está no detalhamento de **${portfolio.name}** de ${client.name} — ${items.length} produtos, ${usd(totalUsd)}` +
            (portfolio.modelLabel ? ` (modelo ${portfolio.modelLabel}).` : ".") +
            ` Maior posição: **${top?.produto}** (${pctFmt(top?.alocacaoPct || 0)}). Top 5 concentram ${pctFmt(concentracaoTop5)}.`
          : `Você está vendo as posições de **${portfolio.name}** de ${client.name} (${portfolio.positions.length} ativos).`,
        suggestions: [
          "Esse portfólio está bem diversificado?",
          "Qual a maior concentração de risco aqui?",
          "Como esse portfólio se compara ao mandato do cliente?",
        ],
      }
    );
  }, [portfolio, client, account, hasDetail, items, totalUsd, byGeo, byCat, byRisco, top, concentracaoTop5, retornoPondUsd, volPond]);

  if (!portfolio) {
    return (
      <div className="screen">
        <div className="crumb">Clientes › <b>{client.name}</b> › <b>Portfólio</b></div>
        <div className="placeholder"><i className="ti ti-briefcase-off" /><b>Este cliente não tem portfólios cadastrados.</b></div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="crumb">Clientes › <b onClick={() => go("cliente", client.id)} style={{ cursor: "pointer" }}>{client.name}</b> › <b>{portfolio.name}</b></div>

      <div className="flex between wrap" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="h1">{portfolio.name}</div>
          <div className="sub" style={{ margin: 0 }}>
            {account ? `${account.bank} · ${account.type}` : "sem conta vinculada"}
            {portfolio.modelLabel && <span style={{ marginLeft: 8, color: "var(--gold)" }}>· {portfolio.modelLabel}</span>}
          </div>
        </div>
        {portfolios.length > 1 && (
          <div className="flex" style={{ gap: 8, alignItems: "center" }}>
            <span className="flabel">Portfólio:</span>
            <select className="fsel" style={{ fontSize: 13, padding: "8px 12px", minWidth: 220 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {hasDetail ? (
        <>
          <div className="grid g4 mt mb">
            <div className="card"><div className="muted">Valor total</div><div className="big" style={{ fontSize: 22 }}>{usd(totalUsd)}</div></div>
            <div className="card"><div className="muted">Produtos</div><div className="big" style={{ fontSize: 22 }}>{items.length}</div></div>
            <div className="card"><div className="muted">Concentração top 5</div><div className="big" style={{ fontSize: 22, color: concentracaoTop5 > 0.5 ? "var(--orange)" : "var(--tx)" }}>{pctFmt(concentracaoTop5)}</div></div>
            <div className="card"><div className="muted">Retorno USD est. (ponderado)</div><div className={`big ${retornoPondUsd != null && retornoPondUsd >= 0 ? "g" : "r"}`} style={{ fontSize: 22 }}>{retornoPondUsd != null ? pctFmt(retornoPondUsd) : "—"}</div></div>
          </div>

          <div className="grid g3 mb">
            <div className="card">
              <h3><i className="ti ti-world" />Por geografia</h3>
              {byGeo.map((g) => (
                <div key={g.label} style={{ marginBottom: 8 }}>
                  <div className="flex between" style={{ marginBottom: 3, fontSize: 12 }}><span>{g.label}</span><span>{pctFmt(g.value / (totalUsd || 1))}</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: "#08182c", overflow: "hidden" }}><div style={{ width: `${(g.value / (totalUsd || 1)) * 100}%`, height: "100%", background: "var(--blue)" }} /></div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3><i className="ti ti-category" />Por categoria</h3>
              {byCat.map((c) => (
                <div key={c.label} style={{ marginBottom: 8 }}>
                  <div className="flex between" style={{ marginBottom: 3, fontSize: 12 }}><span>{c.label}</span><span>{pctFmt(c.value / (totalUsd || 1))}</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: "#08182c", overflow: "hidden" }}><div style={{ width: `${(c.value / (totalUsd || 1)) * 100}%`, height: "100%", background: "var(--gold)" }} /></div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3><i className="ti ti-shield-half" />Por perfil de risco</h3>
              {byRisco.map((r) => (
                <div key={r.label} style={{ marginBottom: 8 }}>
                  <div className="flex between" style={{ marginBottom: 3, fontSize: 12 }}><span>{r.label}</span><span>{pctFmt(r.value / (totalUsd || 1))}</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: "#08182c", overflow: "hidden" }}><div style={{ width: `${(r.value / (totalUsd || 1)) * 100}%`, height: "100%", background: "var(--green)" }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3><i className="ti ti-list-details" />Detalhamento completo · {items.length} produtos</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>
                  <th>Produto</th><th>Emissor / Gestor</th><th>Categoria</th><th>Sub-categoria</th><th>Geografia</th><th>Ticker</th>
                  <th className="num">Alocação</th><th className="num">Valor</th><th>Risco</th>
                  <th className="num">Retorno USD</th><th className="num">Vol.</th>
                </tr></thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx}>
                      <td style={{ color: "var(--tx)", fontWeight: 600, maxWidth: 220 }}>{i.produto}</td>
                      <td style={{ color: "var(--tx2)" }}>{i.emissor}</td>
                      <td style={{ color: "var(--tx2)" }}>{i.categoria}</td>
                      <td style={{ color: "var(--tx3)", fontSize: 11 }}>{i.subCategoria}</td>
                      <td style={{ color: "var(--tx3)" }}>{i.geografia}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 600 }}>{i.ticker}</td>
                      <td className="num">{pctFmt(i.alocacaoPct)}</td>
                      <td className="num" style={{ color: "var(--tx)", fontWeight: 600 }}>{usd(i.valorUsd)}</td>
                      <td style={{ fontSize: 11, color: "var(--tx2)" }}>{i.perfilRisco}</td>
                      <td className="num" style={{ color: (i.retornoUsdPct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>{i.retornoUsdPct != null ? pctFmt(i.retornoUsdPct) : "—"}</td>
                      <td className="num" style={{ color: "var(--tx3)" }}>{i.volatilidadePct != null ? pctFmt(i.volatilidadePct) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="muted mt" style={{ fontSize: 11 }}>Retorno/volatilidade estimados (média histórica, fonte por produto). Base do modelo: {usd(portfolio.baseValueUsd || 100000)}.</div>
          </div>
        </>
      ) : (
        <div className="card mt">
          <h3><i className="ti ti-list-details" />Posições · {portfolio.positions.length} ativos</h3>
          <table>
            <thead><tr><th>Ativo</th><th className="num">Qtd.</th><th className="num">Preço médio</th><th className="num">Preço atual</th><th className="num">Ganho</th></tr></thead>
            <tbody>
              {portfolio.positions.map((pos, i) => {
                const q = live[pos.ticker];
                const gainPct = q?.price ? ((q.price - pos.avgPrice) / pos.avgPrice) * 100 : null;
                return (
                  <tr key={i}>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{pos.ticker}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{pos.qty.toLocaleString("pt-BR")}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{pos.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="num" style={{ color: "var(--tx)" }}>{q?.price != null ? q.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "…"}</td>
                    <td className="num" style={{ color: gainPct != null ? (gainPct >= 0 ? "var(--green)" : "var(--red)") : "var(--tx3)" }}>{gainPct != null ? (gainPct >= 0 ? "+" : "") + gainPct.toFixed(1) + "%" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="muted mt" style={{ fontSize: 11 }}>Sem detalhamento completo — planilha importada tem só ticker/quantidade/preço médio.</div>
        </div>
      )}
    </div>
  );
}
