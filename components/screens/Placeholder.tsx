export default function Placeholder({ crumb, title, sub, icon = "ti-tool", note }: { crumb: string; title: string; sub: string; icon?: string; note?: string }) {
  return (
    <div className="screen">
      <div className="crumb"><b>{crumb}</b></div>
      <div className="h1">{title}</div>
      <div className="sub">{sub}</div>
      <div className="placeholder">
        <i className={`ti ${icon}`} />
        <b>{note || "Migrating to Next.js"}</b>
        <div className="muted mt">This screen will be ported from the approved prototype in the next stage.</div>
      </div>
    </div>
  );
}
