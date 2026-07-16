"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";
import { useTheme, type ThemeId } from "@/lib/theme";
import { useI18n, type Lang } from "@/lib/i18n";

// Preferences now reflect (and change) the terminal's real state — theme and
// language come from the providers, not from fixed text. This screen used to
// claim "Theme: Institutional (navy/gold)" and "Language: Portuguese (BR)" as
// hardcoded text, even while the user was on the light theme and in English.
//
// The users table no longer exists: it was a fixed array presented as a live
// permissions directory, while the footer said user management was phase 2.
// There is no user backend — so the screen says exactly that.

const THEME_LABEL: Record<ThemeId, string> = {
  navy: "Institutional (navy/gold)",
  light: "Light",
  dark: "Dark",
};
const LANG_LABEL: Record<Lang, string> = { pt: "Português (BR)", en: "English (US)" };

export default function Config() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const [tz, setTz] = useState("—");

  useEffect(() => {
    // Real timezone from the user's browser, not a fixed string.
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { setTz("—"); }
  }, []);

  useEffect(() => {
    publishScreenData(
      "config",
      "Terminal settings: account (organization, plan) and real preferences (theme and language currently applied, browser timezone). User/permission management doesn't exist yet — there's no user backend.",
      { moeda: "USD", idioma: LANG_LABEL[lang], tema: THEME_LABEL[theme], fuso: tz, plano: "Institucional", usuarios: "não implementado (fase 2)" },
      {
        briefing:
          `Settings: Institutional plan, display in USD, theme **${THEME_LABEL[theme]}**, language **${LANG_LABEL[lang]}**, timezone ${tz}. ` +
          `User and permission management doesn't exist yet — it's coming in phase 2, along with login.`,
        suggestions: [
          "How do I change the theme or language?",
          "When is user control coming?",
          "Can I display in BRL?",
        ],
      }
    );
  }, [theme, lang, tz]);

  return (
    <div className="screen">
      <div className="crumb">Settings › <b>Settings</b></div>
      <div className="h1">Settings</div>
      <div className="sub">Account and preferences. Whatever you change here applies to the whole terminal, immediately.</div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-building" />Account</h3>
          <div className="kv"><span className="muted">Organization</span><span className="v">HARPIAN Capital</span></div>
          <div className="kv"><span className="muted">Type</span><span className="v">Family Office / MFO</span></div>
          <div className="kv"><span className="muted">Plan</span><span className="v" style={{ color: "var(--gold)" }}>Institutional</span></div>
          <div className="kv"><span className="muted">Address</span><span className="v" style={{ fontSize: 11 }}>601 Brickell Key Dr · Miami</span></div>
        </div>

        <div className="card">
          <h3><i className="ti ti-adjustments" />Preferences</h3>

          <div className="kv">
            <span className="muted">Theme</span>
            <span style={{ display: "flex", gap: 4 }}>
              {(["navy", "light", "dark"] as ThemeId[]).map((id) => (
                <button key={id} onClick={() => setTheme(id)} style={{
                  fontFamily: "var(--mono)", fontSize: 10, padding: "3px 9px", borderRadius: 4, cursor: "pointer",
                  border: `1px solid ${theme === id ? "rgba(201,160,44,.5)" : "var(--line2)"}`,
                  background: theme === id ? "rgba(201,160,44,.15)" : "transparent",
                  color: theme === id ? "var(--gold)" : "var(--tx3)",
                }}>{THEME_LABEL[id].split(" ")[0]}</button>
              ))}
            </span>
          </div>

          <div className="kv">
            <span className="muted">Language</span>
            <span style={{ display: "flex", gap: 4 }}>
              {(["pt", "en"] as Lang[]).map((id) => (
                <button key={id} onClick={() => setLang(id)} style={{
                  fontFamily: "var(--mono)", fontSize: 10, padding: "3px 9px", borderRadius: 4, cursor: "pointer",
                  border: `1px solid ${lang === id ? "rgba(201,160,44,.5)" : "var(--line2)"}`,
                  background: lang === id ? "rgba(201,160,44,.15)" : "transparent",
                  color: lang === id ? "var(--gold)" : "var(--tx3)",
                }}>{id.toUpperCase()}</button>
              ))}
            </span>
          </div>

          <div className="kv"><span className="muted">Display currency</span><span className="v">USD</span></div>
          <div className="kv"><span className="muted">Browser timezone</span><span className="v" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{tz}</span></div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1", borderStyle: "dashed" }}>
          <h3><i className="ti ti-users" />Users &amp; permissions</h3>
          <div className="placeholder" style={{ padding: "20px 10px" }}>
            <i className="ti ti-lock" style={{ fontSize: 24, color: "var(--tx3)" }} />
            <b style={{ display: "block", marginTop: 8 }}>Not yet implemented</b>
            <div className="muted" style={{ marginTop: 4, maxWidth: 520, margin: "4px auto 0", lineHeight: 1.6 }}>
              There's no login or user backend in the terminal today — whoever opens it, opens everything.
              Access control and fine-grained permissions arrive together with authentication, in phase 2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
