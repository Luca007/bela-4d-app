// Application constants
export const APP_NAME = "Programa 4D";
export const APP_ACRONYM = "4D";
export const APP_SUBTITLE = "Bela Nutrição";

// ============================================================
// SCREENS
// ============================================================
export const SCREENS = {
  LOGIN: "login",
  AWAITING: "awaiting",           // Aguardando reunião de onboarding
  EXAM_UPLOAD: "exam-upload",     // Upload do exame de sangue
  HEALTH_FORM: "health-form",     // Formulário de Saúde (Form 1)
  ONBOARDING: "onboarding",       // Onboarding clássico (fallback)
  CARDAPIO: "cardapio",           // Cardápio / Form 3 (semana 3)
  DASHBOARD: "dashboard",
};

// ============================================================
// USER STATUS — controla o fluxo pós-login
// ============================================================
export const USER_STATUS = {
  // Conta criada mas reunião de onboarding ainda não aconteceu
  AWAITING_ONBOARDING: "awaiting_onboarding",

  // Reunião feita. IA detectou que tem exame → aguardando upload
  PENDING_BLOOD_TEST: "pending_blood_test",

  // Exame enviado, sendo processado pela IA no n8n
  PROCESSING_BLOOD_TEST: "processing_blood_test",

  // Pronto para preencher / confirmar o Formulário de Saúde (Form 1)
  FILLING_HEALTH_FORM: "filling_health_form",

  // Form 1 completo. Aguardando semana 3 para Formulário Pré-Cardápio
  AWAITING_MENU_FORM: "awaiting_menu_form",

  // Semana 3: preenchendo o Formulário Pré-Cardápio (Form 3)
  FILLING_MENU_FORM: "filling_menu_form",

  // Reunião feita, sem exame → pedido gerado para o médico
  EXAM_REQUEST_SENT: "exam_request_sent",

  // Tudo completo — acesso total ao dashboard
  ACTIVE: "active",
};

// ============================================================
// GAMIFICAÇÃO — XP por evento
// ============================================================
export const XP_EVENTS = {
  DAILY_LOGIN: 10,
  HEALTH_FORM_COMPLETED: 150,
  BLOOD_TEST_UPLOADED: 200,
  MENU_FORM_COMPLETED: 100,
  CHAT_MESSAGE_SENT: 5,
  RECIPE_SAVED: 15,
  RECIPE_TRIED: 25,
  EXAM_UPLOADED: 50,
  STREAK_7_DAYS: 75,
  STREAK_14_DAYS: 150,
  STREAK_30_DAYS: 300,
  PROFILE_COMPLETE: 50,
  FIRST_RECIPE: 30,
  SHARE_ACHIEVEMENT: 20,
};

// Níveis de progressão
export const LEVELS = [
  { level: 1, title: "Iniciante",          minXp: 0,     maxXp: 499,   color: "#6b7280", emoji: "🌱" },
  { level: 2, title: "Aprendiz",           minXp: 500,   maxXp: 1499,  color: "#10b981", emoji: "🌿" },
  { level: 3, title: "Comprometido",       minXp: 1500,  maxXp: 2999,  color: "#3b82f6", emoji: "💪" },
  { level: 4, tit