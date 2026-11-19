# Yojana Saathi (योजना साथी / যোজনা সাথী)

> **AI-Powered Government Scheme Discovery & Assistance Platform for India**  
> *Bridging the gap between 500+ welfare schemes and citizens through natural voice, multilingual conversational AI, deterministic eligibility matching, and automated document simplification.*

---

## 📌 Executive Summary & Context for Claude / AI Agents

**Yojana Saathi** is a full-stack, production-grade social welfare discovery engine. It addresses a critical problem in India: millions of eligible citizens miss out on government assistance (agriculture, health, education, housing, social security, women's empowerment) due to fragmented portals, opaque eligibility criteria, and language barriers.

### Key Capabilities
1. **Multilingual Voice-First Profiling**: Speaks and listens in English, Hindi (`हिन्दी`), and Bengali (`বাংলা`). Converts natural spoken speech or freeform text into structured eligibility parameters using Groq-powered LLMs.
2. **Deterministic & Contextual Recommendation Engine**: Evaluates user profiles against 505 active central & state government welfare schemes using a rule engine with profile-affinity scoring (occupation, income, age, gender, category, state, disability). Categorizes results into `ELIGIBLE`, `POSSIBLY_ELIGIBLE`, and `NOT_ELIGIBLE`.
3. **Saathi AI Chatbot (Grounding & Hybrid RAG)**: Floating and standalone AI assistant powered by local multilingual embeddings (`Xenova/multilingual-e5-small`) and Qdrant vector retrieval, backed by automatic fail-safe relational search and intent routing to ensure zero-latency responses.
4. **AI Document Simplifier**: Processes dense official government gazettes, PDFs, and circulars using Google Gemini (`gemini-2.5-flash-lite` / `gemini-3.5-flash-lite`) to produce structured, plain-language summaries, key dates, monetary benefits, obligations, and red flags.
5. **Database Cold-Start & Scale Resilience**: Tailored for serverless PostgreSQL (Neon) with connection retry wrappers, exponential backoff, and optimized bulk database insertions (`createMany`) to eliminate latency bottlenecks.

---

## 🛠️ Architecture & Tech Stack

```mermaid
flowchart TD
    User([Citizen / User]) -->|Voice / Text in EN, HI, BN| Frontend[React 19 + Vite Frontend]
    
    subgraph Frontend Layer
        Frontend --> Router[React Router v7]
        Frontend --> I18n[react-i18next: EN / HI / BN]
        Frontend --> WebSpeech[Web Speech API: speechLang en-IN, hi-IN, bn-IN]
        Frontend --> AxiosInst[Axios Client with 60s Timeout]
    end

    AxiosInst -->|REST API Requests| Gateway[Express 4.21 Backend Gateway]

    subgraph Backend Layer
        Gateway --> AuthMiddleware[JWT Auth & Cookie Parser]
        Gateway --> RateLimiter[Express Rate Limiter & Helmet]
        Gateway --> RouterAPI[API Routes: /auth, /profile, /schemes, /recommendations, /chat, /doc-simplifier]
        
        RouterAPI --> AIProfile[Groq LLM Service: Profile Extraction]
        RouterAPI --> RuleEngine[Eligibility Engine + Affinity Scorer]
        RouterAPI --> RAGService[Hybrid RAG: Xenova E5 Embeddings + Qdrant]
        RouterAPI --> GeminiDoc[Gemini Vision/Text Document Simplifier]
        RouterAPI --> PrismaClient[Prisma ORM with Connection Retry]
    end

    subgraph Data & Storage
        PrismaClient --> Postgres[(Neon PostgreSQL: 505 Schemes, Profiles, Bookmarks)]
        RAGService --> Qdrant[(Qdrant Vector Database)]
    end
```

### Frontend (`/client`)
- **Framework**: React 19, Vite 8
- **Routing**: `react-router-dom` v7
- **Internationalization**: `i18next`, `react-i18next`, `i18next-browser-languagedetector` (Full UI translations for English, Hindi, Bengali)
- **Audio/Voice**: Web Speech Recognition API mapped to localized speech models (`en-IN`, `hi-IN`, `bn-IN`)
- **Icons & Styling**: Lucide React, CSS Modules with custom theme variables

### Backend (`/server`)
- **Runtime**: Node.js 20+ (ES Modules)
- **Web Framework**: Express 4.21, Helmet, CORS, Morgan / Winston logger
- **ORM & Database**: Prisma 6 with PostgreSQL (hosted on Neon Serverless)
- **LLM Integrations**:
  - **Groq Cloud SDK** (`llama-3.3-70b-versatile` / `openai/gpt-oss-120b`): Natural language extraction into structured JSON profiles.
  - **Google Gen AI SDK** (`@google/genai`): Multilingual document simplification with strict Zod/Type schemas.
- **Vector Search & Embeddings**:
  - `@huggingface/transformers`: Local `Xenova/multilingual-e5-small` model pre-warmed on server startup.
  - Qdrant Vector DB with fallback to Postgres relational category matching.
- **Security & Validation**: JWT tokens (HTTP cookies/headers), Bcrypt password hashing, Zod schema validation.

---

## 📂 Repository Structure

```
yojana-saathi/
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/              # Navbar, ChatModal, SchemeCard, ProtectedRoute
│   │   ├── context/                 # AuthContext, LanguageContext, ChatContext
│   │   ├── hooks/                   # useVoice.js, useScrollReveal.js
│   │   ├── i18n/                    # i18n setup and locale dictionaries (en, hi, bn)
│   │   │   └── locales/
│   │   │       ├── en.json          # English translations (landing, app, auth, chat)
│   │   │       ├── hi.json          # Hindi translations
│   │   │       └── bn.json          # Bengali translations
│   │   ├── pages/                   # Home, VoiceInput, Recommendations, SchemeDetails,
│   │   │                            # Profile, SavedSchemes, DocSimplifier, Login, Register
│   │   ├── services/                # Axios API client, auth & scheme services
│   │   └── utils/                   # constants.js, formatters.js
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Schema definitions (Users, Schemes, Recommendations, etc.)
│   │   └── seed.js                  # Database seed script
│   ├── src/
│   │   ├── config/                  # env.js configuration with startup validation
│   │   ├── controllers/             # auth, profile, scheme, recommendation, chat, doc controllers
│   │   ├── lib/                     # prisma.js with Neon cold-start connection retry
│   │   ├── middleware/              # auth, validate, error, rateLimit
│   │   ├── routes/                  # API route definitions
│   │   ├── services/
│   │   │   ├── ai/                  # groq.service.js, gemini.service.js
│   │   │   ├── chat/                # chat.service.js (Saathi assistant logic)
│   │   │   ├── rag/                 # qdrant.service.js, embedding.service.js
│   │   │   └── recommendation/      # recommendation.service.js, ruleEngine.js
│   │   ├── utils/                   # logger.js, constants.js, response.js
│   │   ├── validators/              # zod schemas (auth, profile, ai, docSimplifier)
│   │   └── server.js                # Server entrypoint and graceful shutdown
│   ├── scripts/                     # prefetchModel.js, ingestSchemes.js, importSchemes.js
│   ├── tests/                       # rules.test.js, docSimplifier.test.js, multilingual.test.js
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)
Create `server/.env` based on `server/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30` |
| `JWT_SECRET` | Secret key for signing JWTs | Random 32+ char hex string |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `GROQ_API_KEY` | API Key for Groq Cloud | `gsk_...` |
| `GROQ_MODEL` | Groq model for profile extraction | `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | Google Gemini API key (for Doc Simplifier) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini vision/language model | `gemini-2.5-flash-lite` |
| `QDRANT_URL` | Qdrant vector database URL (optional) | `https://xyz.qdrant.tech` |
| `QDRANT_API_KEY` | Qdrant cluster API key (optional) | `...` |
| `QDRANT_COLLECTION` | Vector collection name | `yojana_schemes` |
| `EMBEDDING_MODEL` | Local HuggingFace transformer model | `Xenova/multilingual-e5-small` |

### Frontend (`client/.env`)
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: Neon DB or local PostgreSQL instance
- **API Keys**: Groq API Key (mandatory for AI features), Gemini API Key (for Doc Simplifier)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/new-yojana-saathi.git
cd "new yojana saathi"

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Database Migration & Scheme Ingestion
From the `server/` directory:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed baseline database
npm run db:seed

# Optional: Ingest and index 500+ schemes into Qdrant vectors
npm run ingest
```

### 4. Running the Application

#### Start Backend
```bash
cd server
npm run dev
```
*Server runs on [http://localhost:5000](http://localhost:5000). Health check: `http://localhost:5000/api/health`.*

#### Start Frontend
```bash
cd client
npm run dev
```
*Frontend runs on [http://localhost:5173](http://localhost:5173).*

---

## 🧪 Testing

The repository contains automated unit and integration tests using Node's native test runner:

```bash
cd server
npm test
```
Runs:
- `tests/rules.test.js`: Validates age boundaries, state filters, income ceiling comparisons, category matches, and profile-affinity scoring.
- `tests/docSimplifier.test.js`: Validates Gemini response formatting, fallback mocks, and rate limiting.
- `tests/multilingual.test.js`: Validates translations and language context switching.

---

## 🔍 Deep-Dive: Core Business Logic & Recent Fixes

### 1. Multi-Factor Profile-Affinity Recommendation Engine
- **File**: `server/src/services/recommendation/recommendation.service.js` & `ruleEngine.js`
- **Issue Solved**: Previously, recommendation queries returned the same generic 40 schemes regardless of whether the profile was a farmer, student, or senior citizen.
- **Solution Implemented**:
  - Implemented multi-stage scoring:
    - **Stage 1 (Hard Rule Filtering)**: Evaluates strict criteria (`eq`, `lte`, `gte`, `in`, `between`) against user age, gender, state, category, annual income, land ownership, and disability.
    - **Stage 2 (Affinity Bonus Weighting)**: Schemes explicitly matching user occupation (e.g. Farmer -> PM-KISAN, Student -> Scholarships), gender-specific initiatives, and minority/caste provisions receive scaled affinity boosts (+15 to +35 points).
    - **Stage 3 (Partitioning)**: Output is classified into `ELIGIBLE` (score $\ge 60$ and no mandatory rule failures), `POSSIBLY_ELIGIBLE` (minor missing criteria), and `NOT_ELIGIBLE`.
  - **Batch Insertion Performance**: Replaced individual `prisma.recommendationScheme.create` iterations with `prisma.recommendationScheme.createMany`, preventing Axios 30-second gateway timeouts.

### 2. Neon PostgreSQL Cold-Start Resilience
- **File**: `server/src/lib/prisma.js`
- **Issue Solved**: Neon serverless database spins down compute after inactivity. Initial API requests failed with `PrismaClientInitializationError: P1001` or `Error { kind: Closed }`.
- **Solution Implemented**:
  - Created `withConnectionRetry(fn, maxRetries = 5, baseDelay = 1000)` with exponential backoff and jitter.
  - Added support for both `error.errorCode` and `error.code` across Prisma v5/v6.
  - Appended `connect_timeout=30` to connection pools.

### 3. Saathi AI Chatbot Reliability & Hybrid Fallback
- **File**: `server/src/services/chat/chat.service.js` & `qdrant.service.js`
- **Issue Solved**: Chatbot hung for 20+ seconds when Qdrant was slow or unreachable, eventually hallucinating that the database contained no schemes.
- **Solution Implemented**:
  - Added strict 1.5-second timeout on vector retrieval.
  - Implemented fallback directly to relational database search with regex-based category intent detection (e.g., matching keywords for agriculture, scholarships, pensions).
  - Grounded prompts explicitly in scheme metadata (benefits, documents, application process, and official links).

### 4. Complete Landing Page Internationalization
- **File**: `client/src/pages/Home.jsx` & `client/src/i18n/locales/*.json`
- **Issue Solved**: Changing languages in the navbar left the landing page in English because strings were hardcoded in JSX.
- **Solution Implemented**:
  - Created 141 translation keys under the `home` namespace in `en.json`, `hi.json`, and `bn.json`.
  - Connected `useTranslation()` across all 10 landing sections: Hero, Marquee, Challenges, Personas, Solution Steps, How It Works, Capabilities, Trust, Social Impact, Final CTA, and Footer.

---

## 🌐 API Route Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service and database health check | No |
| `POST` | `/api/auth/register` | Register citizen account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `POST` | `/api/auth/logout` | Clear auth cookies | Yes |
| `GET` | `/api/profile` | Fetch citizen eligibility profile | Yes |
| `PUT` | `/api/profile` | Update eligibility profile | Yes |
| `POST` | `/api/ai/extract-profile` | Extract structured parameters from voice text | No |
| `GET` | `/api/schemes` | Search & paginate 505 welfare schemes | No |
| `GET` | `/api/schemes/:id` | Get detailed scheme benefits & requirements | No |
| `POST` | `/api/recommendations` | Generate personalized scheme matches | Yes |
| `GET` | `/api/recommendations/latest`| Fetch latest recommendation report | Yes |
| `GET` | `/api/bookmarks` | Fetch user-saved schemes | Yes |
| `POST` | `/api/bookmarks/:schemeId` | Bookmark a scheme | Yes |
| `DELETE`| `/api/bookmarks/:schemeId` | Remove bookmark | Yes |
| `POST` | `/api/chat` | Send message to Saathi AI Assistant | No / Optional |
| `GET` | `/api/chat/history` | Retrieve past chat sessions | Yes |
| `POST` | `/api/doc-simplifier` | Simplify government PDF/image/text | No |

---

## 🛡️ License

This project is licensed under the MIT License.
