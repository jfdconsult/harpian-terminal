"use client";
import { useEffect, useState } from "react";
import { TICKER_GROUPS, type TickerGroup, type TickerItem } from "@/lib/data";
import type { ScreenId } from "@/lib/nav";

function TickerItemView({ it, go }: { it: TickerItem; go?: (id: ScreenId, param?: string) => void }) {
  const content = (
    <>
      <span className="tkr-lbl">{it.lbl}</span>
      <span className={`tkr-v ${it.dir}`}>{it.v}</span>
    </>
  );
  // Real news item → opens the original article in a new tab.
  if (it.href) {
    return (
      <a className="tkr-item tkr-link" href={it.href} target="_blank" rel="noopener noreferrer" title="Open article">
        {content}
      </a>
    );
  }
  // Asset with a known symbol → opens the chart in the Terminal itself.
  if (it.symbol && go) {
    return (
      <div className="tkr-item tkr-link" onClick={() => go("acoes", it.symbol)} title={`View chart for ${it.lbl}`}>
        {content}
      </div>
    );
  }
  return <div className="tkr-item">{content}</div>;
}

function TickerContent({ groups, go }: { groups: TickerGroup[]; go?: (id: ScreenId, param?: string) => void }) {
  return (
    <>
      {groups.map((g, gi) => (
        <span key={gi} style={{ display: "contents" }}>
          <div className="tkr-div">{g.div}</div>
          {g.items.map((it, ii) => <TickerItemView key={ii} it={it} go={go} />)}
        </span>
      ))}
    </>
  );
}

const REFRESH_MS = 5 * 60 * 1000; // 5 min — the API already caches for 8h server-side, this just keeps the screen alive

export default function Ticker({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [groups, setGroups] = useState<TickerGroup[]>(TICKER_GROUPS);

  useEffect(() => {
    const load = () => {
      fetch("/api/ticker")
        .then((r) => r.json())
        .then((j) => {
          if (j.data && Array.isArray(j.data) && j.data.length > 0) {
            setGroups(j.data);
          }
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tkr-wrap">
      <div className="tkr-track">
        <TickerContent groups={groups} go={go} />
        <TickerContent groups={groups} go={go} />
      </div>
    </div>
  );
}
