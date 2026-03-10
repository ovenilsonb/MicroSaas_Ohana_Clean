# Arquitetura MVC - Sistema Ohana-Clean

O projeto **Ohana-Clean** é uma aplicação moderna do tipo *Single Page Application* (SPA) construída com React no Frontend e Supabase (BaaS) no Backend. 

Neste tipo de pilha tecnológica (React + Supabase), o padrão **MVC (Model-View-Controller)** não opera da mesma forma que em frameworks tradicionais de servidor (como Laravel, Django ou Ruby on Rails). Em vez disso, a arquitetura é distribuída e focada no cliente (*Client-Side MVC*). 

Abaixo, detalhamos como o padrão MVC é implementado e organizado no seu sistema:

---

## 1. M (Model) - Camada de Dados e Lógica de Negócios
O Model é responsável por representar e gerenciar a estrutura dos dados, estado da aplicação e as regras de persistência.

No Ohana-Clean, o **Model** está dividido entre o Backend (Supabase/PostgreSQL) e o Frontend (Tipos e Libs):

### No Backend (Supabase/Postgres)
- **Banco de Dados Relacional (`database.sql`):** Define rigidamente o esquema de tabelas (`insumos`, `formulas`, `clientes`, `pedidos`, etc.), chaves primárias e relacionamentos.
- **Row Level Security (RLS) & Políticas:** Funciona como camada de regra de negócio, ditando quem pode ler, inserir ou deletar os dados.

### No Frontend (`src/`)
- **Tipagens em `src/types/`:** Contém as interfaces do TypeScript (ex: `IInsumo`, `IPedido`). Estas tipagens são representações vitais da estrutura exata vinda do banco de dados, ditando o "molde" dos Modelos no lado cliente.
- **Conectividade em `src/lib/`:** Arquivos como `supabase.ts` servem como a "Ponte de Acesso" ao modelo. É através do cliente do Supabase que os dados brutos são resgatados ou modificados.

---

## 2. V (View) - Camada de Apresentação
A View é 100% responsável pelo que o usuário vê e como ele interage com o sistema. Ela deve ser o mais "burra" possível em relação às regras de negócio, focando apenas na exibição e captura de eventos (cliques e digitação).

No Ohana-Clean, a **View** é inteiramente baseada em **React** e estilizada com **Tailwind CSS**:

- **Componentes Visuais (`src/components/`):** Todos os arquivos de UI que montam a tela. Isso inclui botões, campos de entrada, formulários, cartões, modais estilizados com Tailwind e as listagens.
- **Estilização e Tema (`src/index.css` & `tailwind.config`):** Contêm o sistema geral de design.
- **Bibliotecas Visuais:**
  - **Framer Motion:** Age como a "roupagem animada" da View, gerando transições suaves de entrada e saída.
  - **Recharts:** Renderiza a View visual dos dados em formato de Gráficos (Dashboard).
  - **React Grid Layout:** Renderiza as Views móveis / arrastáveis de painel.
  - **Lucide React:** Responsável pela iconografia da View.

---

## 3. C (Controller) - Camada de Controle e Fluxo
O Controller é o maestro. Ele ouve de uma View (ex: usuário clicou em "Salvar Produto") e toma decisões comunicando-se com o Model (Mandando salvar no Supabase). Depois ele reage, alterando a View para carregar ou mostrar sucesso/erro.

No Ohana-Clean, o **Controller** não é uma pasta única, ele é implementado através do **ecosistema de Hooks e Páginas do React**:

- **React Hooks Customizados (`src/hooks/`):** Esta é a **principal camada controladora** no React moderno. 
  - Se você tem um hook chamado `useInsumos()` ou `useAuth()`, ele encapsula a lógica de chamar o Model (Supabase) e devolver estados mapeados (`isLoading`, `data`, `error`) de volta à View.
- **Lógicas Utilitárias (`src/utils/`):** Controlam o formato de dados antes de processar ou exibir. São os validadores e formatadores (ex: mascarar CPF, formatar moeda para BRL).
- **Componentes "Stateful" (Smart Components / Páginas):** Componentes maiores que gerenciam o ciclo de vida e estado condicional (Ex: Se o retorno do Model falha com erro 404, o Controller diz à View para mostrar uma "Tela Não Encontrada").

---

## Resumo prático do Fluxo (MVC Action)
Se o usuário tenta cadastrar um novo Insumo, o caminho flui assim:

1. **(View)** O usuário preenche os campos do formulário no componente `FormularioInsumo.tsx` e clica em Salvar.
2. **(Controller)** O clique aciona uma função controladora no componente ou em um `Hook`. O Controller pega os dados validados (talvez processados pelo diretório `/utils`) e os despacha.
3. **(Model)** O cliente do backend em `src/lib/supabase` pega a estrutura empacotada mapeada por `src/types/`, a envia para o banco de dados Supabase na nuvem, que valida a RLS. O banco grava e devolve sucesso.
4. **(Controller)** Recebe a resposta de sucesso e atualiza seu estado interno de tela (Fecha o Loading).
5. **(View)** Reage à atualização do estado do Controller para mostrar um modal verde com a mensagem "Insumo salvo com sucesso".