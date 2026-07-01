"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, type IChartApi } from "lightweight-charts";
import { emaEuler, demaCascade, temaCascade, sma, bollinger, rsiSeries, demaReturns, toLine } from "@/lib/indicators";

type Candle = { time: number; open: number; high: number; low: number; close: number };
type Vol = { time: number; value: number; up: boolean };
export interface Studies { ema: boolean; dema: boolean; tema: boolean; sma: boolean; bb: boolean; vol: boolean; rsi: boolean; mom: boolean }

export default function AssetChart({ candles, volume, studies, compareLine }: { candles: Candle[]; volume: Vol[]; studies: Studies; compareLine?: { time: number; value: number }[] | null }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const momRef = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(studies) + (compareLine ? `|c${compareLine.length}` : "");

  useEffect(() => {
    if (!mainRef.current || !candles.length) return;
    const times = candles.map((c) => c.time);
    const closes = candles.map((c) => c.close);

    const mk = (el: HTMLDivElement, h: number): IChartApi => createChart(el, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7d96b3", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "#16304f" },
      timeScale: { borderColor: "#16304f", timeVisible: false },
      crosshair: { mode: 0, vertLine: { color: "#C9A02C", style: LineStyle.Dashed }, horzLine: { color: "#C9A02C", style: LineStyle.Dashed } },
      width: el.clientWidth, height: h,
    });

    const charts: IChartApi[] = [];
    const main = mk(mainRef.current, 344);
    charts.push(main);

    const cs = main.addCandlestickSeries({ upColor: "#2ECC71", downColor: "#E74C3C", borderUpColor: "#2ECC71", borderDownColor: "#E74C3C", wickUpColor: "#2ECC71", wickDownColor: "#E74C3C" });
    cs.setData(candles as never);

    if (studies.vol) {
      const vs = main.addHistogramSeries({ priceScaleId: "vol", priceFormat: { type: "volume" } });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vs.setData(volume.map((v) => ({ time: v.time, value: v.value, color: v.up ? "rgba(46,204,113,0.4)" : "rgba(231,76,60,0.4)" })) as never);
    }

    const addLine = (vals: (number | null)[], color: string, width = 1, dashed = false) => {
      const s = main.addLineSeries({ color, lineWidth: width as never, lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid, priceLineVisible: false, lastValueVisible: false });
      s.setData(toLine(times, vals) as never);
    };
    if (studies.ema) addLine(emaEuler(closes, 13), "#4A90D9", 2);
    if (studies.dema) addLine(demaCascade(closes, 13), "#C9A02C", 2);
    if (studies.tema) addLine(temaCascade(closes, 13), "#2ECC71", 2);
    if (studies.sma) addLine(sma(closes, 50), "#7d96b3", 1);
    if (studies.bb) { const bb = bollinger(closes, 20, 2); addLine(bb.upper, "#7FA8C9", 1, true); addLine(bb.lower, "#7FA8C9", 1, true); }

    // Linha de comparação (benchmark rebaseado ao nível do ativo)
    if (compareLine && compareLine.length) {
      const cmp = main.addLineSeries({ color: "#C77DFF", lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      cmp.setData(compareLine as never);
    }

    if (studies.rsi && rsiRef.current) {
      const rc = mk(rsiRef.current, 110); charts.push(rc);
      const rs = rc.addLineSeries({ color: "#C9A02C", lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
      rs.setData(toLine(times, rsiSeries(closes, 14)) as never);
      [70, 30].forEach((lvl) => { const g = rc.addLineSeries({ color: "rgba(255,255,255,0.15)", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }); g.setData(times.map((t) => ({ time: t, value: lvl })) as never); });
    }
    if (studies.mom && momRef.current) {
      const mc = mk(momRef.current, 110); charts.push(mc);
      const d13 = mc.addLineSeries({ color: "#C9A02C", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      d13.setData(toLine(times, demaReturns(closes, 13)) as never);
      const j37 = mc.addLineSeries({ color: "#4A90D9", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      j37.setData(toLine(times, demaReturns(closes, 37)) as never);
      const z = mc.addLineSeries({ color: "rgba(255,255,255,0.15)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      z.setData(times.map((t) => ({ time: t, value: 0 })) as never);
    }

    charts.forEach((c) => c.timeScale().fitContent());
    let syncing = false;
    charts.forEach((src) => src.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (syncing || !r) return; syncing = true;
      charts.forEach((dst) => { if (dst !== src) dst.timeScale().setVisibleLogicalRange(r); });
      syncing = false;
    }));

    const ro = new ResizeObserver(() => { const w = mainRef.current?.clientWidth || 600; charts.forEach((c) => c.applyOptions({ width: w })); });
    ro.observe(mainRef.current);
    return () => { ro.disconnect(); charts.forEach((c) => c.remove()); };
  }, [candles, key, compareLine]);

  return (
    <div>
      <div ref={mainRef} style={{ width: "100%" }} />
      {studies.rsi && <div style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mono)", margin: "6px 0 0", letterSpacing: ".08em" }}>RSI (14)</div>}
      <div ref={rsiRef} style={{ width: "100%", display: studies.rsi ? "block" : "none" }} />
      {studies.mom && <div style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mono)", margin: "6px 0 0", letterSpacing: ".08em" }}>MOMENTO DEMA · D13 (ouro) / J37 (azul)</div>}
      <div ref={momRef} style={{ width: "100%", display: studies.mom ? "block" : "none" }} />
    </div>
  );
}
