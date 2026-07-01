"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi } from "lightweight-charts";

type Pt = { time: string; value: number };

export default function AssetChart({ points, benchPoints }: { points: Pt[]; benchPoints: Pt[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d96b3", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "#16304f" },
      timeScale: { borderColor: "#16304f", timeVisible: false },
      crosshair: { mode: 0, vertLine: { color: "#C9A02C", style: LineStyle.Dashed }, horzLine: { color: "#C9A02C", style: LineStyle.Dashed } },
      width: ref.current.clientWidth,
      height: 320,
    });
    const asset = chart.addLineSeries({ color: "#2ECC71", lineWidth: 2 });
    asset.setData(points);
    const bench = chart.addLineSeries({ color: "#4A90D9", lineWidth: 1 });
    bench.setData(benchPoints);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); });
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [points, benchPoints]);

  return <div ref={ref} style={{ width: "100%", height: 320 }} />;
}
