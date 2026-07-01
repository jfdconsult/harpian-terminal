"use client";
import { useEffect, useState } from "react";
import { MENUS, type ScreenId } from "@/lib/nav";

function Clock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("pt-BR"));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <div className="clock">{t}</div>;
}

export default function Topbar({ go }: { go: (id: ScreenId, param?: string) => void }) {
  return (
    <div className="topbar">
      <div className="brand" onClick={() => go("painel")}>
        <div className="lg">H</div>HARPIAN<span className="sub">ETP TERMINAL</span>
      </div>

      {MENUS.map((m) => (
        <div className="menu" key={m.label}>
          {m.direct ? (
            <div className="mtab" onClick={() => go(m.direct!)}>
              <i className={`ti ${m.icon}`} />{m.label}
            </div>
          ) : (
            <div className="mtab">
              <i className={`ti ${m.icon}`} />{m.label}
              <i className="ti ti-chevron-down" style={{ fontSize: 13 }} />
            </div>
          )}
          {m.columns && (
            <div className={`dropdown${m.wide ? " wide" : ""}`}>
              {m.columns.map((col, ci) => (
                <div className="dd-col" key={ci} style={{ flex: 1 }}>
                  {col.label && <div className="dd-label">{col.label}</div>}
                  {col.items.map((it, ii) => (
                    <div className="dd-item" key={ii} onClick={() => go(it.id, it.param)}>
                      <i className={`ti ${it.icon}`} />{it.label}
                      {it.tag && <span className="tag g" style={{ marginLeft: "auto" }}>{it.tag}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="right">
        <div className="jim"><i className="ti ti-sparkles" />Jim AI</div>
        <div className="pillstate"><span className="dot" />RISK-ON · DEFESA ARMADA</div>
        <Clock />
      </div>
    </div>
  );
}
