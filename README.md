# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

# Ricardo Estoque - Sistema Multi-Loja

Sistema completo de gestão de estoque para múltiplas lojas com compartilhamento de produtos.

## 🏗️ Arquitetura

```
ricardo-estoque/
├── frontend/          # Aplicação Svelte + TypeScript
├── backend/           # API Node.js + Express + Prisma
├── shared/            # Tipos TypeScript compartilhados
└── package.json       # Scripts unificados
```

## 🚀 Tecnologias

### Frontend

- **Svelte + TypeScript** - Framework reativo
- **Vite** - Build tool
- **Axios** - Cliente HTTP
- **CSS Grid** - Layout responsivo

### Backend

- **Node.js + Express** - API REST
- **Prisma ORM** - Banco de dados
- **MySQL** - Database
- **TypeScript** - Tipagem estática
- **Zod** - Validação de dados

### Banco de Dados

- **MySQL** - Sistema multi-loja
- **Produtos compartilhados** entre lojas
- **Estoque independente** por loja
- **Clientes por loja**
- **Vendas e parcelas**

## 📋 Pré-requisitos

- Node.js 18+
- MySQL 8.0+
- npm 9+

## 🛠️ Configuração

### 1. Clone e instale dependências

```bash
npm run install:all
```

### 2. Configure o banco de dados

Crie um banco MySQL:

```sql
CREATE DATABASE ricardo_estoque;
```

Configure o arquivo `.env` no backend:

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/ricardo_estoque"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Configure o banco e execute migrations

```bash
# Gerar Prisma Client
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular dados iniciais
npm run db:seed
```

### 4. Inicie o desenvolvimento

```bash
# Inicia frontend + backend simultaneamente
npm run dev

# Ou separadamente:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

## 🎯 Funcionalidades

### ✅ Implementado

#### Backend

- [x] API REST completa
- [x] Schema do banco multi-loja
- [x] Prisma ORM configurado
- [x] Seed de dados iniciais
- [x] Endpoints para produtos, estoque, vendas, clientes
- [x] Validação com Zod
- [x] CORS configurado

#### Frontend

- [x] Sistema de pagamentos com entrada
- [x] Cálculo de parcelas exato
- [x] Interface responsiva
- [x] Componentes reutilizáveis
- [x] Cliente API configurado
- [x] Types TypeScript

### 🚧 Em Desenvolvimento

- [ ] Integração frontend ↔ backend
- [ ] Autenticação e autorização
- [ ] Relatórios e dashboards
- [ ] Deploy em produção

## 📊 Schema do Banco

### Entidades Principais

```
Company (Empresa)
├── Store (Lojas)
    ├── User (Usuários)
    ├── Customer (Clientes)
    ├── Sale (Vendas)
    └── StockItem (Estoque)

Product (Produtos Compartilhados)
├── StockItem (Estoque por Loja)
└── SaleItem (Itens de Venda)

Sale (Vendas)
├── SaleItem (Itens)
└── Installment (Parcelas)
```

### Características

- **Produtos compartilhados** entre todas as lojas
- **Estoque independente** para cada loja
- **Clientes vinculados** à loja específica
- **Vendas e parcelas** rastreadas por loja
- **Usuários com permissões** por loja

## 🔧 Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev                # Frontend + Backend
npm run dev:frontend       # Apenas frontend
npm run dev:backend        # Apenas backend
```

### Build

```bash
npm run build              # Build completo
npm run build:frontend     # Build frontend
npm run build:backend      # Build backend
```

### Banco de Dados

```bash
npm run db:generate        # Gerar Prisma Client
npm run db:migrate         # Executar migrations
npm run db:push           # Push schema (dev)
npm run db:studio         # Abrir Prisma Studio
npm run db:seed           # Popular dados iniciais
```

### Utilitários

```bash
npm run clean             # Limpar node_modules
npm run type-check        # Verificar tipos TypeScript
```

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Prisma Studio**: http://localhost:5555

## 📁 Estrutura Detalhada

```
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/          # Clientes API
│   │   │   └── components/   # Componentes Svelte
│   │   ├── types-new.ts      # Types atualizados
│   │   └── main.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/          # Endpoints da API
│   │   ├── index.ts         # Servidor Express
│   │   └── seed.ts          # Dados iniciais
│   ├── prisma/
│   │   └── schema.prisma    # Schema do banco
│   └── package.json
│
└── shared/
    ├── src/
    │   └── types.ts         # Types compartilhados
    └── package.json
```

## 🎯 Próximos Passos

1. **Integração API** - Conectar frontend aos endpoints
2. **Autenticação** - Sistema de login/usuários
3. **Dashboard** - Métricas e relatórios
4. **Mobile** - App mobile para vendedores
5. **Deploy** - Produção com Docker

---

**Status**: ✅ Monorepo configurado | 🚧 Integração em desenvolvimento

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```ts
// store.ts
// An extremely simple external store
import { writable } from "svelte/store";
export default writable(0);
```
