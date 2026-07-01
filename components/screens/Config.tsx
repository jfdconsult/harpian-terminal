"use client";

const USERS = [
  { name: "João Daniel", role: "Diretor", tag: "admin" },
  { name: "Mesa de operações", role: "Trading", tag: "operador" },
  { name: "Back office", role: "Liquidação", tag: "leitura" },
];

export default function Config() {
  return (
    <div className="screen">
      <div className="crumb">Ajustes › <b>Configurações</b></div>
      <div className="h1">Configurações</div>
      <div className="sub">Conta, usuários e preferências.</div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-building" />Conta</h3>
          <div className="kv"><span className="muted">Organização</span><span className="v">HARPIAN Capital</span></div>
          <div className="kv"><span className="muted">Tipo</span><span className="v">Family Office / MFO</span></div>
          <div className="kv"><span className="muted">Plano</span><span className="v" style={{ color: "var(--gold)" }}>Institucional</span></div>
          <div className="kv"><span className="muted">Endereço</span><span className="v" style={{ fontSize: 11 }}>601 Brickell Key Dr · Miami</span></div>
        </div>

        <div className="card">
          <h3><i className="ti ti-adjustments" />Preferências</h3>
          <div className="kv"><span className="muted">Moeda de exibição</span><span className="v">USD</span></div>
          <div className="kv"><span className="muted">Idioma</span><span className="v">Português (BR)</span></div>
          <div className="kv"><span className="muted">Tema</span><span className="v">Institucional (navy/ouro)</span></div>
          <div className="kv"><span className="muted">Fuso</span><span className="v">America/Sao_Paulo</span></div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h3><i className="ti ti-users" />Usuários &amp; permissões</h3>
          <table>
            <thead><tr><th>Usuário</th><th>Função</th><th>Permissão</th></tr></thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.name}>
                  <td style={{ color: "var(--tx)", fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--tx2)" }}>{u.role}</td>
                  <td><span className={`tag ${u.tag === "admin" ? "g" : u.tag === "operador" ? "o" : "b"}`}>{u.tag}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="muted mt" style={{ fontSize: 11 }}>Gestão de usuários e permissões finas entram na fase 2.</div>
    </div>
  );
}
