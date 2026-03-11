# Project Overview

A React + Vite + TypeScript single-page application for managing a business (clients, inventory, production, sales, formulas, pricing, notes, reports, etc.). Uses Supabase as the backend/database.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Auth/DB**: Supabase (`@supabase/supabase-js`)
- **UI**: Lucide React icons, Framer Motion, Recharts, React Grid Layout, React Quill
- **Build**: Vite with `vite-plugin-singlefile` (bundles into a single HTML file)

## Project Structure

```
src/
  App.tsx              - Root component with routing/state
  main.tsx             - Entry point
  index.css            - Global styles
  components/          - Feature components (Auth, Dashboard, Clientes, Estoque, etc.)
  hooks/               - Custom hooks (useTheme)
  lib/                 - Supabase client, data service, SQL schema
  types/               - TypeScript type definitions
  utils/               - Utilities (cn, permissions, printUtils)
  data/                - Mock data
  version.ts           - App version
```

## Development

- **Run**: `npm run dev` (port 5000)
- **Build**: `npm run build`

## Replit Configuration

- Frontend runs on `0.0.0.0:5000` with `allowedHosts: true` in `vite.config.ts`
- Deployment: static site, build with `npm run build`, serve from `dist/`

## Supabase Integration

- **Credentials**: Stored as env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Tables (17)**: insumos, insumo_variantes, insumo_movimentacoes, formulas, formula_insumos, formula_historico, grupos, clientes, pedidos, ordens_producao, produtos_estoque, movimentacoes_estoque, listas_preco, precificacao, anotacoes (with user_id), access_groups, user_profiles
- **DB columns**: snake_case; React state: camelCase; dataService.ts has explicit mappers for each entity
- **Data loading order**: grupos must be synced to Supabase BEFORE formulas (FK constraint `formulas_grupo_id_fkey`)
- **Save guard**: `dataLoadedRef` prevents save effects from firing on initial mount, avoiding premature Supabase writes before dependent data (grupos) is loaded
- **Variantes**: Use upsert (not delete+insert) to avoid duplicate key errors on concurrent saves
- **Admin user**: contato@ohanaclean.com.br / admin123
- **RLS**: Policies allow both `anon` and `authenticated` roles for all tables
- **localStorage**: Used as cache/fallback when Supabase is unreachable

## Report Header/Footer Editor

- **Component**: `src/components/HeaderFooterEditor.tsx` — full-screen visual editor for designing custom report headers and footers
- **Features**: Drag/resize text boxes and images, font/size/color/alignment controls, bold/italic/underline, image upload (PNG/JPEG/SVG), company logo insertion, adjustable header/footer heights, live preview
- **Types**: `ReportElement`, `ReportElementStyle` in `src/types/index.ts`; `ReportTemplateConfig` extended with `headerHeight`, `footerHeight`, `headerElements`, `footerElements`
- **Integration**: Accessed from `ReportConfig.tsx` via "Editar Cabeçalho / Rodapé" button per template
- **Rendering**: `ReportTemplate.tsx` renders custom elements using percentage-based positioning (normalized from 794px editor canvas) for responsive scaling across screen and print
- **Templates**: Saved to localStorage, assignable to specific report types (Fórmula, Proporção, Precificação, Vendas)

## Version 1.46.0 Changes

- **Precificação button in Formulas**: Added DollarSign button to each formula card (grid and list views) that navigates to the Precificação tab. Gated by `canNavigatePrecificacao` permission check.
- **Permission-gated navigation**: All `onNavigateTo('precificacao')` calls in Formulas and Relatorios now check `hasPermission(currentUser, groups, 'precificacao', 'view')` before showing buttons.
- **unitVolume persistence**: `dataService.precificacao` now saves/loads `unit_volume` column to/from Supabase, replacing the old `unitType` approach.
- **Migration SQL updated**: `migration_v1.44.sql` now includes: `unit_volume` column on `precificacao` table, `listas_preco` table creation, `insumo_variantes` table creation (with `codigo` column), and RLS policies for new tables.
- **Decimal formatting**: Quantities use 3 decimal places (`0,000`), values/costs use 2 decimal places (`0,00`), all in pt-BR locale.

## Version 1.45.0 Changes

- **Embalagem auto-matching in ProporcaoTab**: When selecting a volume (e.g., 2L), non-chemical insumos with variants are automatically matched to the correct variant price. Helper functions `extractVolumeFromName()` and `findMatchingVariant()` parse variant names (500ml, 1L, 2L, 5L) to match the selected embalagemVolume. Matched variant name and price shown in checkbox area and table.
- **ProportionReport updated**: Now receives `embalagemVolume` and `insumosData`, shows separate sections for Químicos and Materiais (non-chemicals) with variant-matched prices. Includes safe division guards for zero quantities.
- **Precificação dynamic volumes**: Replaced hardcoded '2L' | '5L' `unitType` with numeric `unitVolume`. Available volumes derived dynamically from embalagem insumo variants. Cost calculation split: `calcularCustoQuimicoPorLitro()` * volume + `calcularCustoNaoQuimicosPorUnidade()` with variant matching.
- **Relatórios pricing button**: Single "Ver Preços" button showing saved volume, replaces old hardcoded 2L/5L buttons. Uses `unitVolume` with backward compat for legacy `unitType`.

## Version 1.44.0 Changes

- **ProporcaoTab restructured**: Non-chemical items (embalagem, rótulo, tampa) are now selected via checkboxes at proportion time instead of being locked in the formula. Chemicals scale by volume (`totalVolume / rendimento`), non-chemicals scale by unit count (`quantidade * qty_per_unit`). New "Volume por Embalagem" selector with predefined buttons (0.5L–20L). KPI cards: Volume Total, Fator Químicos, Custo por Unidade.
- **Anotações per-user isolation**: Notes filtered by userId in both localStorage (`ohana_notes_${userId}`) and Supabase (`user_id` column). Hydration guard prevents cross-user data leakage during user switches.
- **Dashboard improvements**: Compact KPI cards, revenue chart type selector (Area/Bar/Line), fixed horizontal bar chart icon (BarChart3)
- **Sidebar active tab**: Curved connection style using CSS radial-gradient pseudo-elements for active menu items
