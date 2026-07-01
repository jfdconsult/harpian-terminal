"use client";
import { CLIENTS, brl } from "@/lib/clients";
import type { ScreenId } from "@/lib/nav";

export default function Clientes({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const totalAUM = CLIENTS.reduce((s, c) => s + c.current, 0);
  const avgHarpian = Math.round(CLIENTS.reduce((s, c) => s + c.harpianPct, 0) / CLIENTS.length);
  const foraMandato = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;

  const stats = [
    { v: brl(totalAUM), l: "AUM total sob visão" },
    { v: String(CLIENTS.length), l: "Clientes" },
    { v: avgHarpian + "%", l: "Alocação Harpian média" },
    { v: String(foraMandato), l: "Fora do mandato", tone: foraMandato > 0 ? "r" : "g" },
  ];

  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Lista</b></div>
      <div className="flex between mb">
        <div><div className="h1">Meus clientes</div><div className="sub" style={{ margin: 0 }}>Carteiras lidas das pastas do MFO (fase 2: via API do sistema gerencial).</div></div>
      </div>

      <div className="grid g4 mb">
        {stats.map((s, i) => (
          <div className="card" key={i} style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: s.tone === "r" ? "var(--red)" : s.tone === "g" ? "var(--green)" : "var(--gold)" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>Cliente</th><th>Tipo</th><th>Início</th><th className="num">Investido</th><th className="num">Atual</th>
              <th className="num">Ganho</th><th className="num">Risk Nº</th><th>Alinhamento</th><th></th>
            </tr></thead>
            <tbody>
              {CLIENTS.map((c) => {
                const ganho = c.current - c.invested;
                const ganhoPct = (c.current / c.invested - 1) * 100;
                const aligned = c.riskNumber <= c.mandate;
                return (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => go("cliente", c.id)}>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{c.name}</td>
                    <td style={{ color: "var(--tx2)" }}>{c.type}</td>
                    <td style={{ color: "var(--tx3)" }}>{c.since}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{brl(c.invested)}</td>
                    <td className="num" style={{ color: "var(--tx)" }}>{brl(c.current)}</td>
                    <td className="num pos">+{ganhoPct.toFixed(1).replace(".", ",")}%</td>
                    <td className="num" style={{ color: aligned ? "var(--tx2)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                    <td>{aligned
                      ? <span className="tag g">dentro</span>
                      : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--tx3)" }}><i className="ti ti-chevron-right" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted mt" style={{ fontSize: 11 }}>Alinhamento = Número de Risco do portfólio vs. teto do mandato. Clique numa linha para abrir a carteira.</div>
      </div>
    </div>
  );
}
