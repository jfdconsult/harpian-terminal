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

const TR = {
  themeInstitutional: { pt: "Institucional (marinho/dourado)", en: "Institutional (navy/gold)" },
  themeLight: { pt: "Claro", en: "Light" },
  themeDark: { pt: "Escuro", en: "Dark" },
  langPt: { pt: "Português (BR)", en: "Português (BR)" },
  langEn: { pt: "English (US)", en: "English (US)" },
  settingsTitle: { pt: "Configurações", en: "Settings" },
  settingsSub: { pt: "Conta e preferências. O que você mudar aqui se aplica a todo o terminal, imediatamente.", en: "Account and preferences. Whatever you change here applies to the whole terminal, immediately." },
  account: { pt: "Conta", en: "Account" },
  organization: { pt: "Organização", en: "Organization" },
  type: { pt: "Tipo", en: "Type" },
  familyOfficeMfo: { pt: "Family Office / MFO", en: "Family Office / MFO" },
  plan: { pt: "Plano", en: "Plan" },
  institutional: { pt: "Institucional", en: "Institutional" },
  address: { pt: "Endereço", en: "Address" },
  preferences: { pt: "Preferências", en: "Preferences" },
  theme: { pt: "Tema", en: "Theme" },
  language: { pt: "Idioma", en: "Language" },
  displayCurrency: { pt: "Moeda de exibição", en: "Display currency" },
  browserTimezone: { pt: "Fuso horário do navegador", en: "Browser timezone" },
  usersPermissions: { pt: "Usuários e permissões", en: "Users & permissions" },
  notYetImplemented: { pt: "Ainda não implementado", en: "Not yet implemented" },
  usersDetail: { pt: "Não há login ou backend de usuários no terminal hoje — quem abre, abre tudo. Controle de acesso e permissões granulares chegam junto com a autenticação, na fase 2.", en: "There's no login or user backend in the terminal today — whoever opens it, opens everything. Access control and fine-grained permissions arrive together with authentication, in phase 2." },
} as const;
type TKey = keyof typeof TR;

const THEME_LABEL: Record<ThemeId, { pt: string; en: string }> = {
  navy: TR.themeInstitutional,
  light: TR.themeLight,
  dark: TR.themeDark,
};
const LANG_LABEL: Record<Lang, { pt: string; en: string }> = { pt: TR.langPt, en: TR.langEn };

export default function Config() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [tz, setTz] = useState("—");

  useEffect(() => {
    // Real timezone from the user's browser, not a fixed string.
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { setTz("—"); }
  }, []);

  useEffect(() => {
    publishScreenData(
      "config",
      "Terminal settings: account (organization, plan) and real preferences (theme and language currently applied, browser timezone). User/permission management doesn't exist yet — there's no user backend.",
      { moeda: "USD", idioma: LANG_LABEL[lang].en, tema: THEME_LABEL[theme].en, fuso: tz, plano: "Institucional", usuarios: "não implementado (fase 2)" },
      {
        briefing:
          `Settings: Institutional plan, display in USD, theme **${THEME_LABEL[theme].en}**, language **${LANG_LABEL[lang].en}**, timezone ${tz}. ` +
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
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("settingsTitle")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("settingsSub")}</div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-building" />{t("account")}</h3>
          <div className="kv"><span className="muted">{t("organization")}</span><span className="v">HARPIAN Capital</span></div>
          <div className="kv"><span className="muted">{t("type")}</span><span className="v">{t("familyOfficeMfo")}</span></div>
          <div className="kv"><span className="muted">{t("plan")}</span><span className="v" style={{ color: "var(--gold)" }}>{t("institutional")}</span></div>
          <div className="kv"><span className="muted">{t("address")}</span><span className="v" style={{ fontSize: 11 }}>601 Brickell Key Dr · Miami</span></div>
        </div>

        <div className="card">
          <h3><i className="ti ti-adjustments" />{t("preferences")}</h3>

          <div className="kv">
            <span className="muted">{t("theme")}</span>
            <span style={{ display: "flex", gap: 4 }}>
              {(["navy", "light", "dark"] as ThemeId[]).map((id) => (
                <button key={id} onClick={() => setTheme(id)} style={{
                  fontFamily: "var(--mono)", fontSize: 10, padding: "3px 9px", borderRadius: 4, cursor: "pointer",
                  border: `1px solid ${theme === id ? "rgba(201,160,44,.5)" : "var(--line2)"}`,
                  background: theme === id ? "rgba(201,160,44,.15)" : "transparent",
                  color: theme === id ? "var(--gold)" : "var(--tx3)",
                }}>{THEME_LABEL[id][lang].split(" ")[0]}</button>
              ))}
            </span>
          </div>

          <div className="kv">
            <span className="muted">{t("language")}</span>
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

          <div className="kv"><span className="muted">{t("displayCurrency")}</span><span className="v">USD</span></div>
          <div className="kv"><span className="muted">{t("browserTimezone")}</span><span className="v" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{tz}</span></div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1", borderStyle: "dashed" }}>
          <h3><i className="ti ti-users" />{t("usersPermissions")}</h3>
          <div className="placeholder" style={{ padding: "20px 10px" }}>
            <i className="ti ti-lock" style={{ fontSize: 24, color: "var(--tx3)" }} />
            <b style={{ display: "block", marginTop: 8 }}>{t("notYetImplemented")}</b>
            <div className="muted" style={{ marginTop: 4, maxWidth: 520, margin: "4px auto 0", lineHeight: 1.6 }}>
              {t("usersDetail")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
