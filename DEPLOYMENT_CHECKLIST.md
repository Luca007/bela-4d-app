# Deployment Checklist — Programa 4D (GMP)

> **Status**: Phase 3.3 Complete — All UI and gamification screens implemented
> **Last Updated**: May 6, 2026
> **Branch**: `claude/review-project-context-1vSev`

---

## ✅ What's Done

### Frontend (100% Complete)
- [x] Login & Authentication flow
- [x] Onboarding interview screen
- [x] Health form (Form 1) with AI prefill
- [x] Menu/Cardápio form (Form 3)
- [x] Exam upload screen
- [x] Dashboard with navigation
- [x] **Chat screen with AI guardiã** (real-time messages)
- [x] **Recipes gallery screen** (filters, favorites, share)
- [x] **Food evaluator screen** (search, verdicts, alternatives)
- [x] **Gamification components** (XP header, levels, achievements modal)
- [x] Responsive design (mobile-first)
- [x] Real-time Firestore listeners
- [x] XP/Level/Achievement tracking

### Backend Infrastructure (100% Complete)
- [x] Firebase Cloud Functions (6 callables + 1 trigger)
  - processOnboardingTranscript()
  - processBloodTest()
  - generateExamRequest()
  - agentChatMessage()
  - generateRecipe()
  - evaluateFood()
  - sendPatientNotification() + onUserStatusChanged trigger
- [x] Firestore schema (10 subcollections per user)
- [x] WhatsApp notification infrastructure
- [x] n8n webhook definitions and payload specifications
- [x] All Cloud Function callables configured with auth

### Documentation (100% Complete)
- [x] N8N_WORKFLOWS.md — Complete specifications for all 7 workflows
- [x] FIREBASE_FUNCTIONS.md — Cloud Function docs (pending update)
- [x] FIREBASE_INTEGRATION.md — Firestore schema docs (pending update)
- [x] SECURITY_GUIDE.md — Auth and secrets (pending update)
- [x] README.md — User guide (pending update)

---

## ❌ What Requires Configuration

These items need actual external services to be set up and configured with real credentials.

### 1. n8n Workflows (7 workflows need implementation)

**Location**: n8n.cloud or self-hosted instance

**Workflows Required**:
1. `4d-process-transcript` — Google Meet → extract health data
2. `4d-process-blood-test` — PDF OCR → extract lab values
3. `4d-generate-exam-request` — Create pre-filled Google Doc
4. `4d-agent-chat` — RAG + LLM → response + recipe/evaluation
5. `4d-generate-recipe` — Direct recipe generation
6. `4d-evaluate-food` — Food classification (green/yellow/red)
7. `4d-send-whatsapp-notification` — Send WhatsApp to patient

**Files to Reference**:
- `N8N_WORKFLOWS.md` — Complete specifications with payloads and prompts
- `N8N_SETUP.md` — Step-by-step n8n setup instructions
- Test payloads in N8N_WORKFLOWS.md for curl testing

**API Credentials Needed**:
- OpenAI or Anthropic (LLM for all workflows)
- Google Drive API (file access)
- Google Vision API (OCR for blood tests)
- Twilio or WhatsApp Business API (notifications)
- Cohere Rerank API (optional, for quality filtering)

### 2. Qdrant Vector Database

**Purpose**: Store embeddings for RAG context retrieval

**Setup**:
```bash
# Option A: Qdrant Cloud
# 1. Create account at qdrant.io
# 2. Create cluster
# 3. Get API key and URL

# Option B: Docker (self-hosted)
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

**Collections to Create**:
```
- user_context_v1
  └─ vectors: embeddings of health form + chat history + exams
  └─ TTL: 60 days
  
- recipes_v1
  └─ vectors: embeddings of recipe titles + ingredients
  └─ TTL: permanent
```

**Integration Points**:
- Firebase Cloud Function: Get Qdrant credentials from secrets
- n8n Workflow 4 (chat): Query vectors before generating response
- Firestore: Save embeddings after each chat/evaluation/recipe

### 3. Redis Cache Layer

**Purpose**: Fast session cache and XP counter caching

**Setup**:
```bash
# Option A: Redis Cloud
# 1. Create account at redis.com
# 2. Create database
# 3. Get connection string

