"use client";
import { useEffect, useState } from "react";
import { CLIENTS, type Client } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import { fetchCalendar, type CalendarResp } from "@/lib/calendar";
import { fetchNews, type NewsHeadline } from "@/lib/feeds";
import type { ScreenId } from "@/lib/nav";
import { useI18n } from "@/lib/i18n";

const TR = {
  title: { pt: "Alertas", en: "Alerts" },
  subtitle: {
    pt: "O que precisa de ação — risco de cliente, notícias de alto impacto e o calendário econômico.",
    en: "What needs action — client risk, high-impact news, and the economic calendar.",
  },
  aboveMandate: { pt: "portfólio {r} acima do mandato {m}", en: "portfolio {r} above mandate {m}" },
  forecast: { pt: "previsão", en: "forecast" },
  previous: { pt: "anterior", en: "previous" },
  today: { pt: "hoje", en: "today" },
  tomorrow: { pt: "amanhã", en: "tomorrow" },
  now: { pt: "agora", en: "now" },
  emptyTitle: { pt: "Nada exigindo ação no momento", en: "Nothing requiring action right now" },
  emptyNoClient: { pt: "Nenhum cliente fora do mandato", en: "No client outside their mandate" },
  emptyCalUnavailable: { pt: " · calendário indisponível no momento", en: " · calendar unavailable right now" },
  emptyNoEvents: { pt: " e nenhum evento de alto impacto à frente.", en: " and no high-impact events ahead." },
  emptyPeriod: { pt: ".", en: "." },
  footer: {
    pt: "Risco recalculado a partir dos portfólios · notícias do feed JD News · calendário econômico do Investing.com. Clique para abrir o cliente, a notícia ou a tela de mercado.",
    en: "Risk recalculated from portfolios · news from the JD News feed · economic calendar from Investing.com. Click to open the client, the news item, or the market screen.",
  },
  briefingCount: { pt: "Você tem {n} alerta(s)", en: "You have {n} alert(s)" },
  briefingCritical: { pt: ", **{n} crítico(s)**.", en: ", **{n} critical**." },
  briefingPeriod: { pt: ".", en: "." },
  briefingBreakdown: { pt: "{r} risco de cliente, {n} notícias e {e} calendário.", en: "{r} client risk, {n} news, and {e} calendar." },
  briefingUrgent: { pt: ' Mais urgente: "{x}".', en: ' Most urgent: "{x}".' },
  sugg1: { pt: "Qual alerta é mais urgente?", en: "Which alert is most urgent?" },
  sugg2: { pt: "O que exige minha ação hoje?", en: "What requires my action today?" },
  sugg3: { pt: "Quais dados saem esta semana?", en: "What data comes out this week?" },
} as const;

// Alerts = client risk (computed from portfolios) + market (real economic
// calendar + high-impact news).
//
// Before, the market alerts were two hardcoded items in the code —
// "Fed signals higher rates... 2h ago" and "CPI tomorrow 08:30 ET" — with a
// hand-written relative time that never matched any actual time. It looked
// like a live feed but had been static since day one.

interface Alert {
  level: "critical" | "watch" | "info";
  text: string;
  when: string;
  go?: ScreenId;
  param?: string;
  url?: string;
}

// "07/16 08:30 ET" → "today 08:30 ET" / "tomorrow 08:30 ET" / "07/16 08:30 ET"
function quando(iso: string, date: string, time: string, t: (k: keyof typeof TR) => string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const dia = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const amanha = new Date(hoje.getTime() + 86400000);
  if (dia(d) === dia(hoje)) return `${t("today")} ${time}`;
  if (dia(d) === dia(amanha)) return `${t("tomorrow")} ${time}`;
  return `${date} ${time}`;
}

