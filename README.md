# HARPIAN ETP Terminal

Terminal do **cliente profissional** do ETP Harpian (MFO / gestor / RIA / assessor) — nunca o
cliente final. Referência de produto: Bloomberg (mostra dado e análise, não opera). Next.js 16 +
React 19 + TypeScript, porta padrão `8950`.

**Não confundir com:**
- `harpian-cockpit-next` — o Cockpit é o produto **interno** do gestor, mostra o método (sinais,
  CRS, fórmulas). Este Terminal é o produto do **cliente** — nunca expõe o método.
- `harpian-front` (Jinstronda) — stack diferente, projeto separado do JP.

## 🔒 Regra de confidencialidade (a mais importante do repo)

O Terminal **NUNCA mostra o método**: nada de sinais, gatilhos, CRS, HSA ou fórmulas dos motores.
Só resultado e postura (regime, performance, composição, risco). O filtro roda nas rotas Next.js
do próprio Terminal (`app/api/snapshot`, `app/api/fund-benchmarks`, etc.) — elas são a fronteira de
segurança. Ao portar qualquer coisa do Cockpit (que mostra o "como"), filtre para deixar só o "o quê".

## Rodando local

```bash
npm install
npm run dev -- -p 8950     # abre http://localhost:8950 (porta padrão usada nesta sessão)
```

Variáveis de ambiente (`.env.local`):
- `ANTHROPIC_API_KEY` — necessária para o **JIM** (assistente de IA) responder de verdade.
  Sem ela, a rota `/api/jim/chat` retorna erro 500 claro (nunca finge resposta).
- `NEXT_PUBLIC_HQP_API_URL` — URL do backend HQP (default `http://localhost:8080`), usado pelas
  telas de Notícias/Social Radar (`lib/hqp.ts`).
- `HARPIAN_SNAPSHOT_DIR` — pasta de saída do overnight Python (default aponta pro caminho local
  do João), usada por `app/api/snapshot` pra ler regime/composição/defesa reais.

## 🤖 JIM — assistente de IA screen-aware

Regra de ouro: o JIM **nunca pergunta "o que você está vendo na tela"** — ele já enxerga os dados
reais de qualquer tela aberta e responde direto, com números reais. Cada tela publica o que está
mostrando via `publishScreenData()` (`lib/jim-data.ts`); o JIM lê isso, saúda nomeando o item com
dado ao vivo, e oferece 3 chips de perguntas prováveis daquele contexto específico.

Arquitetura completa, decisões de design e o bug original que motivou isso:
`hqp-platform/docs/architecture/HANDOFF_TERMINAL_JIM_04_05JUL.md`.

**Para adicionar numa tela nova:** uma chamada `publishScreenData(screen, summary, rows, {briefing, suggestions})`
dentro do `useEffect` que já busca os dados daquela tela. ~10 linhas.

## Mapa geral do sistema

Este Terminal é uma das 3 experiências da plataforma HQP (Cockpit / Terminal / backend). Mapa
completo, o que é real vs mock, e todas as regras inegociáveis (Air Gap, régua de ouro,
confidencialidade, Sortino) estão em `hqp-platform/docs/ONBOARDING_DIOGO.md`.
