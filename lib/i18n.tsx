"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Lang = "pt" | "en";

const dict: Record<string, Record<Lang, string>> = {
  "painel": { pt: "Painel", en: "Dashboard" },
  "fundo": { pt: "Fundo", en: "Fund" },
  "cotacoes": { pt: "Cotações", en: "Quotes" },
  "regime": { pt: "Regime", en: "Regime" },
  "noticias": { pt: "Notícias", en: "News" },
  "risco": { pt: "Risco", en: "Risk" },
  "clientes": { pt: "Clientes", en: "Clients" },
  "configuracoes": { pt: "Configurações", en: "Settings" },
  "tema": { pt: "Tema", en: "Theme" },
  "idioma": { pt: "Idioma", en: "Language" },
  "notificacoes": { pt: "Notificações", en: "Notifications" },
  "tema_navy": { pt: "Navy (Padrão)", en: "Navy (Default)" },
  "tema_light": { pt: "Claro", en: "Light" },
  "tema_dark": { pt: "Escuro", en: "Dark" },
  "portugues": { pt: "Português", en: "Portuguese" },
  "ingles": { pt: "Inglês", en: "English" },
  "email_matinal": { pt: "Email matinal", en: "Morning email" },
  "email_matinal_desc": { pt: "Receba lista de tarefas, notícias e calendário econômico.", en: "Receive task list, news and economic calendar." },
  "horario_envio": { pt: "Horário de envio", en: "Send time" },
  "fuso_horario": { pt: "Fuso horário", en: "Timezone" },
  "salvar": { pt: "Salvar", en: "Save" },
  "fechar": { pt: "Fechar", en: "Close" },
  "email_placeholder": { pt: "seu@email.com", en: "your@email.com" },
  "notif_salvas": { pt: "Configurações salvas!", en: "Settings saved!" },
  "detectado_auto": { pt: "Detectado automaticamente", en: "Auto-detected" },
  "calendario_fed": { pt: "CALENDÁRIO FED", en: "FED CALENDAR" },
  "social_radar": { pt: "SOCIAL RADAR", en: "SOCIAL RADAR" },
  "mercado": { pt: "Mercado", en: "Market" },
  "inteligencia": { pt: "Intelligence", en: "Intelligence" },
  "admin": { pt: "Admin", en: "Admin" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "pt", setLang: () => {}, t: (k) => k });

const STORAGE_KEY = "harpian-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && ["pt", "en"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = useCallback((key: string): string => {
    return dict[key]?.[lang] ?? key;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
