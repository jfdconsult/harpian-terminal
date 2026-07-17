"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi } from "lightweight-charts";

export interface GrowthSeries { name: string; color: string; data: { time: number; value: number }[]; dashed?: boolean }

function fmtUsd(v: number): string {
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "$" + Math.round(v / 1e3) + "k";
  return "$" + Math.round(v);
}

// Dollar growth chart (base $10,000), logarithmic scale — same as the final
// piece of the presentation ("The Consequence"): tracks the chosen client vs S&P vs ETP.
export default function GrowthChart({ series, height = 320 }: { series: GrowthSeries[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const key = series.map((s) => s.name + ":" + s.data.length).join("|");

  useEffect(() => {
    if (!ref.current || !series.length) return;
    const chart: IChartApi = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d96b3", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "#16304f", mode: 1 /* Logarithmic */ },
      // minBarSpacing 0.05 (default is 0.5) so 20+ years of daily data (~6.6k bars)
      // fit end-to-end without silently cropping the oldest years.
      timeScale: { borderColor: "#16304f", timeVisible: false, minBarSpacing: 0.05, rightOffset: 0 },
      crosshair: { mode: 0, vertLine: { color: "#C9A02C", style: LineStyle.Dashed }, horzLine: { color: "#C9A02C", style: LineStyle.Dashed } },
      width: ref.current.clientWidth, height,
    });

    const apis = series.map((s) => {
      const l = chart.addLineSeries({
        color: s.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        lineStyle: s.dashed ? LineStyle.Dashed : LineStyle.Solid,
        priceFormat: { type: "custom", formatter: fmtUsd, minMove: 1 },
      });
      l.setData(s.data as never);
      return { ...s, api: l };
    });
    const maxLen = Math.max(...series.map((s) => s.data.length), 0);
    chart.timeScale().fitContent();
    if (maxLen > 1) chart.timeScale().setVisibleLogicalRange({ from: 0, to: maxLen - 1 });

    chart.subscribeCrosshairMove((param) => {
      const tip = tipRef.current;
      if (!tip || !ref.current) return;
      if (!param.time || !param.point) { tip.style.display = "none"; return; }
      let html = "";
      apis.forEach((s) => {
        const d = param.seriesData.get(s.api) as { value?: number } | undefined;
        if (d && d.value != null) html += `<div style="color:${s.color}">${s.name}: <b>${fmtUsd(d.value)}</b></div>`;
      });
      if (!html) { tip.style.display = "none"; return; }
      tip.innerHTML = html;
      tip.style.display = "block";
      tip.style.left = Math.min(param.point.x + 14, ref.current.clientWidth - 140) + "px";
      tip.style.top = Math.max(8, param.point.y - 10) + "px";
    });

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); });
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [key, series, height]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ width: "100%" }} />
      <div ref={tipRef} style={{ position: "absolute", display: "none", background: "rgba(4,9,16,.95)", border: "1px solid var(--line2)", borderRadius: 6, padding: "6px 9px", fontFamily: "var(--mono)", fontSize: 11, pointerEvents: "none", zIndex: 5 }} />
    </div>
  );
}
