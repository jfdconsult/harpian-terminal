"use client";
import { useEffect, useState } from "react";

// Banner top-of-page que aparece SO em user-agents mobile. Aponta pra versao
// mobile local (LAN). Nao redireciona automaticamente porque IPs LAN sao
// especificos do momento — usuario decide.

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

export default function MobileHint() {
  const [show, setShow] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string>("");

  useEffect(() => {
    if (!isMobileUA()) return;
    // Dismissed nessa sessao?
    if (sessionStorage.getItem("mobile_hint_dismissed") === "1") return;
    // URL do mobile em prod. Default: harpian-mobile-next.vercel.app.
    // Override via env NEXT_PUBLIC_MOBILE_URL se mudar de host.
    const url = process.env.NEXT_PUBLIC_MOBILE_URL || "https://harpian-mobile-next.vercel.app";
    setMobileUrl(url);
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      background: "var(--gold, #c8a84e)", color: "#0a0e1a",
      padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 13, fontWeight: 600, zIndex: 9999,
      boxShadow: "0 2px 8px rgba(0,0,0,.4)",
    }}>
      <span style={{ fontSize: 16 }}>📱</span>
      <div style={{ flex: 1, lineHeight: 1.35 }}>
        Você está no celular. Prefere a versão mobile?
        {mobileUrl ? (
          <a href={mobileUrl} style={{ marginLeft: 6, textDecoration: "underline", color: "#0a0e1a" }}>
            Abrir mobile →
          </a>
        ) : (
          <span style={{ marginLeft: 6, opacity: .7 }}>
            (URL mobile ainda não configurada)
          </span>
        )}
      </div>
      <button
        onClick={() => { sessionStorage.setItem("mobile_hint_dismissed", "1"); setShow(false); }}
        style={{
          background: "transparent", border: "1px solid rgba(10,14,26,.4)",
          color: "#0a0e1a", padding: "4px 10px", borderRadius: 6,
          fontSize: 12, fontWeight: 700, minHeight: 28, minWidth: 28,
        }}
      >✕</button>
    </div>
  );
}
