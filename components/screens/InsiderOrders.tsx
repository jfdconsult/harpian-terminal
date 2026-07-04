"use client";
import { useState, useEffect } from "react";
import { IO_DATA, fmtN, fmtUSD } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

export default function InsiderOrders() {
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");

  const items = IO_DATA.filter((x) => {
    if (type !== "all" && x.type !== type) return false;
    if (role !== "all" && x.role !== role) return false;
    return true;
  });

  // Publica pro JIM exatamente as transações visíveis na tela.
  useEffect(() => {
    const buys = items.filter((x) => x.type === "Purchase").length;
    const sells = items.length - buys;
    const topBuy = items.find((x) => x.type === "Purchase");
    publishScreenData(
      "insider-orders",
      "Insider & Executive Orders (SEC Form 4): compras e vendas de insiders (CEO/CFO/Diretor/10%+). Cada linha = data, insider, cargo, empresa, ticker, tipo (Purchase/Sale), nº de ações e valor em USD.",
      items.map((x) => ({
        date: x.date, insider: x.insider, role: x.role, company: x.company,
        ticker: x.ticker, type: x.type, shares: x.shares, valueUSD: x.value,
      })),
      {
        briefing:
          `Você está vendo ${items.length} filings de insiders (SEC Form 4): **${buys} compras** e **${sells} vendas**. ` +
          `Compras de insider são historicamente sinal de alta; vendas costumam ser rebalanceamento pessoal.`,
        suggestions: [
          "Quais foram as compras de insiders?",
          topBuy ? `O que a compra em ${topBuy.ticker} sinaliza?` : "Compra de insider é sinal de alta?",
          "Algum executivo vendendo em peso?",
        ],
      }
    );
  }, [items]);

  return (
    <div className="screen">
      <div className="crumb">Intelligence › <b>Insider Orders</b></div>
      <div className="h1">Insider &amp; Executive Orders</div>
      <div className="sub">SEC Form 4 · Compras e vendas de diretores, presidentes e acionistas relevantes.</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel">Tipo:</span>
        <select className="fsel" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Todos</option>
          <option value="Purchase">Compras</option>
          <option value="Sale">Vendas</option>
        </select>
        <select className="fsel" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">Todos os cargos</option>
          <option value="CEO">CEO</option>
          <option value="CFO">CFO</option>
          <option value="Director">Director</option>
          <option value="10% Owner">10%+ Owner</option>
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {items.length} filing{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="card">
        <div style={{ maxHeight: 600, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Insider</th><th>Role</th><th>Company</th><th>Ticker</th>
                <th style={{ textAlign: "center" }}>Type</th><th className="num">Shares</th><th className="num">Value (USD)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x, i) => {
                const tc = x.type === "Purchase" ? "var(--green)" : "var(--red)";
                return (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)" }}>{x.date}</td>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{x.insider}</td>
                    <td style={{ color: "var(--tx2)" }}>{x.role}</td>
                    <td style={{ color: "var(--tx2)" }}>{x.company}</td>
                    <td style={{ fontWeight: 600, color: "var(--gold)" }}>{x.ticker}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: tc }}>{x.type}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.shares)}</td>
                    <td className="num" style={{ color: tc, fontWeight: 600 }}>{fmtUSD(x.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
