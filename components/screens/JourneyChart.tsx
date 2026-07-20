"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi } from "lightweight-charts";
import type { GrowthSeries } from "./GrowthChart";

export interface DefensePeriod { start: string; end: string; label: string; severity: "major" | "moderate" | "minor" }

const DEFENSE_LINE_COLOR = "#F39C12"; // laranja/âmbar — CORE22+ em modo defesa
const DEFENSE_BAND_COLOR = "rgba(243, 156, 18, 0.10)"; // banda de fundo suave

function fmtUsd(v: number): string {
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "$" + Math.round(v / 1e3) + "k";
  return "$" + Math.round(v);
}

// Converte YYYY-MM-DD → unix seconds (00:00 UTC)
function toEpoch(iso: string): number {
  return Math.floor(new Date(iso + "T00:00:00Z").getTime() / 1000);
}

// Splitter: dado o array de pontos de CORE22+ e as janelas de defesa,
// retorna dois arrays com o MESMO comprimento — usando whitespace
// (pontos sem `value`) fora do respectivo domínio. Lightweight-charts
// respeita whitespace e renderiza duas linhas conectadas pelas bordas.
function splitByDefense(
  points: { time: number; value: number }[],
  windows: { start: number; end: number }[],
) {
  const normal: ({ time: number; value: number } | { time: number })[] = [];
  const defense: ({ time: number; value: number } | { time: number })[] = [];
  points.forEach((p) => {
    const inDefense = windows.some((w) => p.time >= w.start && p.time <= w.end);
    if (inDefense) {
      normal.push({ time: p.time });
      defense.push({ time: p.time, value: p.value });
    } else {
      normal.push({ time: p.time, value: p.value });
      defense.push({ time: p.time });
    }
  });
  return { normal, defense };
}

// Journey chart = GrowthChart + defense-period overlays.
// Regra visual: a série marcada como `defenseAware: true` (tipicamente CORE22+)
// é renderizada como DUAS linhas conectadas — amarela nos períodos normais,
// laranja nos períodos de defesa. Fundo ganha uma banda translúcida
// marcando cada janela de defesa.
export default function JourneyChart({
  series,
  defensePeriods,
  height = 360,
}: {
  series: (GrowthSeries & { defenseAware?: boolean })[];
  defensePeriods: DefensePeriod[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const key = series.map((s) => s.name + ":" + s.data.length).join("|") + "|" + defensePeriods.length;

  useEffect(() => {
    if (!ref.current || !series.length) return;
    const chart: IChartApi = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d96b3", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "#16304f", mode: 1 /* Logarithmic */ },
      timeScale: { borderColor: "#16304f", timeVisible: false, minBarSpacing: 0.05, rightOffset: 0 },
      crosshair: { mode: 0, vertLine: { color: "#C9A02C", style: LineStyle.Dashed }, horzLine: { color: "#C9A02C", style: LineStyle.Dashed } },
      width: ref.current.clientWidth, height,
    });

    const windows = defensePeriods.map((d) => ({ start: toEpoch(d.start), end: toEpoch(d.end) }));

    const tooltipRefs: { name: string; color: string; api: ReturnType<IChartApi["addLineSeries"]> }[] = [];

    // 1) DEFENSE BAND OVERLAYS as area-series — one per window
    //    Sits as a subtle amber background behind the price lines.
    if (windows.length && series[0]?.data.length) {
      const priceMax = Math.max(...series.flatMap((s) => s.data.map((p) => p.value)));
      const bandTop = priceMax * 1.05;
      windows.forEach((w) => {
        const band = chart.addAreaSeries({
          topColor: DEFENSE_BAND_COLOR,
          bottomColor: DEFENSE_BAND_COLOR,
          lineColor: "rgba(0,0,0,0)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        // Only two points needed — the horizontal band across the window.
        band.setData([
          { time: w.start as unknown as number, value: bandTop },
          { time: w.end as unknown as number, value: bandTop },
        ] as never);
      });
    }

    // 2) PRICE LINES — normal + defense split for defenseAware series
    series.forEach((s) => {
      if (s.defenseAware && windows.length) {
        const { normal, defense } = splitByDefense(s.data, windows);
        const lNormal = chart.addLineSeries({
          color: s.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
          lineStyle: s.dashed ? LineStyle.Dashed : LineStyle.Solid,
          priceFormat: { type: "custom", formatter: fmtUsd, minMove: 1 },
        });
        lNormal.setData(normal as never);
        const lDefense = chart.addLineSeries({
          color: DEFENSE_LINE_COLOR, lineWidth: 3, priceLineVisible: false, lastValueVisible: false,
          lineStyle: LineStyle.Solid,
          priceFormat: { type: "custom", formatter: fmtUsd, minMove: 1 },
        });
        lDefense.setData(defense as never);
        tooltipRefs.push({ name: s.name, color: s.color, api: lNormal });
      } else {
        const l = chart.addLineSeries({
          color: s.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
          lineStyle: s.dashed ? LineStyle.Dashed : LineStyle.Solid,
          priceFormat: { type: "custom", formatter: fmtUsd, minMove: 1 },
        });
        l.setData(s.data as never);
        tooltipRefs.push({ name: s.name, color: s.color, api: l });
      }
    });

    chart.timeScale().fitContent();

    // Tooltip — same UX as GrowthChart + tags the defense state at cursor
    chart.subscribeCrosshairMove((param) => {
      const tip = tipRef.current;
      if (!tip || !ref.current) return;
      if (!param.time || !param.point) { tip.style.display = "none"; return; }
      const timeSec = param.time as unknown as number;
      const inDefense = windows.some((w) => timeSec >= w.start && timeSec <= w.end);
      let html = "";
      tooltipRefs.forEach((s) => {
        const d = param.seriesData.get(s.api) as { value?: number } | undefined;
        if (d && d.value != null) html += `<div style="color:${s.color}">${s.name}: <b>${fmtUsd(d.value)}</b></div>`;
      });
      if (inDefense) {
        const period = defensePeriods.find((p) => timeSec >= toEpoch(p.start) && timeSec <= toEpoch(p.end));
        html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #16304f;color:${DEFENSE_LINE_COLOR};font-size:10px"><b>DEFENSE ARMED</b>${period ? ` · ${period.label}` : ""}</div>`;
      }
      if (!html) { tip.style.display = "none"; return; }
      tip.innerHTML = html;
      tip.style.display = "block";
      tip.style.left = Math.min(param.point.x + 14, ref.current.clientWidth - 200) + "px";
      tip.style.top = Math.max(8, param.point.y - 10) + "px";
    });

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); });
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [key, series, defensePeriods, height]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ width: "100%" }} />
      <div ref={tipRef} style={{ position: "absolute", display: "none", background: "rgba(4,9,16,.95)", border: "1px solid var(--line2)", borderRadius: 6, padding: "6px 9px", fontFamily: "var(--mono)", fontSize: 11, pointerEvents: "none", zIndex: 5 }} />
    </div>
  );
}
