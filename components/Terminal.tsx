"use client";
import { useState } from "react";
import Ticker from "./Ticker";
import Topbar from "./Topbar";
import Painel from "./screens/Painel";
import Fundo from "./screens/Fundo";
import SocialRadar from "./screens/SocialRadar";
import NewsBroadcast from "./screens/NewsBroadcast";
import InsiderOrders from "./screens/InsiderOrders";
import Institutional from "./screens/Institutional";
import CotSentiment from "./screens/CotSentiment";
import CotLegacy from "./screens/CotLegacy";
import Placeholder from "./screens/Placeholder";
import type { ScreenId } from "@/lib/nav";

export default function Terminal() {
  const [screen, setScreen] = useState<ScreenId>("painel");
  const [fundId, setFundId] = useState("HPC22");

  const go = (id: ScreenId, param?: string) => {
    setScreen(id);
    if (id === "fundo" && param) setFundId(param);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  function renderScreen() {
    switch (screen) {
      case "painel": return <Painel go={go} />;
      case "fundo": return <Fundo fundId={fundId} onSelectFund={setFundId} go={go} />;
      case "social-radar": return <SocialRadar />;
      case "news-broadcast": return <NewsBroadcast />;
      case "insider-orders": return <InsiderOrders />;
      case "institutional": return <Institutional />;
      case "cot-sentiment": return <CotSentiment />;
      case "cot-legacy": return <CotLegacy />;
      case "cotacoes": return <Placeholder crumb="Mercado › Cotações" title="Cotações (FastTrack)" sub="Snapshot e histórico US EOD dividend-adjusted." icon="ti-table" />;
      case "acoes": return <Placeholder crumb="Mercado › Ações" title="Ações & índices US" sub="Gráficos e fundamentos." icon="ti-chart-candle" />;
      case "noticias": return <Placeholder crumb="Mercado › Notícias" title="Notícias" sub="Curadoria de notícias do mercado." icon="ti-news" />;
      case "regime": return <Placeholder crumb="Mercado › Regime" title="Sinais & regime" sub="Medidor de regime e defesa." icon="ti-activity" />;
      case "risco": return <Placeholder crumb="Risco" title="Comparação · 4 níveis" sub="Risk Number por nível de risco." icon="ti-scale" />;
      case "carteira": return <Placeholder crumb="Risco › Carteira" title="Risco do portfólio" sub="Análise de risco da carteira do cliente." icon="ti-wallet" />;
      case "clientes": return <Placeholder crumb="Clientes" title="Lista de clientes" sub="Carteiras e mandatos." icon="ti-users" />;
      case "cliente": return <Placeholder crumb="Clientes" title="Cliente" sub="Detalhe do cliente." icon="ti-user" />;
      case "ordem": return <Placeholder crumb="Ordens" title="Enviar ordem (Lynk)" sub="Geração semiautomática de ordens." icon="ti-send" />;
      case "importar": return <Placeholder crumb="Clientes › Importar" title="Importar / conectar" sub="Conecte carteiras e custodiantes." icon="ti-upload" />;
      case "alertas": return <Placeholder crumb="Clientes › Alertas" title="Alertas" sub="Alertas de risco e mercado." icon="ti-bell" />;
      case "integracoes": return <Placeholder crumb="Ajustes › Integrações" title="Integrações" sub="APIs e conectores." icon="ti-plug" />;
      case "marca": return <Placeholder crumb="Ajustes › Marca" title="Marca (white-label)" sub="Personalize cores e logo." icon="ti-palette" />;
      case "config": return <Placeholder crumb="Ajustes › Configurações" title="Configurações" sub="Conta, usuários e preferências." icon="ti-adjustments" />;
      case "tutorial": return <Placeholder crumb="Tutorial" title="Como usar o terminal" sub="Leva 2 minutos." icon="ti-help-circle" />;
      default: return <Painel go={go} />;
    }
  }

  return (
    <div className="app">
      <Ticker />
      <Topbar go={go} />
      <div className="main">{renderScreen()}</div>
    </div>
  );
}
