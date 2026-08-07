"use client";
// Wrapper de tela para o Portfolio Builder dentro do Terminal.
// O componente em si (components/portfolio-builder/PortfolioBuilder.tsx) nao
// tem props de navegacao — e a mesma peca que roda na apresentacao
// (harpian.com/presentation/portfolio-builder), portada aqui para o cliente
// final construir o proprio portfolio dentro do produto que ele realmente usa.
import PortfolioBuilder from "@/components/portfolio-builder/PortfolioBuilder";

export default function PortfolioBuilderScreen() {
  return (
    <div>
      <div className="crumb">
        <b>Portfolio Builder</b>
      </div>
      <PortfolioBuilder />
    </div>
  );
}
