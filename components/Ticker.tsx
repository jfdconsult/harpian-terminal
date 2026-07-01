import { TICKER_GROUPS } from "@/lib/data";

// Conteúdo duplicado para loop infinito sem emenda (translateX -50%)
function TickerContent() {
  return (
    <>
      {TICKER_GROUPS.map((g, gi) => (
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
  return (
    <div className="tkr-wrap">
      <div className="tkr-track">
        <TickerContent />
        <TickerContent />
      </div>
    </div>
  );
}
