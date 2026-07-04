"use client";
import { useEffect, useState } from "react";
import { TICKER_GROUPS, type TickerGroup } from "@/lib/data";

function TickerContent({ groups }: { groups: TickerGroup[] }) {
  return (
    <>
      {groups.map((g, gi) => (
        <span key={gi} style={{ display: "contents" }}>
          <div className="tkr-div">{g.div}</div>
          {g.items.map((it, ii) => (
            <div className="tkr-item" key={ii}>
              <span className="tkr-lbl">{it.lbl}</span>
              <span className={`tkr-v ${it.dir}`}>{it.v}</span>
            </div>
          ))}
        </span>
      ))}
    </>
  );
}

export default function Ticker() {
  const [groups, setGroups] = useState<TickerGroup[]>(TICKER_GROUPS);

  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((j) => {
        if (j.data && Array.isArray(j.data) && j.data.length > 0) {
          setGroups(j.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="tkr-wrap">
      <div className="tkr-track">
        <TickerContent groups={groups} />
        <TickerContent groups={groups} />
      </div>
    </div>
  );
}
