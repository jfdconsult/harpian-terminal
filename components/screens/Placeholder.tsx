export default function Placeholder({ crumb, title, sub, icon = "ti-tool", note }: { crumb: string; title: string; sub: string; icon?: string; note?: string }) {
  return (
    <div className="screen">
      <div className="crumb"><b>{crumb}</b></div>
      <div className="h1">{title}</div>
      <div className="sub">{sub}</div>
      <div className="placeholder">
        <i className={`ti ${icon}`} />
        <b>{note || "Em migração para Next.js"}</b>
        <div className="muted mt">Esta tela será portada do protótipo homologado na próxima etapa.</div>
      </div>
    </div>
  );
}
