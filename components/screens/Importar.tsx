"use client";
import { useState } from "react";

export default function Importar() {
  const [over, setOver] = useState(false);
  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Importar</b></div>
      <div className="h1">Importar / conectar</div>
      <div className="sub">Fase 1: ler a pasta de portfólios. Fase 2: API do sistema gerencial.</div>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); }}
        className="placeholder"
        style={{ padding: 48, borderColor: over ? "var(--gold)" : "var(--line2)", background: over ? "rgba(201,160,44,.05)" : "var(--panel2)", transition: "all .15s" }}
      >
        <i className="ti ti-upload" style={{ fontSize: 34 }} />
        <b style={{ fontSize: 15 }}>Arraste a planilha do cliente aqui</b>
        <div className="muted mt">Excel / CSV · ou conecte uma pasta do MFO</div>
        <div className="chips">
          <span className="chip">pasta de portfólios</span>
          <span className="chip">Excel / CSV</span>
          <span className="chip">API (fase 2)</span>
        </div>
      </div>

      <div className="grid g3 mt">
        <div className="card"><h3><i className="ti ti-file-spreadsheet" />Planilha</h3><div className="muted">Modelo padrão de carteira (colunas: ativo, quantidade, preço médio).</div><div className="mt"><button className="btn ghost"><i className="ti ti-download" />Baixar modelo</button></div></div>
        <div className="card"><h3><i className="ti ti-folder" />Pasta do MFO</h3><span className="tag o">a configurar</span><div className="muted mt">Leitura automática dos portfólios exportados.</div></div>
        <div className="card"><h3><i className="ti ti-plug" />API gerencial</h3><span className="tag b">fase 2</span><div className="muted mt">Sincronização direta com o sistema do escritório.</div></div>
      </div>
    </div>
  );
}
