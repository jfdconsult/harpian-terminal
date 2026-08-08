"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GOV_API } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

interface FilingResult { company?: string; cik?: string; form_type?: string; filed_at?: string; accession?: string; document_url?: string; }
interface SearchResponse { query: string; forms?: string; total?: number; total_is_lower_bound?: boolean; n: number; results: FilingResult[]; source?: string; error?: string; }

const COMMON_FORMS = ["", "10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13D", "13G"];

const TR = {
  title: { pt: "Busca de Processos (Filings)", en: "Filings Search" },
  subtitle: { pt: "SEC EDGAR Full-Text Search · Busca por palavra-chave em 10-K/10-Q/8-K/etc desde 2001.", en: "SEC EDGAR Full-Text Search · Keyword search across 10-K/10-Q/8-K/etc since 2001." },
  placeholder: { pt: 'ex: "stock buyback", "material weakness"', en: 'ex: "stock buyback", "material weakness"' },
  formLabel: { pt: "Formulário:", en: "Form:" },
  all: { pt: "Todos", en: "All" },
  searching: { pt: "Buscando…", en: "Searching…" },
  search: { pt: "Buscar", en: "Search" },
  offline: { pt: "API gov-data offline. Rode ", en: "gov-data API offline. Run " },
  offlineSuffix: { pt: " (porta 8877) para ver dados reais.", en: " (port 8877) to see real data." },
  results: { pt: "resultados", en: "results" },
  outOfTotal: { pt: "de ~", en: "out of ~" },
  date: { pt: "Data", en: "Date" },
  company: { pt: "Empresa", en: "Company" },
  form: { pt: "Formulário", en: "Form" },
  document: { pt: "Documento", en: "Document" },
  open: { pt: "abrir", en: "open" },
  enterAndSearch: { pt: "Digite uma busca e clique em Buscar.", en: "Enter a search and click Search." },
} as const;

export default function FilingsSearch() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [query, setQuery] = useState("");
  const [forms, setForms] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = () => {
    if (!query || query.length < 2) return;
    setLoading(true);
    const params = new URLSearchParams({ q: query });
    if (forms) params.set("forms", forms);
    fetch(`${GOV_API}/api/filings/search?${params}`)
      .then((r) => r.json())
      .then((d: SearchResponse) => {
        setData(d);
        setOffline(false);
        if (d.results?.length) {
          publishScreenData(
            "filings-search",
            `SEC EDGAR full-text search for "${d.query}" (forms: ${d.forms || "all"}) — ${d.n} results out of ~${d.total} total.`,
            { query: d.query, results: d.results.slice(0, 20) },
            {
              briefing: `Search "${d.query}" returned ${d.n} visible filings (out of ~${d.total}${d.total_is_lower_bound ? "+" : ""} total).`,
              suggestions: [`Which companies mentioned "${d.query}" in a recent 8-K?`, "Filter to 10-K only"],
            }
          );
        }
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  };

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <input
          className="fsel" style={{ minWidth: 260, fontSize: 12, padding: "6px 10px" }}
          placeholder={t("placeholder")}
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
        />
        <span className="flabel">{t("formLabel")}</span>
        <select className="fsel" style={{ fontSize: 12, padding: "6px 10px" }} value={forms} onChange={(e) => setForms(e.target.value)}>
          {COMMON_FORMS.map((f) => (<option key={f} value={f}>{f || t("all")}</option>))}
        </select>
        <button className="btn ghost" style={{ padding: "6px 14px", fontSize: 11 }} onClick={search} disabled={loading}>
          {loading ? t("searching") : t("search")}
        </button>
      </div>

      {offline ? (
        <div className="placeholder">{t("offline")}<b>python api_server.py</b>{t("offlineSuffix")}</div>
      ) : data?.error ? (
        <div className="placeholder">{data.error}</div>
      ) : data ? (
        <div className="card">
          <h3>{data.n} {t("results")}{data.total ? ` ${t("outOfTotal")}${data.total}${data.total_is_lower_bound ? "+" : ""}` : ""}</h3>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>{t("date")}</th><th>{t("company")}</th><th>{t("form")}</th><th>{t("document")}</th></tr></thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)" }}>{r.filed_at || "—"}</td>
                    <td style={{ color: "var(--tx)" }}>{r.company || "—"}</td>
                    <td style={{ color: "var(--tx2)" }}>{r.form_type || "—"}</td>
                    <td>
                      {r.document_url ? (
                        <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>{t("open")}</a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="placeholder">{t("enterAndSearch")}</div>
      )}
    </div>
  );
}
