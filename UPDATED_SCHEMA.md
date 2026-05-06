# Schema Firestore Atualizado — Programa 4D

> Versão 2.0 — Maio 2026
> Este documento substitui o FIRESTORE_SCHEMA.md v1.0

---

## Hierarquia de Coleções

```
firestore
└── users/{uid}                         → Perfil + Status + Gamificação
    ├── healthForm/data                 → Formulário de Saúde (Form 1) — 23 perguntas
    ├── onboardingInterview/data        → Dados extraídos da reunião Google Meet (interno)
    ├── menuForm/data                   → Formulário Pré-Cardápio (Form 3) — semana 3
    ├── bloodTests/{testId}             → Exames de sangue enviados + extração por IA
    ├── examRequests/{requestId}        → Pedidos de exame gerados pela IA
    ├── chatHistory/{messageId}         → Histórico do agente de IA
    ├── recipes/{recipeId}              → Receitas personalizadas geradas
    ├── achievements/{achievementId}    → Conquistas desbloqueadas
    └── examTracking/{entryId}          → Histórico de exames de acompanhamento (HbA1c, etc.)
```

---

## 1. users/{uid} — Documento Principal

```javascript
{
  // Identificação
  uid:    "string — Firebase Auth UID",
  email:  "string",
  name:   "string",

  // ── STATUS DO FLUXO ──────────────────────────────
  // Controla qual tela o usuário vê ao fazer login
  status: "string — enum USER_STATUS",
  // Valores possíveis:
  //   awaiting_onboarding    → aguardando reunião de onboarding
  //   pending_blood_test     → reunião feita, aguardando upload de exame
  //   processing_blood_test  → exame enviado, IA processando
  //   filling_health_form    → pronto para preencher Form 1
  //   awaiting_menu_form     → Form 1 completo, aguardando semana 3
  //   filling_menu_form      → semana 3, preencher Form Pré-Cardápio
  //   exam_request_sent      → sem exame, pedido gerado para médico
  //   active                 → tudo completo, acesso total

  // ── GAMIFICAÇÃO ─────────────────────────────────
  xp:               "number — pontos totais",
  level:            "number — 1 a 7",
  streak:           "number — dias consecutivos de login",
  lastActivityDate: "string — toDateString() do último login",
  totalRecipes:     "number — receitas geradas",
  totalChatMessages:"number — mensagens enviadas à IA",

  // ── TIMESTAMPS ──────────────────────────────────
  createdAt:   "timestamp",
  updatedAt:   "timestamp",
  lastLoginAt: "timestamp",
}
```

---

## 2. users/{uid}/healthForm/data — Formulário de Saúde (Form 1)

Preenchido após a reunião de onboarding. Pode ser pré-preenchido pela IA.

```javascript
{
  // Seção 1 — Identificação
  fullName:     "string",
  birthDate:    "string — YYYY-MM-DD",
  gender:       "string — Feminino | Masculino",
  weight:       "string — kg",
  height:       "string — cm",
  waist:        "string — cm (opcional)",

  // Seção 2 — Diagnóstico e Medicamentos
  diagnostics:       ["array de strings"],
  otherDiagnosis:    "string",
  diagnosisDuration: "string — texto livre",
  medications:       [{ name: "", dose: "", time: "" }],

  // Seção 3 — Histórico de Saúde
  previousDiets:     "boolean | null",
  previousDietDesc:  "string",
  maxWeight:         "string — kg",
  maxWeightYear:     "string",
  minWeight:         "string — kg",
  healthEvents:      "string — texto livre",
  familyHistory:     "boolean | null",
  familyHistoryDesc: "string",

  // Seção 4 — Controle Glicêmico (pode vir do exame de sangue via IA)
  glucometerType:        "string",
  glucoseFasting:        "string — mg/dL",      // ← extraído do exame
  glucoseAfterBreakfast: "string — mg/dL",
  glucoseAfterLunch:     "string — mg/dL",
  glucoseAfterDinner:    "string — mg/dL",
  glucoseBeforeSleep:    "string — mg/dL",
  glucoseMax:            "string — mg/dL",
  hba1c:                 "string — %",          // ← extraído do exame
  hba1cDate:             "string",

  // Seção 5 — Estilo de Vida
  sleepQuality:    "number — 1 a 5",
  sleepHours:      "string",
  sleepIssues:     "string",
  activityLevel:   "string",
  activityDetails: "string",
  stressLevel:     "number — 1 a 5",
  emotionalEating: "string",
  bowelFunction:   "string",

  // Seção 6 — Contexto de Vida
  livingWith:  "string",
  familyDiet:  "string",
  lifeEvents:  "string",

  // Seção 7 — Médico e Suporte
  hasDoctorMonitoring: "boolean | null",
  doctorSpecialty:     "string",
  doctorToldAbout4D:   "string",
  scheduledExams:      "boolean | null",
  scheduledExamsDesc:  "string",
  extraInfo:           "string",

  // Metadata
  aiPrefilled: "boolean — se a IA pré-preencheu campos",
  completed:   "boolean",
  createdAt:   "timestamp",
  updatedAt:   "timestamp",
}
```

