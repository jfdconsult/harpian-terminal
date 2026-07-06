# HANDOFF — HARPIAN ETP TERMINAL
**Para: Diogo | Data: 2026-07-06**

## O que é
Terminal profissional para investidores do ETP (MFO, gestores, RIAs, assessores). Referência visual: Bloomberg. Mostra dados e postura, NÃO opera. O fundo é o protagonista.

## Stack
- Next.js 16 + React 19 + TypeScript
- Porta 8950
- Sem backend próprio — consome HQP API + APIs externas (Yahoo, SEC, CFTC)
- Lightweight Charts para gráficos candle
- dnd-kit para drag-and-drop

## Como rodar
```bash
cd C:\dev\harpian-terminal-next
npm install
npm run dev
```
Acesse http://localhost:8950

## Estrutura de pastas
```
harpian-terminal-next/
├── app/
│   ├── layout.tsx          # Root layout (ThemeProvider + I18nProvider)
│   ├── page.tsx            # Carrega Terminal.tsx
│   ├── globals.css         # Temas + variáveis CSS
│   └── questionario/[id]/  # Risk Number questionnaire
├── components/
│   ├── Terminal.tsx         # Shell principal (sidebar + topbar + router)
│   ├── Topbar.tsx           # Barra superior (logo, JIM, config)
│   ├── JimDrawer.tsx        # Drawer do JIM AI
│   ├── SettingsDrawer.tsx   # Drawer de configurações
│   ├── Ticker.tsx           # Fita de cotações
│   └── screens/             # Todas as telas (39 arquivos)
├── lib/
│   ├── nav.ts              # Menus e tipos de tela
│   ├── i18n.tsx            # Internacionalização PT/EN
│   ├── theme.tsx           # Provider de temas
│   ├── jim-*.ts            # Módulos do JIM AI (4 arquivos)
│   ├── data.ts, market.ts  # Dados e mercado
│   └── ...                 # Utilitários diversos
└── public/                  # Assets estáticos
```

## Sistema de temas
3 temas via CSS variables em `globals.css`:
- **Navy** (padrão): fundo azul escuro, sem atributo `data-theme`
- **Claro**: fundo branco, `data-theme="light"`
- **Escuro**: fundo cinza/preto, `data-theme="dark"`

Variáveis principais: `--bg`, `--panel`, `--tx`, `--tx2`, `--line`, `--line2`, `--gold`

**REGRA**: NUNCA usar cores hardcoded. Sempre `var(--variavel)`.

## i18n (PT/EN)
- Arquivo: `lib/i18n.tsx`
- Hook: `useI18n()` retorna `{ lang, setLang, t }`
- Uso: `t("chave_do_dicionario")`
- Ao trocar idioma: confirm dialog + `window.location.reload()`
- Armazenado em `localStorage("harpian-lang")`

## JIM AI (Assistente Proativo)
- Botão amarelo no topbar abre o JimDrawer
- Padrão `publishScreenData()`: cada tela publica seus dados visíveis
- JIM lê o contexto e oferece insights proativos
- Cards do JIM (Painel.tsx e Regime.tsx) usam `var(--panel)` como fundo
- 4 módulos em lib/: jim-context.ts, jim-data.ts, jim-knowledge.ts, jim-sessions.ts

## Telas principais
| Tela | Arquivo | Descrição |
|------|---------|-----------|
| Painel | Painel.tsx | Dashboard + JIM Morning Briefing |
| Fundo | Fundo.tsx | Detalhes do fundo (HPC22/HPC11) |
| Cotações | Cotacoes.tsx | Tabela de cotações em tempo real |
| Regime | Regime.tsx | Visão de mercado + JIM análise |
| Ações | Acoes.tsx | Ações e índices US |
| Clientes | Clientes.tsx | Lista de clientes |
| Risco | Risco.tsx | Comparação de 4 níveis de risco |
| Market DNA | MarketDna.tsx | Análise DNA do mercado |
| COT Intelligence | CotSentiment.tsx | Análise COT (CFTC) |
| 13F Holdings | Institutional.tsx | Holdings institucionais (SEC) |
| Social Radar | SocialRadar.tsx | Sentimento em redes sociais |
| News Broadcast | NewsBroadcast.tsx | Sistema de notícias |
| Insider Orders | InsiderOrders.tsx | Ordens de insiders |

## Mudanças recentes (sessão 2026-07-06)
1. **JIM Morning Briefing theme-aware**: removido fundo azul hardcoded dos cards JIM em Painel.tsx e Regime.tsx → agora usa `var(--panel)` + `var(--tx)`
2. **i18n reload**: ao trocar idioma, mostra confirm + recarrega a página
3. **Variável --jim-heading** adicionada em globals.css (pode ser removida — não está em uso)

## REGRAS DE CONFIDENCIALIDADE
- Terminal mostra RESULTADO e POSTURA
- NUNCA expor sinais, gatilhos, fórmulas, CRS, HSA (isso é do Cockpit interno)
- Ao portar algo do Cockpit, filtrar o "como" e deixar só o "o quê"

## Repo GitHub
- Remote: https://github.com/jfdconsult/harpian-terminal.git
- Branch local: master (tracking origin/main)
