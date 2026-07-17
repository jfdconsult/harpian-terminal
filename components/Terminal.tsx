"use client";
import { useEffect, useState } from "react";
import { subscribeAskJim } from "@/lib/jim-ask";
import Ticker from "./Ticker";
import Topbar from "./Topbar";
import JimDrawer from "./JimDrawer";
import SettingsDrawer from "./SettingsDrawer";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import Painel from "./screens/Painel";
import Fundo from "./screens/Fundo";
import Cotacoes from "./screens/Cotacoes";
import Calendar from "./screens/Calendar";
import Acoes from "./screens/Acoes";
import Regime from "./screens/Regime";
import Xri from "./screens/Xri";
import MercadoVisao from "./screens/MercadoVisao";
import Noticias from "./screens/Noticias";
import Risco from "./screens/Risco";
import Clientes from "./screens/Clientes";
import Cliente from "./screens/Cliente";
import Carteira from "./screens/Carteira";
import ClienteRisco from "./screens/ClienteRisco";
import PortfolioDetail from "./screens/PortfolioDetail";
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
import MarketDna from "./screens/MarketDna";
import Screener from "./screens/Screener";
import Snowflake from "./screens/Snowflake";
import FilingsSearch from "./screens/FilingsSearch";
import type { ScreenId } from "@/lib/nav";

export default function Terminal() {
  const [screen, setScreen] = useState<ScreenId>("painel");
  const [fundId, setFundId] = useState("HPC22");
  const [clientId, setClientId] = useState("joao-daniel");
  const [orderArg, setOrderArg] = useState<string | undefined>(undefined);
  const [chartArg, setChartArg] = useState<string | undefined>(undefined);
  const [portfolioArg, setPortfolioArg] = useState<string | undefined>(undefined);
  const [snowflakeArg, setSnowflakeArg] = useState<string | undefined>(undefined);
  const [jimOpen, setJimOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const go = (id: ScreenId, param?: string) => {
    setScreen(id);
    if (id === "fundo" && param) setFundId(param);
    if ((id === "cliente" || id === "carteira" || id === "cliente-risco") && param) setClientId(param);
    if (id === "ordem") setOrderArg(param);
    if (id === "acoes" && param) setChartArg(param);
    if (id === "portfolio-detalhe" && param) setPortfolioArg(param);
    if (id === "snowflake" && param) setSnowflakeArg(param);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // askJim() from any screen opens the drawer automatically (JimDrawer.tsx handles sending the question).
  useEffect(() => subscribeAskJim(() => setJimOpen(true)), []);

  // If the advisor has configured their email, pull favorites from the server on open
  // (cross-device source of truth). Without an email, no network calls are made.
  useEffect(() => { import("@/lib/favorites").then((m) => m.syncFromServer()); }, []);

  function renderScreen() {
    switch (screen) {
      case "painel": return <Painel go={go} />;
      case "fundo": return <Fundo fundId={fundId} onSelectFund={setFundId} go={go} />;
      case "cotacoes": return <Cotacoes go={go} />;
      case "calendar": return <Calendar go={go} />;
      case "acoes": return <Acoes symbol={chartArg} />;
      case "mercado-visao": return <MercadoVisao go={go} />;
      case "regime": return <Regime go={go} />;
      case "xri": return <Xri go={go} />;
      case "noticias": return <Noticias go={go} />;
      case "risco": return <Risco />;
      case "carteira": return <Carteira clientId={clientId} go={go} />;
      case "cliente-risco": return <ClienteRisco clientId={clientId} go={go} />;
      case "portfolio-detalhe": return <PortfolioDetail arg={portfolioArg} go={go} />;
      case "clientes": return <Clientes go={go} />;
      case "cliente": return <Cliente clientId={clientId} go={go} />;
      case "ordem": return <Ordem preselect={orderArg} />;
      case "importar": return <Importar />;
      case "alertas": return <Alertas go={go} />;
      case "institutional": return <Institutional />;
      case "market-dna": return <MarketDna go={go} />;
      case "cot-sentiment": return <CotSentiment />;
      case "cot-legacy": return <CotLegacy />;
      case "social-radar": return <SocialRadar />;
      case "news-broadcast": return <NewsBroadcast />;
      case "insider-orders": return <InsiderOrders go={go} />;
      case "screener": return <Screener go={go} />;
      case "snowflake": return <Snowflake symbol={snowflakeArg} go={go} />;
      case "filings-search": return <FilingsSearch />;
      case "integracoes": return <Integracoes />;
      case "marca": return <Marca />;
      case "config": return <Config />;
      case "api": return <ApiIntegracao />;
      case "tutorial": return <Tutorial go={go} />;
      default: return <Painel go={go} />;
    }
  }

  return (
    <ThemeProvider>
    <I18nProvider>
    <div className="app">
      <Ticker go={go} />
      <Topbar go={go} jimOpen={jimOpen} onJimToggle={() => setJimOpen((v) => !v)} onSettingsToggle={() => setSettingsOpen((v) => !v)} />
      <div className="main">{renderScreen()}</div>
      <JimDrawer open={jimOpen} onClose={() => setJimOpen(false)} screen={screen} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
    </I18nProvider>
    </ThemeProvider>
  );
}
