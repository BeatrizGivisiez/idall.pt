# Ordery HQ — Documentação Técnica Completa

> Plataforma SaaS de cardápio digital com integração WhatsApp e painel multi-tenant.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Arquitetura de Dados (Firestore)](#4-arquitetura-de-dados-firestore)
5. [Tipos e Interfaces](#5-tipos-e-interfaces)
6. [Autenticação e Controle de Acesso](#6-autenticação-e-controle-de-acesso)
7. [Regras de Segurança Firestore](#7-regras-de-segurança-firestore)
8. [Contextos Globais](#8-contextos-globais)
9. [Roteamento](#9-roteamento)
10. [Páginas Públicas](#10-páginas-públicas)
11. [Painel do Restaurante (Admin)](#11-painel-do-restaurante-admin)
12. [Painel Master (Super Admin)](#12-painel-master-super-admin)
13. [Componentes Compartilhados](#13-componentes-compartilhados)
14. [Integração WhatsApp](#14-integração-whatsapp)
15. [Sistema de Temas (Whitelabel)](#15-sistema-de-temas-whitelabel)
16. [Persistência do Carrinho](#16-persistência-do-carrinho)
17. [Notificações em Tempo Real](#17-notificações-em-tempo-real)
18. [Utilitários](#18-utilitários)
19. [Configuração Firebase](#19-configuração-firebase)
20. [Fluxos Principais](#20-fluxos-principais)
21. [Variáveis de Ambiente](#21-variáveis-de-ambiente)

---

## 1. Visão Geral

O **Ordey HQ** é uma plataforma multi-tenant que permite a restaurantes criar e gerenciar um cardápio digital acessível por link ou QR code. Pedidos feitos pelos clientes chegam em tempo real no painel do restaurante e podem ser encaminhados via WhatsApp com um clique.

### Perfis de Usuário

| Perfil | Acesso | Identificação |
|--------|--------|---------------|
| **Cliente** | Cardápio público (`/r/:slug`) | Sem autenticação |
| **Restaurante (Admin)** | Painel admin (`/admin`) | Firebase Auth (e-mail/senha) |
| **Master (Super Admin)** | Painel master (`/superadmin`) | E-mail fixo: `idallsolucoes@gmail.com` |

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI Framework | React | 19 |
| Linguagem | TypeScript | 5.8.2 |
| Build tool | Vite | 6.2.3 |
| Estilização | Tailwind CSS | 4.1.14 |
| Roteamento | React Router DOM | v7 |
| Backend / DB | Firebase Firestore | 12.x |
| Autenticação | Firebase Auth | 12.x |
| Ícones | Lucide React | — |
| Notificações | react-hot-toast | — |
| Datas | date-fns (pt-BR) | — |
| QR Code | qrcode.react | — |
| Formatação | clsx + tailwind-merge | — |

---

## 3. Estrutura de Arquivos

```
/
├── index.html                        # Entry point HTML
├── vite.config.ts                    # Vite + Tailwind + aliases
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependências e scripts
├── firebase-applet-config.json       # Credenciais Firebase
├── firebase-blueprint.json           # Schema das coleções Firestore
├── firestore.rules                   # Regras de segurança Firestore
├── functions/
│   └── index.js                      # Cloud Functions (template)
└── src/
    ├── main.tsx                      # Ponto de entrada React
    ├── App.tsx                       # Rotas e providers
    ├── index.css                     # Tailwind + utilitários globais
    ├── types/
    │   └── index.ts                  # Interfaces TypeScript globais
    ├── lib/
    │   └── utils.ts                  # Funções utilitárias
    ├── services/
    │   └── firebase.ts               # Inicialização Firebase
    ├── contexts/
    │   ├── AuthContext.tsx           # Auth + tenant + super-admin
    │   └── CartContext.tsx           # Carrinho de compras
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx            # Botão reutilizável
    │   │   └── Input.tsx             # Input reutilizável
    │   ├── admin/
    │   │   ├── AdminLayout.tsx       # Shell do painel admin
    │   │   └── MenuQrCode.tsx        # Componente QR code
    │   ├── superadmin/
    │   │   └── SuperAdminLayout.tsx  # Shell do painel master
    │   └── public/
    │       └── CartModal.tsx         # Modal do carrinho + checkout
    └── pages/
        ├── public/
        │   ├── Home.tsx              # Landing page
        │   └── RestaurantMenu.tsx    # Cardápio público
        ├── admin/
        │   ├── Login.tsx             # Login / cadastro
        │   ├── Dashboard.tsx         # Kanban de pedidos
        │   ├── MenuManager.tsx       # Gestão do cardápio
        │   └── Settings.tsx          # Configurações do restaurante
        └── superadmin/
            └── SuperAdminDashboard.tsx # Painel master
```

---

## 4. Arquitetura de Dados (Firestore)

O banco usa o **Firebase Firestore** no plano Spark (gratuito), banco de dados padrão (`(default)`).

### Coleções

```
tenants/                              # Coleção raiz — um doc por restaurante
  {tenantId}/
    ├── [campos do tenant]
    ├── categories/                   # Subcoleção de categorias
    │   └── {categoryId}/
    │       ├── name: string
    │       └── order: number
    ├── products/                     # Subcoleção de produtos
    │   └── {productId}/
    │       ├── name: string
    │       ├── description: string
    │       ├── price: number
    │       ├── promotionalPrice: number  # 0 = sem promoção
    │       ├── imageUrl: string
    │       ├── categoryId: string
    │       └── active: boolean
    └── orders/                       # Subcoleção de pedidos
        └── {orderId}/
            ├── customerName: string
            ├── customerPhone: string
            ├── customerAddress: string
            ├── items: OrderItem[]
            ├── total: number
            ├── status: OrderStatus
            └── createdAt: number     # timestamp ms
```

### Campos do Documento Tenant

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ownerId` | string | UID do Firebase Auth do dono |
| `name` | string | Nome do restaurante |
| `slug` | string | URL única (ex: `pizzaria-do-ze`) |
| `whatsapp` | string | Número com DDI (ex: `5511999999999`) |
| `logoUrl` | string | URL pública da logo |
| `themeColor` | string | Cor hex do tema (ex: `#f97316`) |
| `isOpen` | boolean | Restaurante aberto/fechado |
| `createdAt` | number | Timestamp de criação (ms) |

---

## 5. Tipos e Interfaces

Definidos em `src/types/index.ts`.

```typescript
interface Tenant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  whatsapp: string;
  logoUrl?: string;
  themeColor?: string;
  isOpen?: boolean;
  createdAt: number;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;   // 0 ou undefined = sem promoção
  imageUrl?: string;
  active: boolean;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

type OrderStatus = 'recebido' | 'preparando' | 'saiu' | 'finalizado';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}
```

---

## 6. Autenticação e Controle de Acesso

Gerenciado pelo `AuthContext` (`src/contexts/AuthContext.tsx`).

### Fluxo de Autenticação

1. `onAuthStateChanged` escuta mudanças de sessão do Firebase Auth.
2. Ao autenticar, busca o documento `tenants/{uid}` para carregar os dados do restaurante.
3. Compara o e-mail do usuário com `SUPER_ADMIN_EMAIL` para definir `isSuperAdmin`.

### Dados Expostos pelo Contexto

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `user` | `User \| null` | Objeto do Firebase Auth |
| `tenant` | `Tenant \| null` | Dados do restaurante logado |
| `loading` | `boolean` | Auth ainda carregando |
| `isSuperAdmin` | `boolean` | `true` se e-mail = master |
| `logout()` | `Promise<void>` | Desloga e limpa sessão |
| `refreshTenant()` | `Promise<void>` | Recarrega dados do tenant |

### Proteção de Rotas

- **AdminLayout**: redireciona para `/admin/login` se não autenticado.
- **SuperAdminLayout**: redireciona para `/admin/login` se não autenticado; redireciona para `/admin` se autenticado mas não for super-admin.
- Após login, super-admin é encaminhado para `/superadmin`; demais para `/admin`.

---

## 7. Regras de Segurança Firestore

Arquivo: `firestore.rules`

| Operação | Quem pode |
|----------|-----------|
| Ler tenant | Qualquer pessoa |
| Escrever tenant | Apenas o dono (`request.auth.uid == resource.data.ownerId`) |
| Ler categorias/produtos | Qualquer pessoa |
| Escrever categorias/produtos | Apenas o dono do tenant pai |
| Criar pedido | Qualquer pessoa (clientes não autenticados) |
| Ler/atualizar/deletar pedido | Apenas o dono do tenant |

> **Importante:** o super-admin não tem acesso especial via Firestore rules. Ele só lê a coleção raiz `tenants` (que é pública para leitura). Pedidos de outros restaurantes são inacessíveis mesmo para o master.

---

## 8. Contextos Globais

### AuthContext (`src/contexts/AuthContext.tsx`)

Responsável por toda autenticação e dados do tenant logado. Expõe `useAuth()` hook para consumo nos componentes.

### CartContext (`src/contexts/CartContext.tsx`)

Gerencia o carrinho de compras do cliente.

| Método | Descrição |
|--------|-----------|
| `addItem(product)` | Adiciona produto; usa `promotionalPrice` se disponível |
| `removeItem(productId)` | Remove item do carrinho |
| `updateQuantity(productId, qty)` | Atualiza quantidade; qty ≤ 0 remove |
| `clearCart()` | Esvazia o carrinho |

- **Persistência**: salvo no `localStorage` com chave `@SaasMenu:cart`.
- **Total**: calculado automaticamente com base em `price * quantity`.

---

## 9. Roteamento

Configurado em `src/App.tsx` com React Router v7.

```
/                          → Home (landing page)
/r/:slug                   → RestaurantMenu (cardápio público)
/admin/login               → Login / Cadastro
/admin                     → Dashboard (pedidos) [protegido]
/admin/menu                → MenuManager (cardápio) [protegido]
/admin/settings            → Settings (configurações) [protegido]
/superadmin                → SuperAdminDashboard [protegido + master]
```

Providers aninhados (de fora para dentro):
```
AuthProvider → CartProvider → Router → Toaster
```

---

## 10. Páginas Públicas

### 10.1 Home (`/`)

Landing page de apresentação do produto.

**Seções:**
- Header com logo e botões de Login / Cadastro.
- Hero: headline principal, descrição, CTA "Criar meu cardápio grátis".
- Features: 3 cards (Cardápio PWA, Painel em tempo real, WhatsApp com 1 clique).
- Footer com copyright.

---

### 10.2 Cardápio do Restaurante (`/r/:slug`)

Página pública acessada pelo cliente do restaurante.

**Funcionalidades:**

**Carregamento de dados (tempo real):**
- `onSnapshot` no tenant via `slug` — atualiza tema/nome ao vivo.
- `onSnapshot` em `products` e `categories` do tenant encontrado.

**Filtros de produtos:**
- **Todos** — exibe todos os produtos, com produtos em promoção primeiro.
- **Promoção** — exibe apenas produtos com `promotionalPrice > 0`. Aparece somente se houver ao menos um produto em oferta.
- **Categorias** — geradas dinamicamente; produtos da categoria filtrados e ordenados com promoções na frente.

**Exibição de produto:**
- Imagem (ou ícone placeholder).
- Nome + badge de desconto (`-X%`) se em promoção.
- Descrição (limitada a 2 linhas).
- Preço promocional destacado + preço original riscado.
- Botão `+` para adicionar ao carrinho (visível apenas se restaurante aberto).

**Estado fechado:**
- Banner vermelho "Restaurante Fechado no Momento".
- Botão `+` e sacola ocultos.

**Carrinho:**
- Ícone de sacola com contagem de itens no header.
- Barra de checkout fixa no rodapé quando há itens.
- Abre `CartModal` ao clicar.

---

## 11. Painel do Restaurante (Admin)

Acessível via `/admin`. Requer autenticação.

### 11.1 Login / Cadastro (`/admin/login`)

**Modo Login:**
- Campos: e-mail, senha.
- Redireciona master para `/superadmin`, demais para `/admin`.

**Modo Cadastro:**
- Campos: e-mail, nome do restaurante, slug (URL exclusiva), senha.
- Cria conta no Firebase Auth.
- Cria documento em `tenants/{uid}` com dados iniciais.
- Redireciona para `/admin/settings` para completar configuração.
- Slug: apenas letras minúsculas, números e hífens.

---

### 11.2 Dashboard — Gestão de Pedidos (`/admin`)

Painel Kanban com 4 colunas de status.

**Colunas de status:**

| Status | Próxima ação | Mensagem WhatsApp |
|--------|-------------|-------------------|
| `recebido` | → Preparando | "Seu pedido foi confirmado e está sendo preparado!" |
| `preparando` | → Saiu para entrega | "Seu pedido saiu para entrega!" |
| `saiu` | → Finalizado | "Seu pedido foi entregue. Obrigado!" |
| `finalizado` | — | — |

**Funcionalidades:**
- Listener `onSnapshot` em `orders` do tenant, ordenados por `createdAt desc`.
- Alerta sonoro (Web Audio API) ao receber novo pedido.
- Notificação do browser (solicita permissão na primeira vez).
- Clique no card do pedido abre **OrderDetailModal**.

**OrderDetailModal:**
- ID do pedido (últimos 6 chars), data/hora formatada.
- Dados do cliente: nome, telefone, endereço.
- Lista de itens com quantidade e subtotal.
- Total do pedido.
- Badge de status atual.
- Botão de ação para avançar status + envio opcional de WhatsApp.
- Botão "Contato WhatsApp" abre conversa direta.

---

### 11.3 Gestão do Cardápio (`/admin/menu`)

**Visualizações:**
- **Lista**: uma linha por produto, compacta.
- **Grid**: cards com imagem, alternável via botão.

**Filtros:**
- Barra de categorias (Todos + cada categoria cadastrada).

**Gestão de Produtos:**
- Formulário modal com campos:
  - Nome, descrição, preço, preço promocional.
  - URL da imagem (com preview ao vivo).
  - Categoria (select com as categorias do tenant).
- Validação: preço promocional deve ser menor que o preço original.
- Salvo em `tenants/{uid}/products/{id}`.
- Ações: criar, editar, excluir (com confirmação).

**Gestão de Categorias:**
- Seção inline no MenuManager.
- Criar nova categoria (nome).
- Excluir categoria existente.
- Salvo em `tenants/{uid}/categories/{id}`.

---

### 11.4 Configurações (`/admin/settings`)

**Campos configuráveis:**

| Campo | Descrição |
|-------|-----------|
| Status (aberto/fechado) | Toggle booleano |
| Nome do restaurante | Exibido no cardápio público |
| Slug | URL exclusiva (`/r/{slug}`) |
| WhatsApp | Número para receber pedidos |
| URL da logo | Imagem exibida no header do cardápio |
| Cor do tema | Hex picker com preview RGB |

- Salvo via `updateDoc` em `tenants/{uid}`.
- Exibe URL do cardápio ao vivo.
- Componente `MenuQrCode` com QR code e botão de copiar link.

---

## 12. Painel Master (Super Admin)

Acessível via `/superadmin`. Exclusivo para `idallsolucoes@gmail.com`.

### SuperAdminDashboard

**Métricas (cards superiores):**

| Card | O que mostra |
|------|-------------|
| Total clientes | Quantidade de tenants cadastrados |
| Abertos agora | `isOpen !== false` |
| Fechados agora | `isOpen === false` |
| Novos este mês | `createdAt` no mês/ano atual |

**Tabela de Restaurantes:**

| Coluna | Visibilidade |
|--------|-------------|
| Restaurante (logo + nome + whatsapp) | Sempre |
| Slug | sm+ |
| Data de cadastro | md+ |
| Status (Aberto/Fechado) | Sempre |
| Link do cardápio | Sempre |

- Busca em tempo real via `onSnapshot` na coleção `tenants` (sem `orderBy` — ordenação feita no cliente por `createdAt desc` para evitar necessidade de índice Firestore).
- Ícone de link externo abre `/r/{slug}` em nova aba.

---

## 13. Componentes Compartilhados

### Button (`src/components/ui/Button.tsx`)

```typescript
// Variantes: primary | secondary | outline | danger | ghost
// Tamanhos: sm | md | lg
// Props extras: isLoading (spinner), disabled
<Button variant="primary" size="md" isLoading={false}>
  Texto
</Button>
```

### Input (`src/components/ui/Input.tsx`)

```typescript
// Props: label?, error?, + todos os HTMLInputAttributes
<Input label="E-mail" type="email" error="Campo obrigatório" />
```

### AdminLayout (`src/components/admin/AdminLayout.tsx`)

- Sidebar desktop (w-64) com logo, nav e avatar do usuário.
- Bottom nav mobile com ícones.
- Nav items: Pedidos, Cardápio, Configurações.
- Botão de logout e link para o cardápio público.

### SuperAdminLayout (`src/components/superadmin/SuperAdminLayout.tsx`)

- Mesmo padrão visual do AdminLayout.
- Badge "Super Admin" em laranja.
- Nav único: Restaurantes.
- Header mostra e-mail do usuário master.

### MenuQrCode (`src/components/admin/MenuQrCode.tsx`)

- QR code gerado client-side (biblioteca `qrcode.react`).
- URL: `{window.location.origin}/r/{slug}`.
- Botão de copiar link com toast de confirmação.

### CartModal (`src/components/public/CartModal.tsx`)

Drawer deslizante à direita (animação CSS `slide-in-right`).

**Seções:**
1. **Header**: título "Seu Pedido" + botão fechar.
2. **Lista de itens**: nome, preço unitário, controles de quantidade (−/+), botão remover.
3. **Total**: soma de `price * quantity`.
4. **Formulário de checkout**:
   - Nome do cliente (obrigatório).
   - Telefone (obrigatório).
   - Endereço de entrega (obrigatório).
5. **Botão "Fazer Pedido"**: salva pedido no Firestore e abre WhatsApp.

**Todas as cores** (botões, total, fundo do header) usam `tenant.themeColor`.

---

## 14. Integração WhatsApp

### Fluxo do Pedido (Cliente → Restaurante)

1. Cliente confirma carrinho no `CartModal`.
2. Pedido salvo em `tenants/{tenantId}/orders/{orderId}` com status `recebido`.
3. WhatsApp abre com mensagem pré-preenchida para o número do restaurante:

```
Olá! Gostaria de fazer um pedido:

- 2x Pizza Margherita – R$ 59,80
- 1x Coca-Cola – R$ 8,00

*Total: R$ 67,80*

*Nome:* João Silva
*Telefone:* 11999999999
*Endereço:* Rua das Flores, 123
```

URL gerada: `https://wa.me/{whatsapp}?text={encodedMessage}`

### Fluxo de Status (Restaurante → Cliente)

Ao avançar o status de um pedido, o admin pode enviar notificação WhatsApp ao cliente:

| Status | Mensagem enviada |
|--------|-----------------|
| preparando | "Seu pedido foi confirmado e está sendo preparado!" |
| saiu | "Seu pedido saiu para entrega!" |
| finalizado | "Seu pedido foi entregido. Obrigado!" |

Utilitário `formatPhoneForWA(phone)` remove caracteres não-numéricos antes de montar a URL.

---

## 15. Sistema de Temas (Whitelabel)

Cada restaurante pode personalizar sua cor de tema (`themeColor`).

**Onde é aplicada:**
- Header do cardápio público (background).
- Botões de filtro de categoria (ativo).
- Botão `+` de adicionar ao carrinho.
- Preço do produto.
- Contagem de itens na sacola.
- Toda a interface do `CartModal`.
- Total no rodapé de checkout.

**Padrão:** `#f97316` (orange-500) caso não configurado.

A cor é carregada via `onSnapshot` no tenant, então mudanças em **Configurações** refletem instantaneamente no cardápio público sem reload.

---

## 16. Persistência do Carrinho

- Chave localStorage: `@SaasMenu:cart`.
- O carrinho persiste entre reloads da página.
- **Atenção:** o carrinho é global (não separado por restaurante). Recomendável limpar ao trocar de restaurante.
- Preço armazenado: `promotionalPrice` se existir, caso contrário `price`.

---

## 17. Notificações em Tempo Real

### Novos Pedidos

O Dashboard escuta `onSnapshot` nos pedidos e detecta documentos novos comparando com o array anterior.

**Ao detectar novo pedido:**
1. Toca som gerado por Web Audio API (beep sintético).
2. Exibe notificação nativa do browser (se permissão concedida).
3. O pedido aparece na coluna "Recebido" imediatamente.

**Permissão de notificação:** solicitada automaticamente ao carregar o Dashboard pela primeira vez.

---

## 18. Utilitários

Arquivo: `src/lib/utils.ts`

| Função | Uso |
|--------|-----|
| `cn(...classes)` | Mescla classes Tailwind com deduplicação (`clsx` + `tailwind-merge`) |
| `formatCurrency(value)` | Formata número em BRL: `R$ 1.234,56` |
| `formatPhoneForWA(phone)` | Remove tudo exceto dígitos para montar URL WhatsApp |

---

## 19. Configuração Firebase

### firebase-applet-config.json

```json
{
  "projectId": "saas-menu-idall",
  "appId": "...",
  "apiKey": "...",
  "authDomain": "saas-menu-idall.firebaseapp.com",
  "storageBucket": "saas-menu-idall.appspot.com",
  "messagingSenderId": "..."
}
```

> **Banco de dados:** `(default)` — plano Spark (gratuito). Não usar `firestoreDatabaseId` para não conectar ao banco Enterprise.

### Cloud Functions (template)

Arquivo: `functions/index.js`

- `onTenantCreated`: trigger em novo documento na coleção `tenants`. Pronto para enviar e-mail de boas-vindas.
- `cleanupOldOrders`: função agendada (comentada) para limpeza de pedidos finalizados.

---

## 20. Fluxos Principais

### 20.1 Cadastro de Novo Restaurante

```
Cliente acessa /admin/login?mode=register
→ Preenche e-mail, senha, nome, slug
→ createUserWithEmailAndPassword (Firebase Auth)
→ setDoc em tenants/{uid} com dados iniciais
→ Redireciona para /admin/settings
→ Admin configura tema, logo, WhatsApp
```

### 20.2 Recebimento de Pedido

```
Cliente acessa /r/{slug}
→ Visualiza cardápio (real-time)
→ Adiciona itens ao carrinho
→ Abre CartModal → preenche dados
→ addDoc em tenants/{uid}/orders
→ WhatsApp abre para o restaurante
→ Dashboard do admin exibe pedido em "Recebido"
→ Som + notificação no browser do admin
```

### 20.3 Progressão de Status do Pedido

```
Admin clica no card do pedido → OrderDetailModal
→ Clica no botão de ação (ex: "Marcar como Preparando")
→ updateDoc status = 'preparando'
→ Opcional: abre WhatsApp para notificar cliente
→ Card move para a coluna correta no Kanban
```

### 20.4 Login do Master

```
Master acessa /admin/login
→ Digita idallsolucoes@gmail.com + senha
→ signInWithEmailAndPassword
→ isSuperAdmin = true
→ Redireciona para /superadmin
→ Dashboard mostra todos os tenants cadastrados
```

---

## 21. Variáveis de Ambiente

| Variável | Uso |
|----------|-----|
| `GEMINI_API_KEY` | API do Google AI Studio (injetada pelo Vite, não utilizada no código atual) |
| `APP_URL` | URL base do Cloud Run (não utilizada diretamente no código atual) |

> As credenciais Firebase estão em `firebase-applet-config.json`, não em variáveis de ambiente.

---

## Limitações Conhecidas

| Item | Situação |
|------|---------|
| Carrinho multi-restaurante | Carrinho não é isolado por tenant |
| Pedidos no Super Admin | Super admin não vê pedidos dos restaurantes (bloqueado pelas rules) |
| Upload de imagens | Imagens são inseridas por URL, sem upload direto |
| Ordenação de categorias | Campo `order` existente no schema mas sem drag-and-drop implementado |
| Cloud Functions | Template criado mas nenhuma função está deployada |
| Paginação | Lista de pedidos e produtos sem paginação |

---

*Gerado em: maio de 2026 — SaasMenu v1.0*
