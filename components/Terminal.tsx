"use client";
import { useState } from "react";
import Ticker from "./Ticker";
import Topbar from "./Topbar";
import Painel from "./screens/Painel";
import Fundo from "./screens/Fundo";
import Cotacoes from "./screens/Cotacoes";
import Acoes from "./screens/Acoes";
import Regime from "./screens/Regime";
import Noticias from "./screens/Noticias";
import Risco from "./screens/Risco";
import Clientes from "./screens/Clientes";
import Cliente from "./screens/Cliente";
import Carteira from "./screens/Carteira";
import Alertas from "./screens/Alertas";
import Ordem from "./screens/Ordem";
import Importar from "./screens/Importar";
import Integracoes from "./screens/Integracoes";
import Marca from "./screens/Marca";
import Config from "./screens/Config";
import ApiIntegracao from "./screens/ApiIntegracao";
import Tutorial from "./screens/Tutorial";
import SocialRadar from "./screens/SocialRadar";
import NewsBroadcast from "./screens/NewsBroadcast";
import InsiderOrders from "./screens/InsiderOrders";
import Institutional from "./screens/Institutional";
import CotSentiment from "./screens/CotSentiment";
import CotLegacy from "./screens/CotLegacy";
import type { ScreenId } from "@/lib/nav";

export default function Terminal() {
  const [screen, setScreen] = useState<ScreenId>("painel");
  const [fundId, setFundId] = useState("HPC22");
  const [clientId, setClientId] = useState("vera");
  const [orderArg, setOrderArg] = useState<string | undefined>(undefined);

  const go = (id: ScreenId, param?: string) => {
    setScreen(id);
    if (id === "fundo" && param) setFundId(param);
    if ((id === "cliente" || id === "carteira") && param) setClientId(param);
    if (id === "ordem") setOrderArg(param);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  function renderScreen() {
    switch (screen) {
      case "painel": return <Painel go={go} />;
      case "fundo": return <Fundo fundId={fundId} onSelectFund={setFundId} go={go} />;
      case "cotacoes": return <Cotacoes />;
      case "acoes": return <Acoes />;
      case "regime": return <Regime />;
      case "noticias": return <Noticias go={go} />;
      case "risco": return <Risco />;
      case "carteira": return <Carteira clientId={clientId} go={go} />;
      case "clientes": return <Clientes go={go} />;
      case "cliente": return <Cliente clientId={clientId} go={go} />;
      case "ordem": return <Ordem preselect={orderArg} />;
      case "importar": return <Importar />;
      case "alertas": return <Alertas go={go} />;
      case "institutional": return <Institutional />;
      case "cot-sentiment": return <CotSentiment />;
      case "cot-legacy": return <CotLegacy />;
      case "social-radar": return <SocialRadar />;
      case "news-broadcast": return <NewsBroadcast />;
      case "insider-orders": return <InsiderOrders />;
      case "integracoes": return <Integracoes />;
      case "marca": return <Marca />;
      case "config": return <Config />;
      case "api": return <ApiIntegracao />;
      case "tutorial": return <Tutorial go={go} />;
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
