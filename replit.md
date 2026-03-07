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
- **Tables (16+)**: insumos, insumo_variantes, formulas, formula_insumos, formula_historico, grupos, clientes, pedidos, pedido_itens, ordens_producao, producao_insumos_usados, produtos_estoque, movimentacoes_estoque, listas_preco, precificacao, anotacoes, usuarios, grupos_acesso
- **DB columns**: snake_case; React state: camelCase; dataService.ts has explicit mappers for each entity
- **Data loading order**: grupos must be synced to Supabase BEFORE formulas (FK constraint `formulas_grupo_id_fkey`)
- **Save guard**: `dataLoadedRef` prevents save effects from firing on initial mount, avoiding premature Supabase writes before dependent data (grupos) is loaded
- **Variantes**: Use upsert (not delete+insert) to avoid duplicate key errors on concurrent saves
- **Admin user**: contato@ohanaclean.com.br / admin123
- **RLS**: Policies allow both `anon` and `authenticated` roles for all tables
- **localStorage**: Used as cache/fallback when Supabase is unreachable
