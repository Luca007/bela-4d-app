# 🌙 Guia Metabólico Personalizado (GMP)

> Vanilla JavaScript + Firebase + n8n com suporte para GitHub Pages

Uma aplicação de gerenciamento metabólico personalizado construída com JavaScript puro, CSS3 moderno e integração completa com Firebase para autenticação e armazenamento de dados em nuvem.

## 🎯 Visão Geral do Projeto

**GMP** é um sistema de gerenciamento metabólico que ajuda usuários a:

- Rastrear níveis de glicose e marcadores clínicos
- Receber recomendações nutricionais personalizadas
- Acessar avaliação de alimentos com IA
- Monitorar métricas de saúde ao longo do tempo
- Engajar-se com um sistema de ranking comunitário

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend**: Vanilla JavaScript ES6 Modules (sem bundler)
- **Hospedagem**: GitHub Pages (estático)
- **Autenticação**: Firebase Authentication (Email/Senha)
- **Banco de Dados**: Firestore (NoSQL)
- **Processamento IA**: n8n (webhooks)
- **Styling**: CSS3 com 50+ variáveis
- **Fonts**: Google Fonts CDN
- **Icons**: Sistema SVG customizado

### Diagrama de Arquitetura

```
┌─────────────────────────────────────┐
│    GitHub Pages (Frontend)          │
│  Vanilla JS + CSS3 + Firebase SDK   │
└────────────────┬────────────────────┘
                 │
          Firebase SDK (CDN)
                 │
┌────────────────▼────────────────────┐
│     Google Firebase Services        │
│  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │ Firestore│        │
│  ├──────────┤  ├──────────┤        │
│  │ Functions│  │ Analytics│        │
│  └──────────┘  └──────────┘        │
└────────────────┬────────────────────┘
                 │
         HTTP Webhooks
                 │
┌────────────────▼────────────────────┐
│          n8n (AI Agent)             │
│  - Chat Processing                  │
│  - Recipe Generation                │
│  - Data Processing                  │
└─────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

## 📁 Estrutura do Projeto

```
bela-4d-app/
├── index.html                          # Entry point com Firebase SDK
├── .nojekyll                           # GitHub Pages config
│
├── assets/
│   ├── css/
│   │   ├── reset.css                  # Reset HTML/CSS
│   │   ├── variables.css              # Sistema de cores/spacing
│   │   ├── animations.css             # 15+ animações
│   │   ├── components.css             # Componentes estilizados
│   │   ├── layout.css                 # Grid/flex utilities
│   │   └── dashboard.css              # Dashboard styles
│   │
│   └── js/
│       ├── app.js                      # Orquestrador principal (Firebase)
│       │
│       ├── config/
│       │   ├── firebase.js            # ⭐ Configuração Firebase
│       │   ├── colors.js              # Paleta de cores
│       │   ├── constants.js           # Constantes da app
│       │   └── data.js                # Dados de teste
│       │
│       ├── services/
│       │   ├── auth.js                # ⭐ Serviço de autenticação
│       │   └── firestore.js           # ⭐ Serviço de banco de dados
│       │
│       ├── utils/
│       │   ├── helpers.js             # DOM, State, Storage
│       │   ├── validators.js          # Validação de formulários
│       │   └── icons.js               # Sistema de ícones SVG
│       │
│       ├── modules/
│       │   ├── components.js          # Biblioteca de componentes
│       │   ├── navigator.js           # Sistema de navegação
│       │   └── charts.js              # Gráficos SVG
│       │
│       └── screens/
│           ├── login.js               # Tela de login (Firebase Auth)
│           ├── onboarding.js          # Wizard 4 etapas (Firestore)
│           ├── cardapio.js            # Seleção de alimentos
│           ├── dashboard.js           # Layout principal
│           └── shared.js              # Componentes compartilhados
│
├── DEPLOYMENT_GUIDE.md                 # 📚 Guia de deployment
├── FIRESTORE_SCHEMA.md                 # 📚 Estrutura de dados
├── FIREBASE_FUNCTIONS.md               # 📚 Cloud Functions
├── FIREBASE_INTEGRATION.md             # 📚 Integração Firebase
├── SECURITY_GUIDE.md                   # 📚 Segurança e GDPR
└── README.md                           # Este arquivo
```

⭐ = Novos arquivos para integração Firebase

## 🔐 Autenticação com Firebase

### Como Funciona

```javascript
// 1. Usuário faz login
const result = await authService.login(email, password);

// 2. Firebase valida e retorna token
if (result.success) {
  // 3. Carregar dados do Firestore
  const userProfile = await firestoreService.getUserProfile(uid);
  
  // 4. Se onboarding completo → Dashboard
  // 5. Se onboarding pendente → Onboarding
}
```

**Requisitos**:
- Email válido
- Senha mínimo 6 caracteres

## 💾 Firestore - Estrutura de Dados

### Collections

```
firestore
└── users/{uid}
    ├── onboarding/data          # Dados do onboarding (4 etapas)
    ├── chatHistory/             # Histórico de chat com IA
    ├── recipes/                 # Receitas personalizadas
    └── achievements/            # Conquistas desbloqueadas
