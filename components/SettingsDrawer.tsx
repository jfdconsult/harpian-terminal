"use client";
import { useState, useEffect } from "react";
import { useTheme, type ThemeId } from "@/lib/theme";
import { useI18n, type Lang } from "@/lib/i18n";
import { getNotifPrefs, saveNotifPrefs, detectTz, getUserEmail, type NotifPrefs } from "@/lib/user-prefs";
import { pushToServer, syncFromServer } from "@/lib/favorites";

const THEMES: { id: ThemeId; icon: string }[] = [
  { id: "navy", icon: "ti-moon-stars" },
  { id: "light", icon: "ti-sun" },
  { id: "dark", icon: "ti-moon" },
];

export default function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [notif, setNotif] = useState<NotifPrefs>({ enabled: false, email: "", hour: "07:00", tz: detectTz() });
  const [saved, setSaved] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    if (open) setNotif(getNotifPrefs());
  }, [open]);

  const saveNotif = () => {
    saveNotifPrefs(notif);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Valid email = advisor identity. Registers on the server (with the
    // current favorites) and pulls back whatever's already there — this is
    // what links cross-device sync and the nightly summary.
    if (getUserEmail()) {
      pushToServer();
      setSyncMsg("Syncing favorites…");
      syncFromServer()
        .then((list) => setSyncMsg(`Favorites synced (${list.length}).`))
        .catch(() => setSyncMsg("Saved locally — server unavailable right now."))
        .finally(() => setTimeout(() => setSyncMsg(""), 4000));
    }
  };

  return (
    <div className={`settings-drawer${open ? " open" : ""}`}>
      <div className="settings-header">
        <h3><i className="ti ti-settings" /> {t("configuracoes")}</h3>
        <button className="settings-close" onClick={onClose}><i className="ti ti-x" /></button>
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <div className="settings-label"><i className="ti ti-palette" /> {t("tema")}</div>
          <div className="theme-grid">
            {THEMES.map((th) => (
              <button
                key={th.id}
                className={`theme-btn theme-btn-${th.id}${theme === th.id ? " active" : ""}`}
                onClick={() => setTheme(th.id)}
              >
                <i className={`ti ${th.icon}`} />
                <span>{t(`tema_${th.id}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label"><i className="ti ti-language" /> {t("idioma")}</div>
          <div className="lang-grid">
            <button className={`lang-btn${lang === "pt" ? " active" : ""}`} onClick={() => setLang("pt")}>
              <span className="lang-flag">🇧🇷</span> {t("portugues")}
            </button>
            <button className={`lang-btn${lang === "en" ? " active" : ""}`} onClick={() => setLang("en")}>
              <span className="lang-flag">🇺🇸</span> {t("ingles")}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label"><i className="ti ti-bell" /> {t("notificacoes")}</div>
          <div className="notif-block">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notif.enabled}
                onChange={(e) => setNotif({ ...notif, enabled: e.target.checked })}
              />
              <span className="toggle-label">{t("email_matinal")}</span>
            </label>
            <p className="notif-desc">{t("email_matinal_desc")}</p>

            {notif.enabled && (
              <div className="notif-fields">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder={t("email_placeholder")}
                  value={notif.email}
                  onChange={(e) => setNotif({ ...notif, email: e.target.value })}
                />

                <label className="field-label">{t("horario_envio")}</label>
                <input
                  type="time"
                  className="field-input"
                  value={notif.hour}
                  onChange={(e) => setNotif({ ...notif, hour: e.target.value })}
                />

                <label className="field-label">{t("fuso_horario")}</label>
                <div className="tz-auto">
                  <i className="ti ti-map-pin" />
                  <span>{notif.tz}</span>
                  <span className="tz-badge">{t("detectado_auto")}</span>
                </div>

                <button className="save-btn" onClick={saveNotif}>
                  <i className="ti ti-check" /> {t("salvar")}
                </button>
                {saved && <div className="saved-toast">{t("notif_salvas")}</div>}
                {syncMsg && <div className="notif-desc" style={{ marginTop: 6 }}><i className="ti ti-cloud-check" style={{ marginRight: 4 }} />{syncMsg}</div>}
                <p className="notif-desc" style={{ marginTop: 8 }}>
                  With your email saved, your favorites are now stored on the server
                  (they survive clearing the cache and carry over to any device) and you
                  receive the daily summary by email.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