export default function Alertas({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [cal, setCal] = useState<CalendarResp | null>(null);
  const [news, setNews] = useState<NewsHeadline[]>([]);
  // Seed no SSR, allClients() (localStorage) no cliente — mesmo padrão de
  // Clientes.tsx. Antes esta tela lia a seed direto, então cliente cadastrado
  // em runtime nunca gerava alerta de risco.
  const [clients, setClients] = useState<Client[]>(CLIENTS);

  useEffect(() => {
    setClients(allClients());
    fetchCalendar().then(setCal).catch(() => setCal({ ok: false, events: [] }));
    fetchNews().then((d) => setNews(d.headlines || [])).catch(() => {});
  }, []);

  const risco: Alert[] = clients
    .filter((c) => c.riskNumber > c.mandate)
    .map((c) => ({
      level: c.riskNumber - c.mandate >= 10 ? ("critical" as const) : ("watch" as const),
      text: `${c.name} — ${t("aboveMandate").replace("{r}", String(c.riskNumber)).replace("{m}", String(c.mandate))}`,
      when: t("today"),
      go: "cliente" as ScreenId,
      param: c.id,
    }));

  // Market: upcoming high-impact events, from the real calendar.
  const eventos: Alert[] = (cal?.events || [])
    .filter((e) => e.importance === 3)
    .slice(0, 4)
    .map((e) => ({
      level: "info" as const,
      text: `${e.event}${e.forecast ? ` — ${t("forecast")} ${e.forecast}` : ""}${e.previous ? `, ${t("previous")} ${e.previous}` : ""}`,
      when: quando(e.datetime, e.date, e.time, t),
      go: "regime" as ScreenId,
    }));

  // Market-moving news, from the real feed.
  const noticias: Alert[] = news
    .filter((n) => n.impact === "Market Moving")
    .slice(0, 3)
    .map((n) => ({
      level: "watch" as const,
      text: n.headline.slice(0, 110) + (n.headline.length > 110 ? "…" : ""),
      when: n.source || t("now"),
      url: n.url,
    }));

  const all = [...risco, ...noticias, ...eventos];
  const tag = (l: Alert["level"]) => (l === "critical" ? "r" : l === "watch" ? "o" : "b");

  useEffect(() => {
    const criticos = all.filter((a) => a.level === "critical").length;
    publishScreenData(
      "alertas",
      "Alerts hub: client risk (portfolio above mandate), high-impact news (real feed), and upcoming events from the real economic calendar (Investing.com).",
      all.map((a) => ({ nivel: a.level, texto: a.text, quando: a.when })),
      {
        briefing:
          t("briefingCount").replace("{n}", String(all.length)) +
          (criticos ? t("briefingCritical").replace("{n}", String(criticos)) : t("briefingPeriod")) +
          " " + t("briefingBreakdown").replace("{r}", String(risco.length)).replace("{n}", String(noticias.length)).replace("{e}", String(eventos.length)) +
          (all[0] ? t("briefingUrgent").replace("{x}", all[0].text) : ""),
        suggestions: [
          t("sugg1"),
          t("sugg2"),
          t("sugg3"),
        ],
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, risco.length, eventos.length, noticias.length]);

  function abrir(a: Alert) {
    if (a.url) window.open(a.url, "_blank", "noopener,noreferrer");
    else if (a.go) go(a.go, a.param);
  }

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <div className="card">
        {all.length === 0 ? (
          <div className="placeholder" style={{ padding: 30 }}>
            <i className="ti ti-checks" style={{ fontSize: 26, color: "var(--green)" }} />
            <b style={{ display: "block", marginTop: 8 }}>{t("emptyTitle")}</b>
            <div className="muted" style={{ marginTop: 4 }}>
              {t("emptyNoClient")}{cal && !cal.ok ? t("emptyCalUnavailable") : ""}
              {cal?.ok ? t("emptyNoEvents") : t("emptyPeriod")}
            </div>
          </div>
        ) : (
          all.map((a, i) => (
            <div className="kv" key={i} style={{ cursor: a.go || a.url ? "pointer" : "default" }} onClick={() => abrir(a)}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`tag ${tag(a.level)}`}>{a.level}</span>
                <span style={{ color: "var(--tx)" }}>{a.text}</span>
              </span>
              <span className="muted" style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                {a.when}{(a.go || a.url) && <i className="ti ti-chevron-right" />}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="muted mt" style={{ fontSize: 11 }}>
        {t("footer")}
      </div>
    </div>
  );
}
