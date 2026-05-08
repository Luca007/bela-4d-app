# n8n Workflows - Programa 4D

Este diretório armazena os exports JSON dos workflows do n8n usados no Programa 4D.

## Workflows previstos
- `01-meet-processor.json`
- `02-exam-processor.json`
- `03-chat-processor.json`
- `04-recipe-generator.json`
- `05-food-classifier.json`
- `06-exam-request-generator.json`
- `07-sheets-sync.json`

## Contrato de integração
- Todos os webhooks devem validar `X-Webhook-Secret`.
- Callbacks para Firebase devem usar endpoints HTTP em `firebase/functions/index.js`.
- Firestore permanece como fonte de verdade.

## Próximo passo
Versionar cada workflow com payload de exemplo e credenciais externas parametrizadas por variáveis de ambiente do n8n.
