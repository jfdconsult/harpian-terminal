"use client";
import { useState } from "react";
import { GOV_API } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

interface FilingResult { company?: string; cik?: string; form_type?: string; filed_at?: string; accession?: string; document_url?: string; }
interface SearchResponse { query: string; forms?: string; total?: number; total_is_lower_bound?: boolean; n: number; results: FilingResult[]; source?: string; error?: string; }

const COMMON_FORMS = ["", "10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13D", "13G"];

export default function FilingsSearch() {
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
      <div className="crumb">Intelligence › <b>Filings Search</b></div>
      <div className="h1">Filings Search</div>
      <div className="sub">SEC EDGAR Full-Text Search · Keyword search across 10-K/10-Q/8-K/etc since 2001.</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <input
          className="fsel" style={{ minWidth: 260, fontSize: 12, padding: "6px 10px" }}
          placeholder='ex: "stock buyback", "material weakness"'
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
        />
        <span className="flabel">Form:</span>
        <select className="fsel" style={{ fontSize: 12, padding: "6px 10px" }} value={forms} onChange={(e) => setForms(e.target.value)}>
          {COMMON_FORMS.map((f) => (<option key={f} value={f}>{f || "All"}</option>))}
        </select>
        <button className="btn ghost" style={{ padding: "6px 14px", fontSize: 11 }} onClick={search} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {offline ? (
        <div className="placeholder">gov-data API offline. Run <b>python api_server.py</b> (port 8877) to see real data.</div>
      ) : data?.error ? (
        <div className="placeholder">{data.error}</div>
      ) : data ? (
        <div className="card">
          <h3>{data.n} results{data.total ? ` out of ~${data.total}${data.total_is_lower_bound ? "+" : ""}` : ""}</h3>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Company</th><th>Form</th><th>Document</th></tr></thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)" }}>{r.filed_at || "—"}</td>
                    <td style={{ color: "var(--tx)" }}>{r.company || "—"}</td>
                    <td style={{ color: "var(--tx2)" }}>{r.form_type || "—"}</td>
                    <td>
                      {r.document_url ? (
                        <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>open</a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="placeholder">Enter a search and click Search.</div>
      )}
    </div>
  );
}
