"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi } from "lightweight-charts";

type DD = { time: number; value: number };
export interface DDSeries { name: string; color: string; data: DD[]; fill?: boolean }

export default function DrawdownChart({ series, height = 300 }: { series: DDSeries[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const key = series.map((s) => s.name + ":" + s.data.length).join("|");

  useEffect(() => {
    if (!ref.current || !series.length) return;
    const chart: IChartApi = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d96b3", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "#16304f" },
      timeScale: { borderColor: "#16304f", timeVisible: false },
      crosshair: { mode: 0, vertLine: { color: "#C9A02C", style: LineStyle.Dashed }, horzLine: { color: "#C9A02C", style: LineStyle.Dashed } },
      width: ref.current.clientWidth, height,
    });

    const apis = series.map((s) => {
      if (s.fill) {
        const a = chart.addBaselineSeries({
          baseValue: { type: "price", price: 0 },
          topLineColor: s.color, topFillColor1: "rgba(0,0,0,0)", topFillColor2: "rgba(0,0,0,0)",
          bottomLineColor: s.color, bottomFillColor1: `${s.color}12`, bottomFillColor2: `${s.color}44`,
          lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        a.setData(s.data as never);
        return { ...s, api: a };
      }
      const l = chart.addLineSeries({ color: s.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
      l.setData(s.data as never);
      return { ...s, api: l };
    });
    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      const tip = tipRef.current;
      if (!tip || !ref.current) return;
      if (!param.time || !param.point) { tip.style.display = "none"; return; }
      let html = "";
      apis.forEach((s) => {
        const d = param.seriesData.get(s.api) as { value?: number } | undefined;
        if (d && d.value != null) html += `<div style="color:${s.color}">${s.name}: <b>${d.value.toFixed(1)}%</b></div>`;
      });
      if (!html) { tip.style.display = "none"; return; }
      tip.innerHTML = html;
      tip.style.display = "block";
      tip.style.left = Math.min(param.point.x + 14, ref.current.clientWidth - 130) + "px";
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
