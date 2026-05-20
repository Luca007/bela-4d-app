// MOCK n8nService — used only by test pages
export class N8nService {
  async sendChatMessage(payload) {
    return { ok: true, reply: 'Resposta simulada da Guardiã.', type: 'text' };
  }
  async sendMessage(payload) {
    return { ok: true, reply: 'Resposta simulada da Guardiã.', type: 'text' };
  }
  async chat(payload) {
    return { ok: true, reply: 'Resposta simulada da Guardiã.', type: 'text' };
  }
  async ask(payload) {
    return { ok: true, reply: 'Resposta simulada da Guardiã.', type: 'text' };
  }
  async classifyFoods() { return { ok: true, results: [] }; }
  async processBloodTest() { return { ok: true }; }
  async generateRecipe() { return { ok: true, recipe: { title: 'Receita Mock', ingredients: [], steps: [] } }; }
}
export const n8nService = new N8nService();