---

## 3. users/{uid}/onboardingInterview/data — Entrevista (Interno)

Dados extraídos pelo n8n da transcrição do Google Meet. Uso interno da Guardiã.

```javascript
{
  // Dados de saúde extraídos da transcrição
  extractedHealthData: {
    // Espelha campos do healthForm que foram detectados na conversa
    fullName:     "string",
    diagnostics:  ["array"],
    medications:  [{ name, dose, time }],
    hba1c:        "string",
    glucoseFasting: "string",
    // ... etc
  },

  // Análise emocional / comportamental (uso da Guardiã)
  interviewSummary: {
    motivationLevel:     "number — 1 a 5",
    abandonmentRisk:     "string — descrição do risco",
    recommendedTone:     "string — acolhimento | equilibrio | desafio",
    metabolicLiteracy:   "string — alto | parcial | baixo",
    supportNetwork:      "string — descrição",
    doctorRelationship:  "string — aprovado | neutro | questionou | não conversou",
    entryTrigger:        "string — o que motivou entrar no programa",
    expectedResults:     "string",
  },

  hasBloodTest:  "boolean — se mencionou ter exame",
  processedAt:   "timestamp",
}
```

---

## 4. users/{uid}/menuForm/data — Formulário Pré-Cardápio (Form 3, semana 3)

```javascript
{
  // Perfil atualizado para o cardápio
  weight:   "string — kg",
  height:   "string — cm",
  gender:   "string",
  age:      "number",

  objective:     "string — weight_loss | maintenance | muscle_gain | energy",
  activityLevel: "string",
  lactoseIntolerance: "string — none | mild | severe",
  foodAllergies: "string",
  diagnosis:     "string",

  // Refeições
  meals: {
    breakfast:       { active: true,  time: "07:00" },
    morning_snack:   { active: false, time: "10:00" },
    lunch:           { active: true,  time: "12:30" },
    afternoon_snack: { active: true,  time: "15:30" },
    dinner:          { active: true,  time: "19:00" },
    supper:          { active: false, time: "21:30" },
  },

  cookingMethod:   "string",
  cookingTime:     "string",
  cuisinePreference: "string",

  // Listas de alimentos (Verde, Amarela)
  greenList: {
    proteins:    ["array de strings"],
    leafyVegs:   ["array de strings"],
    otherVegs:   ["array de strings"],
    fruits:      ["array de strings"],
    nuts:        ["array de strings"],
    fats:        ["array de strings"],
    beverages:   ["array de strings"],
  },
  yellowList: {
    dairy:       ["array de strings"],
    fruits:      ["array de strings"],
    legumes:     ["array de strings"],
    grains:      ["array de strings"],
  },

  // Restrições absolutas
  redListCustom: ["array — alimentos adicionados pelo usuário além da lista padrão"],
  specialRequests: "string",

  completed: "boolean",
  createdAt: "timestamp",
  updatedAt: "timestamp",
}
```

---

## 5. users/{uid}/bloodTests/{testId} — Exames de Sangue

```javascript
{
  fileUrl:    "string — URL Firebase Storage",
  fileName:   "string",
  fileSize:   "number — bytes",

  // Status do processamento
  status: "string — pending | processing | done | error",

  // Dados extraídos pela IA (preenchidos após processamento)
  extractedData: {
    glucoseFasting:    "string — mg/dL",
    hba1c:             "string — %",
    cholesterolTotal:  "string — mg/dL",
    hdl:               "string — mg/dL",
    ldl:               "string — mg/dL",
    triglycerides:     "string — mg/dL",
    creatinine:        "string",
    tsh:               "string",
    vitaminD:          "string",
    insulinFasting:    "string",
    alerts: [
      {
        marker:    "string — nome do marcador",
        value:     "string",
        reference: "string",
        status:    "string — alta | baixa | normal",
      }
    ],
    collectionDate: "string",
    laboratory:     "string",
  },

  uploadedAt:          "timestamp",
  processedAt:         "timestamp | null",
  processingStartedAt: "timestamp | null",
}
```