# Option B: Docker (self-hosted)
docker run -p 6379:6379 redis:latest
```

**Cache Keys Pattern**:
```
session:{sessionId}:{uid}:chat_history
session:{sessionId}:{uid}:pending_actions
user:{uid}:xp_daily
user:{uid}:notifications_sent
ranking:{date}:scores
```

**Integration Points**:
- Firebase Cloud Functions: Check cache before Firestore queries
- n8n Workflows: Store temporary context between steps
- App.js: Initialize session cache on login

### 4. Google Drive & Sheets

**Purpose**: Store transcripts, exams, requests; team monitoring dashboard

**Setup**:
1. Create Google Service Account (not user account)
2. Generate private key JSON
3. Create shared folders:
   - `/Programa 4D/Alunos/{nome_uid}/`
   - `/Programa 4D/Templates/`
   - `/Programa 4D/Team Dashboard/`

**Files to Create**:
- Google Sheets: Master patient list with status
- Google Sheets: Daily XP/achievements tracking
- Google Drive folders: Organized by user UID

**Integration Points**:
- n8n Workflows 1, 2, 3: Upload files to Drive
- n8n Workflow 7: Log notifications to team sheet
- Cloud Function: Backup critical Firestore updates to Sheets

### 5. Email/Messaging Integrations (Optional)

**WhatsApp Business API**:
- Phone number verification
- Template message approval

**SendGrid or similar** (for email):
- Backup channel if WhatsApp fails
- Account notifications

---

## 🚀 Deployment Steps

### Phase 1: Firebase Setup (1-2 hours)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login and initialize (if not done)
firebase login
firebase init

# 3. Set up secrets
firebase functions:secrets:set N8N_BASE_URL
firebase functions:secrets:set N8N_WEBHOOK_SECRET
firebase functions:secrets:set QDRANT_URL
firebase functions:secrets:set QDRANT_API_KEY
firebase functions:secrets:set REDIS_URL
firebase functions:secrets:set COHERE_API_KEY

# 4. Deploy Cloud Functions
firebase deploy --only functions

# 5. Deploy Firestore rules
firebase deploy --only firestore:rules

# 6. Deploy Hosting (frontend)
npm run build  # (if needed)
firebase deploy --only hosting
```

### Phase 2: n8n Setup (2-3 hours)

1. **Create n8n instance**:
   - Go to n8n.cloud or deploy self-hosted
   - Create account and login

2. **Create webhooks** (one for each workflow):
   - Webhook → POST `/webhook/4d-process-transcript`
   - Webhook → POST `/webhook/4d-process-blood-test`
   - etc.

3. **Add credentials**:
   - OpenAI API key
   - Google Drive credentials
   - Google Vision credentials
   - Twilio/WhatsApp credentials
   - Qdrant credentials

4. **Create workflows** (use N8N_WORKFLOWS.md as template):
   - Implement nodes per specification
   - Add error handling and retries
   - Test with curl examples from documentation
   - Deploy/activate each workflow

5. **Test workflows**:
   ```bash
   curl -X POST https://YOUR-N8N.cloud/webhook/4d-process-transcript \
     -H "X-Webhook-Secret: $N8N_WEBHOOK_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"uid":"test","userProfile":{"name":"Test"},"transcriptText":"..."}'
   ```

### Phase 3: Qdrant Setup (30 minutes)

```bash
# 1. Create collections
curl -X POST "http://localhost:6333/collections" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user_context_v1",
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'

# 2. Verify connection from Cloud Functions
# 3. Test embedding generation (from LLM)
# 4. Test vector search (basic queries)
```

### Phase 4: Redis Setup (15 minutes)

```bash
# 1. Test connection from Cloud Functions
redis-cli ping

# 2. Set up TTL policies
redis-cli EXPIRE session:* 86400

# 3. Verify cache hits on repeated queries
# 4. Monitor memory usage
```

### Phase 5: Google Workspace Setup (30 minutes)

```bash
# 1. Create Service Account JSON
# 2. Share Google Drive folder with service account email
# 3. Create Google Sheets for team dashboard
# 4. Test file upload from n8n workflow
```

### Phase 6: Testing (1-2 hours)

```bash
# 1. Test full user journey with test account
# Login → Onboarding → Blood test upload → Forms → Dashboard → Chat

# 2. Test each n8n workflow
# Use curl examples from N8N_WORKFLOWS.md

# 3. Monitor logs
# Firebase: Functions → Logs
# n8n: Workflow → Execution history
# Qdrant: Dashboard → Collections

# 4. Load testing (2+ concurrent users)
# Monitor performance and Firestore costs
```

---

## 📋 Configuration Files Needed

Create these files before deployment:

### `.env` (Frontend)
```
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_N8N_BASE_URL=https://your-n8n-instance.cloud
```

