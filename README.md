# 🚗 CheckList Car

> App mobile de controle e acompanhamento de manutenções veiculares.

![React Native](https://img.shields.io/badge/React_Native-0.83-blue?logo=react)
![Expo SDK](https://img.shields.io/badge/Expo-SDK_55-black?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Identidade visual](#identidade-visual)
- [Funcionalidades](#funcionalidades)
- [Arquitetura e stack](#arquitetura-e-stack)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados)
- [Regras de negócio](#regras-de-negócio)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e setup](#instalação-e-setup)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Deploy (EAS)](#deploy-eas)
- [Backlog resumido](#backlog-resumido)
- [Contribuindo](#contribuindo)

---

## Sobre o projeto

O **CheckList Car** é um app mobile **offline-first** que ajuda motoristas a nunca perderem um prazo de manutenção. O usuário cadastra seus veículos, define eventos de revisão (filtros, freios, pneus, correias etc.) e recebe alertas visuais e notificações quando os prazos se aproximam — seja por quilometragem ou por data.

O app funciona 100% sem internet para uso do dia a dia. Login social com Google é suportado como conveniência, mas todos os dados ficam armazenados localmente no dispositivo.

---

## Identidade visual

Inspirada nos **Bumbás de Parintins**, o app oferece dois temas alternáveis que seguem automaticamente o tema do sistema operacional (claro/escuro).

|              | Tema claro — Garantido      | Tema escuro — Caprichoso  |
| ------------ | --------------------------- | ------------------------- |
| **Fundo**    | `#FFFFFF`                   | `#0A0A0F`                 |
| **Primário** | `#C8102E` (vermelho)        | `#1565FF` (azul neon)     |
| **Acento**   | `#003B9A` (azul Caprichoso) | `#003B9A` (azul profundo) |
| **Texto**    | `#1A1A1A`                   | `#F0F0F0`                 |

A troca de tema é instantânea via `useColorScheme()` do React Native, sem necessidade de reload. Os tokens são definidos em `constants/theme.ts` e consumidos por `styled-components`.

---

## Funcionalidades

### MVP — Épicos e histórias

| #   | Épico                | Histórias                                                                    |
| --- | -------------------- | ---------------------------------------------------------------------------- |
| 1   | Cadastro de veículos | Cadastro manual, seleção de modelo, listagem, atualização de km              |
| 2   | Gestão de eventos    | Evento pré-definido, personalizado, efetuar revisão, editar/excluir, ordenar |
| 3   | Alertas e dashboard  | Status por urgência (🟢🟠🔴), notificação diária, tela principal             |
| 4   | Histórico            | Histórico por evento, linha do tempo geral do veículo                        |
| 5   | Infraestrutura       | Modelagem de dados, regras de cálculo de alertas                             |
| 6   | Autenticação         | Login local offline, login com Google, recuperação de senha                  |

### Tipos de manutenção pré-cadastrados

| Evento                      | Intervalo padrão                        | Fonte    |
| --------------------------- | --------------------------------------- | -------- |
| Filtro de ar                | 20.000–30.000 km                        | Mann     |
| Velas de ignição            | 10.000 km                               | —        |
| Cabos de ignição            | 50.000 km ou 3 anos                     | —        |
| Limpador de para-brisa      | 12 meses                                | —        |
| Revisão de freios           | 15.000 km                               | Bosch    |
| Fluido de freio             | 10.000 km ou 12 meses                   | Bosch    |
| Suspensão (preventiva)      | 40.000–50.000 km                        | —        |
| Correia dentada             | verificação 15.000 km / troca 50.000 km | Goodyear |
| Líquido de arrefecimento    | 30.000 km ou 12 meses                   | —        |
| Alinhamento e balanceamento | 10.000 km                               | —        |

### Sistema de alertas por km restante

```
percentual_restante = km_restante / intervalo_km × 100

🟢 Verde   → entre 3% e 5% restante   (planejamento)
🟠 Laranja → entre 1% e 2% restante   (atenção)
🔴 Vermelho → < 1% restante ou vencido (urgente)
⬜ Neutro  → > 5% restante            (confortável)
```

> O alerta considera **tanto km quanto data limite** — o que vencer primeiro define o status.

---

## Arquitetura e stack

```
Expo SDK 55 (managed workflow) + React Native 0.83 — Nova Arquitetura obrigatória
```

| Camada             | Tecnologia                          | Versão          |
| ------------------ | ----------------------------------- | --------------- |
| Framework          | Expo (managed)                      | SDK 55          |
| Linguagem          | TypeScript                          | strict mode     |
| Navegação          | Expo Router                         | v4 (file-based) |
| Estilização        | styled-components/native            | v6              |
| Estado global      | Zustand                             | latest          |
| Banco de dados     | expo-sqlite + Drizzle ORM           | latest          |
| Autenticação local | expo-secure-store                   | latest          |
| Login social       | Google Identity (OAuth 2.0)         | latest          |
| Animações          | React Native Reanimated             | v4              |
| Notificações       | expo-notifications                  | latest          |
| Build / Deploy     | EAS Build + EAS Update (OTA)        | latest          |
| Testes             | Jest + React Native Testing Library | latest          |
| Qualidade          | ESLint + Prettier + Husky           | latest          |

> **Atenção:** A Nova Arquitetura é **obrigatória** no Expo SDK 55 (não pode ser desativada). Toda biblioteca adicionada ao projeto deve ser compatível com ela.

---

## Estrutura de pastas

```
checklist-car/
├── app/                          # Expo Router — rotas = arquivos
│   ├── _layout.tsx               # Root layout (ThemeProvider, AuthGuard)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # US-15 / US-16
│   │   └── register.tsx          # US-15
│   └── (tabs)/
│       ├── _layout.tsx           # Tab navigator
│       ├── index.tsx             # US-12 — Dashboard principal
│       ├── vehicles.tsx          # US-03 — Lista de veículos
│       └── history.tsx           # US-14 — Linha do tempo geral
│
├── components/
│   ├── ui/                       # Componentes genéricos
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── AlertIndicator.tsx    # 🟢🟠🔴
│   └── features/                 # Componentes de domínio
│       ├── VehicleCard.tsx
│       ├── EventCard.tsx
│       ├── KmInput.tsx
│       └── EventForm.tsx
│
├── store/                        # Zustand slices
│   ├── authStore.ts
│   ├── vehicleStore.ts
│   └── eventStore.ts
│
├── db/                           # Drizzle ORM
│   ├── schema.ts                 # Definição das tabelas (ver modelo de dados)
│   ├── client.ts                 # Instância do expo-sqlite
│   └── migrations/
│
├── lib/
│   ├── auth.ts                   # Login local + Google OAuth
│   ├── notifications.ts          # expo-notifications
│   ├── alerts.ts                 # Lógica de cálculo de status 🟢🟠🔴
│   └── crypto.ts                 # Hash de senha (bcrypt-like)
│
├── constants/
│   ├── theme.ts                  # Tokens de cor (Bumbás)
│   └── maintenanceEvents.ts      # Intervalos padrão por tipo de evento
│
├── drizzle.config.ts
├── eas.json                      # Perfis: development / preview / production
├── app.json
└── tsconfig.json                 # strict: true
```

---

## Modelo de dados

Definido via **Drizzle ORM** em `db/schema.ts`.

```typescript
// Usuário
usuarios {
  id, nome, email, senha_hash, google_id?, foto_url?, criado_em
}

// Modelos de carro (tabela seed — pré-populada)
modelos_carro {
  id, marca, modelo, ano_inicio, ano_fim
}

// Veículos do usuário
carros {
  id, usuario_id, modelo_id?, placa, nome_apelido, ano, km_atual, criado_em
}

// Tipos de evento (sistema + personalizados pelo usuário)
tipos_evento {
  id, nome, intervalo_km?, intervalo_meses?, origem  // 'sistema' | 'usuario'
}

// Eventos de manutenção vinculados ao veículo
eventos_carro {
  id, carro_id, tipo_evento_id,
  ultima_km_execucao, ultima_data_execucao,
  proxima_km, proxima_data
}

// Registro histórico de km diária
registros_km {
  id, carro_id, km, data_registro
}

// Histórico de execuções (cada vez que o usuário "efetua" uma revisão)
historico_execucao {
  id, evento_carro_id, km_execucao, data_execucao, valor?, local?
}
```

---

## Regras de negócio

### Cálculo de próxima manutenção

```typescript
proxima_km = ultima_km_execucao + intervalo_km;
proxima_data = ultima_data_execucao + intervalo_meses;

km_restante = proxima_km - km_atual_do_carro;
percentual_restante = (km_restante / intervalo_km) * 100;
```

### Status de alerta

```typescript
function getAlertStatus(percentual: number, dataVencida: boolean): AlertStatus {
  if (dataVencida || percentual < 1) return "vermelho";
  if (percentual <= 2) return "laranja";
  if (percentual <= 5) return "verde";
  return "neutro";
}
```

### Evento com intervalo duplo (km + data)

Se o evento tem os dois critérios definidos, o status crítico é acionado quando **qualquer um dos dois** vencer primeiro.

---

## 🌐 Considerações para Web

Para que o banco de dados `expo-sqlite` funcione no navegador, o projeto utiliza `wa-sqlite` com WebAssembly (WASM). Isso exige:

1.  **Headers de Segurança**: O servidor deve fornecer os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`. No desenvolvimento, isso já está configurado no `metro.config.js`.
2.  **Suporte WASM**: O Metro está configurado para incluir arquivos `.wasm` no bundle.
3.  **Fallback de Storage**: Como o `expo-secure-store` não é nativo na Web, utilizamos uma abstração em `lib/storage.ts` que faz o fallback automático para `localStorage`.

---

## Arquitetura e stack

- Node.js >= 20
- npm >= 10 ou yarn >= 4
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Conta no [Expo](https://expo.dev) (para EAS)
- Projeto no [Google Cloud Console](https://console.cloud.google.com) com OAuth 2.0 configurado (para login com Google)

---

## Instalação e setup

````bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/checklist-car.git
cd checklist-car

# 2. Instalar dependências
```bash
npm install --legacy-peer-deps
````

_Nota: O uso de --legacy-peer-deps é necessário devido às versões experimentais do Reanimated 4 e Worklets._

# 3. Configurar variáveis de ambiente

cp .env.example .env

# Editar .env com suas credenciais (ver seção abaixo)

# 4. Rodar as migrations do banco local

npx drizzle-kit push

# 5. Iniciar o app em modo desenvolvimento

npx expo start

````

Para rodar em dispositivo físico, escaneie o QR code com o app **Expo Go** (Android) ou via **TestFlight** (iOS com build de desenvolvimento).

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
# Google OAuth 2.0
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxxxxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxxxxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxxxxxxxxxxx.apps.googleusercontent.com
````

> As variáveis prefixadas com `EXPO_PUBLIC_` são expostas ao bundle do cliente. Nunca coloque chaves secretas de servidor aqui.

---

## Scripts disponíveis

```bash
# Desenvolvimento
npm start               # Inicia o Metro bundler (Expo Go)
npm run android         # Abre no emulador Android
npm run ios             # Abre no simulador iOS

# Qualidade de código
npm run lint            # ESLint
npm run format          # Prettier
npm test                # Jest

# Banco de dados (Drizzle)
npx drizzle-kit generate   # Gera nova migration
npx drizzle-kit push       # Aplica migrations no SQLite local
npx drizzle-kit studio     # Abre o Drizzle Studio (visualizador)
```

---

## Deploy (EAS)

O projeto usa **EAS Build** para compilação em nuvem e **EAS Update** para atualizações OTA (over-the-air) sem passar pela loja.

```bash
# Login na conta Expo
eas login

# Build para desenvolvimento (com dev client)
eas build --profile development --platform android

# Build para preview (APK/IPA para testes internos)
eas build --profile preview --platform all

# Build de produção (submissão para lojas)
eas build --profile production --platform all

# Atualização OTA (sem nova submissão na loja)
eas update --branch production --message "fix: corrige cálculo de alerta"
```

Perfis configurados em `eas.json`:

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  }
}
```

---

## Backlog resumido

| ID    | História                               | Épico     | Prioridade    |
| ----- | -------------------------------------- | --------- | ------------- |
| US-00 | Setup do projeto e infraestrutura      | Infra     | 🔴 Bloqueante |
| US-01 | Cadastrar novo veículo manualmente     | Cadastro  | 🔴 Alta       |
| US-02 | Selecionar modelo pré-cadastrado       | Cadastro  | 🟠 Média      |
| US-03 | Listar e alternar entre veículos       | Cadastro  | 🔴 Alta       |
| US-04 | Atualizar km atual do veículo          | Cadastro  | 🔴 Alta       |
| US-05 | Cadastrar evento com tipo pré-definido | Eventos   | 🔴 Alta       |
| US-06 | Cadastrar evento personalizado         | Eventos   | 🟠 Média      |
| US-07 | Registrar execução de evento (efetuar) | Eventos   | 🔴 Alta       |
| US-08 | Editar e excluir eventos               | Eventos   | 🟠 Média      |
| US-09 | Ordenar e filtrar lista de eventos     | Eventos   | 🟡 Baixa      |
| US-10 | Ver status de alerta por urgência      | Alertas   | 🔴 Alta       |
| US-11 | Receber notificação diária             | Alertas   | 🟠 Média      |
| US-12 | Tela principal com visão geral         | Alertas   | 🔴 Alta       |
| US-13 | Histórico de execuções por evento      | Histórico | 🟠 Média      |
| US-14 | Linha do tempo geral do veículo        | Histórico | 🟡 Baixa      |
| TS-01 | Modelagem do banco de dados            | Infra     | 🔴 Bloqueante |
| TS-02 | Regras de negócio para alertas         | Infra     | 🔴 Bloqueante |
| US-15 | Login e cadastro local (offline)       | Auth      | 🔴 Alta · MVP |
| US-16 | Login com Google (OAuth 2.0)           | Auth      | 🟠 Média      |
| US-17 | Recuperação de senha (conta local)     | Auth      | 🟠 Média      |

---

## Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/nome-da-feature`
3. Commit seguindo Conventional Commits: `git commit -m "feat(eventos): adiciona cadastro de evento personalizado"`
4. Push: `git push origin feat/nome-da-feature`
5. Abra um Pull Request descrevendo o que foi feito e qual história do backlog resolve

---

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<p align="center">
  Feito com ❤️ e inspirado nos Bumbás de Parintins 🐂🔵🔴
</p>