---

## 6. users/{uid}/examRequests/{requestId} — Pedidos de Exame

Gerado pela IA quando o aluno não tem exame disponível.

```javascript
{
  fileUrl:      "string — URL Google Drive",
  fileName:     "string",
  preFilledData: {
    name:        "string",
    age:         "number",
    gender:      "string",
    diagnostics: ["array"],
    medications: ["array"],
    // ... dados do cliente pré-preenchidos
  },
  createdAt: "timestamp",
}
```

---

## 7. users/{uid}/chatHistory/{messageId} — Histórico do Agente de IA

```javascript
{
  role:    "string — user | assistant",
  content: "string",
  type:    "string — text | recipe | advice | evaluation",

  // Se type === 'recipe'
  recipe: {
    title: "string",
    mealType: "string",
    prepTime: "number",
    servings: "number",
    ingredients: [{ name, quantity, unit }],
    instructions: ["array"],
    nutrition: { calories, carbs, proteins, fats, glycemicIndex },
    tags: ["array"],
  },

  conversationId:   "string — sessionId da conversa",
  processed:        "boolean",
  processingStatus: "string — pending | success | error",
  timestamp:        "timestamp",
}
```

---

## 8. users/{uid}/achievements/{achievementId} — Conquistas

```javascript
{
  // Do catálogo (ACHIEVEMENTS_CATALOG em constants.js)
  id:          "string — ex: health_form_done",
  name:        "string",
  description: "string",
  icon:        "string — emoji",
  xp:          "number — XP concedido",
  type:        "string — milestone | recipe | streak | engagement | health",

  // Status
  unlockedAt: "timestamp",
  seen:       "boolean — se o usuário já viu a notificação",
}
```

---

## 9. users/{uid}/examTracking/{entryId} — Histórico de Exames de Acompanhamento

```javascript
{
  type:      "string — hba1c | glucose_fasting | weight | waist | blood_pressure",
  value:     "number",
  unit:      "string — % | mg/dL | kg | cm | mmHg",
  note:      "string (opcional)",
  createdAt: "timestamp",
}
```

---

## Regras de Segurança (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários só acessam seus próprios dados
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;

      match /healthForm/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
      match /onboardingInterview/{doc} {
        allow read: if request.auth.uid == uid;
        allow write: if false; // Somente via Firebase Functions
      }
      match /menuForm/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
      match /bloodTests/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
      match /examRequests/{doc} {
        allow read: if request.auth.uid == uid;
        allow write: if false; // Somente via Firebase Functions
      }
      match /chatHistory/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
      match /recipes/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
      match /achievements/{doc} {
        allow read: if request.auth.uid == uid;
        allow write: if false; // Somente via Firebase Functions / backend
      }
      match /examTracking/{doc} {
        allow read, write: if request.auth.uid == uid;
      }
    }

    // Ranking: leitura pública de campos não sensíveis
    match /users/{uid} {
      allow read: if request.auth != null
        && request.resource == null  // só leitura
        && resource.data.keys().hasOnly(['name', 'xp', 'level', 'streak', 'totalRecipes']);
    }
  }
}
```

---

## Índices Recomendados

| Coleção | Campo 1 | Campo 2 |
|---------|---------|---------|
| `users/{uid}/chatHistory` | `timestamp` DESC | `role` ASC |
| `users/{uid}/recipes` | `createdAt` DESC | `mealType` ASC |
| `users/{uid}/examTracking` | `type` ASC | `createdAt` DESC |
| `users` (ranking) | `xp` DESC | — |

---

## Fluxo de Status (State Machine)

```
[CRIAÇÃO DA CONTA]
       ↓
awaiting_onboarding ─── (Guardiã faz upload da transcrição) ──→ n8n detecta exame?
                                                                    ├─ SIM → pending_blood_test
                                                                    └─ NÃO → exam_request_sent
                                                                              ↓ (aluno faz exame)
pending_blood_test ─── (aluno envia exame no app) ──→ processing_blood_test
                                                             ↓ (n8n processa)
exam_request_sent  ─── (aluno fez exames e enviou) ──→ processing_blood_test
                                                             ↓
                                                      filling_health_form
                                                             ↓ (Form 1 completo)
                                                      awaiting_menu_form
                                                             ↓ (semana 3)
                                                      filling_menu_form
                                                             ↓ (Form 3 completo)
                                                           ACTIVE ★
```

---

*Programa de Acompanhamento 4D · Bela Nutrição · Confidencial*
*Versão 2.0 — Maio 2026*