### `firebase/functions/.env` (not in Git)
```
N8N_BASE_URL=https://your-n8n-instance.cloud/webhook
N8N_WEBHOOK_SECRET=your-secret-key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key
REDIS_URL=redis://localhost:6379
COHERE_API_KEY=your-api-key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### `N8N Setup` (in n8n admin panel)
```
✓ Credentials: OpenAI
✓ Credentials: Google Drive
✓ Credentials: Google Vision
✓ Credentials: Twilio
✓ Credentials: Qdrant
✓ Webhooks: All 7 endpoints
✓ Workflows: All 7 workflows deployed
```

---

## 🔍 Verification Checklist

**Before going live**, verify:**

- [ ] Firebase Cloud Functions deployed successfully
- [ ] All 7 n8n workflows created and tested
- [ ] n8n webhooks accessible from Firebase Functions
- [ ] Qdrant collections created and tested
- [ ] Redis cache responding
- [ ] Google Drive folders accessible
- [ ] WhatsApp template approved (if using)
- [ ] Test user can complete full onboarding flow
- [ ] Chat generates responses with recipes
- [ ] Food evaluator returns color-coded verdicts
- [ ] Achievements unlock correctly
- [ ] All real-time listeners working
- [ ] Firestore data is private (security rules)
- [ ] Firebase Hosting serving latest frontend
- [ ] Logs show no critical errors

---

## 📊 Performance Benchmarks

Target metrics for successful deployment:

- **Onboarding Flow**: < 5 minutes (user + AI)
- **Chat Response**: < 2 seconds (RAG + LLM)
- **Blood Test Processing**: < 30 seconds (OCR + extraction)
- **Recipe Generation**: < 3 seconds (LLM)
- **Food Evaluation**: < 1.5 seconds (classification)
- **Firestore Read**: < 500ms
- **Qdrant Query**: < 200ms
- **Redis Get**: < 50ms

---

## 🆘 Troubleshooting

**Cloud Function returns 403 (Forbidden)**:
- Check `X-Webhook-Secret` header matches Firebase secret
- Verify n8n callback URL is correct
- Check Firestore security rules allow writes

**n8n webhook not receiving requests**:
- Verify webhook URL in Firebase Cloud Function
- Check n8n webhook is active (toggle switch)
- Test with curl from terminal
- Check n8n execution logs

**Chat response is slow**:
- Verify Qdrant is indexed (not empty)
- Check Redis cache is working
- Monitor LLM API latency
- Add caching for repeated queries

**WhatsApp messages not delivering**:
- Verify phone number format (+55 with country code)
- Check Twilio credentials
- Verify message template is approved
- Check delivery logs in Twilio dashboard

**XP not updating**:
- Verify Firestore write permissions
- Check Cloud Function logs for errors
- Verify XP event is being triggered
- Check LEVELS constant is loaded

---

## 📱 User Flow Validation

Test this complete journey:

1. **Login Page**
   - [ ] Email/password works
   - [ ] Password reset works
   - [ ] Create account works

2. **Onboarding Interview**
   - [ ] Audio recording captured
   - [ ] Transcript sent to n8n
   - [ ] Data extracted and saved
   - [ ] Status updated to next step

3. **Blood Test Upload**
   - [ ] File upload works
   - [ ] n8n OCR processes file
   - [ ] Labs extracted correctly
   - [ ] Health form prefilled with data

4. **Health Form**
   - [ ] Form loads with AI prefill
   - [ ] Form saves to Firestore
   - [ ] XP awarded for completion

5. **Dashboard**
   - [ ] Shows user profile
   - [ ] Displays level + XP
   - [ ] Shows achievement progress
   - [ ] Navigation to all screens works

6. **Chat Screen**
   - [ ] Messages send and display
   - [ ] AI responds with recipes
   - [ ] Food classification works
   - [ ] XP awarded for activity

7. **Recipes Screen**
   - [ ] Gallery displays generated recipes
   - [ ] Filters work (meal type, time, etc)
   - [ ] Search finds recipes
   - [ ] Favorites persist
   - [ ] Modal shows full details

8. **Food Evaluator**
   - [ ] Search finds common foods
   - [ ] Evaluation returns color-coded verdict
   - [ ] Alternatives suggested
   - [ ] History shows evaluations

9. **Achievements**
   - [ ] Modal opens from dashboard
   - [ ] Filters work
   - [ ] Completed ones show checkmarks
   - [ ] Can share achievements

10. **Notifications**
    - [ ] WhatsApp messages arrive
    - [ ] Status changes trigger notifications
    - [ ] Messages are contextual and helpful

---

## 📞 Support & Escalation

**If issues arise during deployment**:

1. **Check logs first**:
   - Firebase: Functions → Logs
   - n8n: Workflow → Execution history
   - Qdrant: Dashboard → Statistics
   - Browser console: F12 → Console tab

2. **Test isolated components**:
   - Cloud Function: Use `firebase functions:shell`
   - n8n workflow: Use test mode in UI
   - Qdrant: Use API playground
   - Redis: Use redis-cli

3. **Document and report**:
   - Error message (exact copy)
   - Timestamp
   - User/test case that triggered it
   - Relevant logs from all systems

---

**Last Updated**: May 6, 2026
**Status**: Ready for Phase 4 (External Services Configuration)
**Next Owner**: DevOps/Infrastructure team
