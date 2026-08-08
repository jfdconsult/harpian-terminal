import { useI18n } from "@/lib/i18n";

const TR = {
  migratingToNextjs: { pt: "Migrando para Next.js", en: "Migrating to Next.js" },
  screenWillBePorted: { pt: "Esta tela será portada a partir do protótipo aprovado na próxima etapa.", en: "This screen will be ported from the approved prototype in the next stage." },
} as const;

export default function Placeholder({ crumb, title, sub, icon = "ti-tool", note }: { crumb: string; title: string; sub: string; icon?: string; note?: string }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  return (
    <div className="screen">
      <div className="crumb"><b>{crumb}</b></div>
      <div className="h1">{title}</div>
      <div className="sub">{sub}</div>
      <div className="placeholder">
        <i className={`ti ${icon}`} />
        <b>{note || t("migratingToNextjs")}</b>
        <div className="muted mt">{t("screenWillBePorted")}</div>
      </div>
    </div>
  );
}
