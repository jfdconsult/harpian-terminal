"use client";
import { useEffect, useState } from "react";
import { MENUS, activeMenuFor, type ScreenId } from "@/lib/nav";

function Clock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-US"));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <div className="clock">{t}</div>;
}

export default function Topbar({ go, screen, jimOpen, onJimToggle, onSettingsToggle }: { go: (id: ScreenId, param?: string) => void; screen: ScreenId; jimOpen?: boolean; onJimToggle?: () => void; onSettingsToggle?: () => void }) {
  const activeMenu = activeMenuFor(screen);
  return (
    <div className="topbar">
      <div className="brand" onClick={() => go("painel")}>
        <img className="brand-logo brand-logo-white" src="/harpian-logo-white.svg" alt="HARPIAN" />
        <img className="brand-logo brand-logo-navy" src="/harpian-logo-navy.svg" alt="HARPIAN" />
      </div>

      {MENUS.map((m) => {
        const isActive = m.label === activeMenu;
        return (
        <div className="menu" key={m.label}>
          {m.direct ? (
            <div className={`mtab${isActive ? " on" : ""}`} onClick={() => go(m.direct!)}>
              <i className={`ti ${m.icon}`} />{m.label}
            </div>
          ) : (
            <div className={`mtab${isActive ? " on" : ""}`}>
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
      );
      })}

      <div className="right">
        <div className={`jim${jimOpen ? " active" : ""}`} onClick={onJimToggle}><i className="ti ti-sparkles" />Jim AI</div>
        <span className="topbar-sub">ETP TERMINAL</span>
        <div className="jim" onClick={onSettingsToggle} title="Settings"><i className="ti ti-settings" /></div>
        <div className="pillstate"><span className="dot" />RISK-ON · DEFENSE ARMED</div>
        <Clock />
      </div>
    </div>
  );
}
