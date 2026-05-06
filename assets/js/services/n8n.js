/**
 * N8N Service — Programa 4D
 *
 * Toda comunicação com o n8n passa por Firebase Functions (HTTP Callables),
 * nunca diretamente do frontend para o n8n, para proteger a URL do webhook.
 *
 * Fluxo:
 *   Frontend → Firebase Function → n8n webhook → n8n workflow
 *
 * As Firebase Functions estão em /firebase/functions/index.js
 */

import { getFunctions, httpsCallable } from
  'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';
import { getApp } from '../config/firebase.js';

class N8nService {
  constructor() {
    this.functions = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    try {
      this.functions = getFunctions(getApp(), 'southamerica-east1');
      this.initialized = true;
    } catch (e) {
      console.error('[N8N] init error:', e);
    }
  }

  _call(functionName, data) {
    if (!this.initialized) this.initialize();
    const fn = httpsCallable(this.functions, functionName);
    return fn(data);
  }

  // ──────────────────────────────────────────────────────────
  // PROCESSAMENTO DA TRANSCRIÇÃO DO GOOGLE MEET
  // Workflow n8n: "4D - Process Onboarding Transcript"
  // ──────────────────────────────────────────────────────────
  /**
   * Envia a transcrição do Google Meet para o n8n processar.
   * O n8n irá:
   *   1. Extrair dados de saúde (pré-preencher Form 1)
   *   2. Detectar se o aluno tem exame de sangue
   *   3. Se SIM → mudar status para 'pending_blood_test'
   *   4. Se NÃO → gerar pedido de exames e salvar no Drive
   *
   * @param {string} uid
   * @param {string} transcriptText  — texto da transcrição
   * @param {string} driveFileUrl    — link do arquivo no Google Drive (opcional)
   */
  async processOnboardingTranscript(uid, transcriptText, driveFileUrl = null) {
    try {
      const result = await this._call('processOnboardingTranscript', {
        uid,
        transcriptText,
        driveFileUrl,
      });
      return result.data;
    } catch (e) {
      console.error('[N8N] processOnboardingTranscript:', e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────────────────
  // PROCESSAMENTO DO EXAME DE SANGUE
  // Workflow n8n: "4D - Process Blood Test"
  // ──────────────────────────────────────────────────────────
  /**
   * Notifica o n8n que um exame foi enviado para processar.
   * O arquivo já está no Firebase Storage / Google Drive.
   * O n8n irá:
   *   1. Baixar o arquivo do Drive
   *   2. Extrair marcadores (glicose, HbA1c, lipídios, etc.)
   *   3. Pré-preencher o Form 1
   *   4. Atualizar Firestore via webhook de callback
   *
   * @param {string} uid
   * @param {string} bloodTestId    — ID do documento no Firestore
   * @param {string} driveFileUrl   — URL do arquivo no Google Drive
   */
  async processBloodTest(uid, bloodTestId, driveFileUrl) {
    try {
      const result = await this._call('processBloodTest', {
        uid,
        bloodTestId,
        driveFileUrl,
      });
      return result.data;
    } catch (e) {
      console.error('[N8N] processBloodTest:', e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────────────────
  // GERAÇÃO DE PEDIDO DE EXAMES
  // Workflow n8n: "4D - Generate Exam Request"
  // ──────────────────────────────────────────────────────────
  /**
   * Solicita ao n8n a geração de um pedido de exames pré-preenchido
   * quando o aluno não tem exame de sangue disponível.
   *
   * @param {string} uid
   * @param {Object} clientData — dados pré-extraídos da transcrição
   */
  async generateExamRequest(uid, clientData) {
    try {
      const result = await this._call('generateExamRequest', {
        uid,
        clientData,
      });
      return result.data;
    } catch (e) {
      console.error('[N8N] generateExamRequest:', e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────────────────
  // AGENTE DE RECEITAS (Chat IA — função principal do app)
  // Workflow n8n: "4D - AI Recipe Agent"
  // ──────────────────────────────────────────────────────────
  /**
   * Envia mensagem do usuário para o agente de IA.
   * O n8n lê o histórico, perfil e preferências, gera resposta.
   *
   * @param {string} uid
   * @param {string} message     — mensagem do usuário
   * @param {string} sessionId   — ID da conversa (para contexto)
   */
  async sendChatMessage(uid, message, sessionId) {
    try {
      const result = await this._call('agentChatMessage', {
        uid,
        message,
        sessionId,
      });
      return result.data; // { reply: string, type: 'text'|'recipe', recipe?: Object }
    } catch (e) {
      console.error('[N8N] sendChatMessage:', e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────────────────
  // GERAÇÃO DE RECEITA DIRETA
  // Workflow n8n: "4D - Generate Recipe"
  // ──────────────────────────────────────────────────────────
  /**
   * Gera uma receita personalizada baseada no perfil do usuário.
   *
   * @param {string} uid
   * @param {Object} preferences — { mealType, maxPrepTime, avoidIngredients, preferIngredients }
   */
  async generateRecipe(uid, preferences = {}) {
    try {
      const result = await this._call('generateRecipe', {
        uid,
        preferences,
      });
      return result.data; // Recipe object
    } catch (e) {
      console.error('[N8N] generateRecipe:', e);
      throw e;
    }
  }

  // ──────────────────────────────────────────────────────────
  // AVALIADOR DE ALIMENTOS
  // Workflow n8n: "4D - Evaluate Food"
  // ──────────────────────────────────────────────────────────
  /**
   * Avalia um alimento para o perfil do usuário (glicemia, índice glicêmico, etc.)
   *
   * @param {string} uid
   * @param {string} foodName
   * @param {number|null} quantity — em gramas (opcional)
   */
  async evaluateFood(uid, foodName, quantity = null) {
    try {
      const result = await this._call('evaluateFood', {
        uid,
        foodName,
        quantity,
      });
      return result.data;
    } catch (e) {
      console.error('[N8N] evaluateFood:', e);
      throw e;
    }
  }
}

export const n8nService = new N8nService();