```

**Ver:** `FIRESTORE_SCHEMA.md` para estrutura completa

## 🎮 Fluxo de Usuário

## 🎨 Design System

### Colors

- **Primary**: Pink gradient (`#f0059a` to `#c0027c`)
- **Background**: Dark theme (`#0c0c0e`)
- **Text**: Light (`#e8e8f0`)
- **Muted**: Gray (`#908ba8`)
- **Accent Colors**: Success, Warning, Danger, Gold, Glass effect

### Spacing

- 8 spacing levels: `xs`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `3xl`
- Border radius: 4 variants (sm, md, lg, full)
- Shadows: 5 levels + glow effect

### Typography

- **Headers**: Outfit (700, 800)
- **Body**: DM Sans (400-900)
- **Sizes**: 12px to 32px with consistent scale

### Animations (15+)

- Fade, Slide, Scale, Rotate, Spin
- Glow, Float, Bounce, Pulse
- All use CSS variables for consistent timing

## 🔧 Component Library

### UI Components Available

- **Buttons**: `primaryButton()`, `secondaryButton()`, `ghostButton()`
- **Inputs**: `textInput()`, `emailInput()`, `passwordInput()`, `numberInput()`, `textarea()`
- **Containers**: `card()`, `modal()`, `toast()`
- **Displays**: `badge()`, `avatar()`, `progressBar()`, `spinner()`, `statCard()`
- **Navigation**: `tabs()`

### Utility Objects

- **DOM**: Create, style, query, event listeners
- **State**: Reactive state with listeners
- **Storage**: JSON serialization to localStorage
- **Session**: User session tracking
- **Validators**: Email, password, date, phone, etc.
- **StringUtils**: Capitalize, format, truncate, etc.
- **Animations**: Trigger CSS animations dynamically
- **TimeUtils**: Format dates, times, distances
- **Icons**: 20+ SVG icons

## ⚙️ Key Features

### Forms & Validation

- Real-time form validation
- Multi-step form wizard (Onboarding)
- Food list selection with categorization
- Meal time scheduling

### State Management

- Simple object-based state with listeners
- localStorage persistence
- Session tracking with user info

### Navigation

- Custom Navigator class with history tracking
- BaseScreen lifecycle management
- Observer pattern for navigation changes
- Browser back/forward support

### Styling

- CSS variable system for themeable design
- No utility-first framework (clean semantic CSS)
- Responsive grid/flexbox layouts
- Dark theme with light theme variant support

## 🚀 Getting Started

### No Installation Required

This project runs directly in the browser with no build tools needed.

### 1. Open in Browser

```bash
# Option A: Double-click index.html
# Option B: Start a local server (recommended)
python -m http.server 8000
# or
npx http-server
```

Navigate to `http://localhost:8000`

### 2. Test the Flow

- **Login**: Use any email/password (no validation on backend)
- **Onboarding**: Complete all 4 steps
- **Cardápio**: Select foods and meal times
- **Dashboard**: Navigate between 7 screens

### 3. Test Data

All test/mock data is in `assets/js/config/data.js`:

- 12 achievements with XP
- 10 user ranking with positions
- 50+ foods in food database
- 3+ recipes with ingredients
- 6 months of glucose data
- 5 AI chatbot responses
- 3-day meal plans

## 📊 Completed Screens

- **Login Screen** - Email/password form with animated logo
- **Onboarding Screen** - 4-step wizard with progress indicator
- **Cardápio Screen** - Food selection with 3 categories
- **Dashboard Screen** - Main layout with 7 sub-screens:
  - Home: Stats and tips
  - Perfil: User avatar and level
  - Receitas: Recipe browsing
  - Avaliador: AI food evaluation
  - Exames: Exam tracking
  - Ranking: Leaderboard
  - Chat IA: AI chatbot

## 🔜 Next Steps

The application is **fully functional and ready for testing**. After validation:

1. **Add Real Data Integration**
   - Connect to backend API
   - Replace mock data with real endpoints
   - Implement authentication

2. **Enhance Remaining Features**
   - Recipe detail views
   - Chart implementations
   - AI integration
   - Notification system

3. **Production Optimization**
   - Minify assets
   - Lazy load screens
   - Service worker for offline support
   - Progressive Web App (PWA)

## 💾 localStorage Keys

- `gmp_user`: User session data
- `gmp_state`: Application state
- `gmp_preferences`: User preferences

## 🎯 Code Quality

- Clean, modular ES6 modules
- Consistent naming conventions
- Reusable component factory pattern
- No external dependencies (pure vanilla JS)
- Single responsibility principle

## 📝 Notes

- All styling is vanilla CSS (no preprocessor needed)
- Colors are centralized in `colors.js` and used throughout
- Components use inline styles + CSS classes (hybrid approach)
- No build step required - works in any modern browser
- Mobile responsive with 768px breakpoint

---

**Built as a systems architect would build it** - professional, modular, maintainable, and scalable.