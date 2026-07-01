"use client";
import { useEffect, useRef } from "react";

// Widget oficial do TradingView (gratuito). Estudos nativos (RSI/MACD) funcionam;
// os indicadores DSPT (Pine) do Diogo ficam no deep-link "DSPT completo".
export default function TradingViewWidget({ tvSym }: { tvSym: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '<div id="tvchart" style="height:480px;width:100%"></div>';
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.async = true;
    s.onload = () => {
      const TV = (window as unknown as { TradingView?: { widget: new (o: unknown) => void } }).TradingView;
      if (TV) new TV.widget({
        container_id: "tvchart",
        symbol: tvSym,
        interval: "D",
        theme: "dark",
        style: "1",
        locale: "br",
        autosize: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        backgroundColor: "rgba(10,26,48,1)",
      });
    };
    el.appendChild(s);
    return () => { el.innerHTML = ""; };
  }, [tvSym]);

  return <div ref={ref} style={{ height: 480, width: "100%" }} />;
}
