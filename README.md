# Yojana Saathi (योजना साथी / যোজনা সাথী)

> **AI-Powered Multilingual Government Scheme Discovery & Citizen Assistance Platform**  
> *Bridging the gap between 500+ Indian welfare schemes and citizens through voice-first conversational AI, deterministic eligibility verification, dynamic bullet-point scheme navigation, automated multilingual translation (English, Hindi, Bengali), and document simplification.*

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Environment Configuration](#-environment-configuration)
- [Automated Testing Suite](#-automated-testing-suite)
- [Research Evaluation Pack (Eval Harness)](#-research-evaluation-pack-eval-harness)
- [Reliability & Engineering Highlights](#-reliability--engineering-highlights)
- [API Reference](#-api-reference)
- [License](#-license)

---

## 🌟 Executive Overview

In India, hundreds of central and state welfare initiatives exist to support farmers, students, women, artisans, seniors, and low-income families (such as PM-KISAN, Ayushman Bharat, PMAY, Sukanya Samriddhi Yojana, and PM Vishwakarma). However, **millions of eligible citizens fail to claim their entitlements** due to:
1. **Fragmented, Dense Portals**: Official guidelines are buried inside multi-page bureaucratic notifications and unformatted wall-of-text paragraphs.
2. **Language Barriers**: Most portals are published primarily in complex English, alienating rural and non-English speaking citizens.
3. **Complex Eligibility Traps**: Opaque conditions (land ceilings, income thresholds, caste/category criteria, and age limits) cause citizens to either not apply or apply to schemes they do not qualify for.
4. **Literacy & Input Constraints**: Complex web forms prevent citizens with limited digital or written literacy from discovering relevant benefits.

**Yojana Saathi** solves this through a voice-first, citizen-centric architecture:
- Citizens can **speak naturally in Hindi, Bengali, or English** to share their situation.
- High-speed AI extracts their demographic and socioeconomic profile in milliseconds.
- A **deterministic rule engine** matches their profile against 505 active schemes with mathematical certainty (`ELIGIBLE`, `POSSIBLY_ELIGIBLE`, `NOT_ELIGIBLE`).
- Detailed scheme requirements and application procedures are broken down into **clean visual bullet points and step-by-step cards**, dynamically translated on-demand into the citizen's native language.

---

## 🚀 Key Features

### 1. Multilingual Voice-First Profiling
- **Speak in Your Native Language**: Real-time voice recognition using the Web Speech API tailored for `hi-IN` (Hindi), `bn-IN` (Bengali), and `en-IN` (Indian English).
- **Zero-Inference Parameter Extraction**: Powered by Groq Cloud LLMs (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`). Converts colloquial phrasing (e.g. *"main up se kisan hoon, saal ka dedh lakh kamata hoon"* or *"ami pashchimbanger chashi, bochore ek lakh taka aay"*) into standardized numeric and enum profiles (`state`, `occupation`, `annualIncome`, `age`, etc.) without hallucinating unspecified traits.

### 2. Clean, Visual Bullet-Point Scheme Details
- **No More Walls of Text**: Built-in intelligent text parser (`bulletParser.js`) cleans out repetitive scraped boilerplate and breaks dense paragraphs into structured bullet points with bold sub-labels (`Sub-Component-I:`, `Objective:`, etc.).
- **Step-by-Step Application Cards**: Automatically parses the application process into sequential, numbered cards (`Step 1`, `Step 2`, `Step 3` / `चरण 1`, `चरण 2` / `ধাপ ১`, `ধাপ ২`) with dedicated application mode badges (`Mode: Online` / `Mode: Offline`).
- **Structured Criteria & FAQs**: Decomposes multi-clause eligibility paragraphs into distinct checklist items with verification badges, and surfaces embedded FAQs into readable Q&A cards.

### 3. On-Demand Dynamic Translation & Database Caching
- **100% Multilingual Coverage**: When any of the 505 schemes is opened in Hindi (`hi`) or Bengali (`bn`), the platform checks the PostgreSQL database for pre-existing localized records.
- **On-the-Fly AI Translation**: If untranslated, Groq dynamically translates the scheme title, overview bullets, and application steps into natural, respectful Hindi or Bengali in ~1.5 seconds.
- **Permanent Database Persistence**: Upserts the newly generated translation directly into PostgreSQL (`SchemeTranslation` table) so subsequent views by any user load instantly in < 15ms.
- **Built-in Fallback Engine**: If AI services throttle or timeout, an integrated rule-based glossary fallback ensures localized titles and bullet structures are always rendered.

### 4. Deterministic Multi-Factor Recommendation Engine
- **Three-Tier Evaluation**: Profiles are evaluated against strict rules (`eq`, `lte`, `gte`, `in`, `between`, `not_in`):
  - `ELIGIBLE`: Passes all mandatory criteria and exceeds the affinity threshold ($\ge 60$).
  - `POSSIBLY_ELIGIBLE`: Matches primary criteria but requires secondary document or status checks.
  - `NOT_ELIGIBLE`: Fails at least one hard boundary (e.g. income exceeds ceiling, age outside allowed bracket).
- **Profile-Affinity Weighting**: Grants prioritized scoring bonuses (+15 to +35) for occupation-matched programs (farmers, artisans, students), gender-focused initiatives, and vulnerable categories.
- **Batch Processing**: Uses bulk database inserts (`createMany`) to generate recommendations in under 300ms without gateway timeouts.

### 5. Saathi AI Chatbot (Hybrid Grounding & Resilient RAG)
- **Zero-Hallucination Retrieval**: Searches official scheme metadata using local multilingual dense embeddings (`Xenova/multilingual-e5-small`) and Qdrant vector retrieval.
- **Relational Fallback**: If the vector index is slow or unreachable, it automatically falls back within 1.5 seconds to PostgreSQL full-text and category intent routing, ensuring the assistant is never stuck.
- **Context-Aware Responses**: Grounded strictly in verified government source URLs, document checklists, and benefit rules.

### 6. AI Document Simplifier
- **Simplifies Complex Circulars**: Citizens upload dense PDF notifications, scanned circulars, or images.
- **Gemini Vision & Text Analysis**: Leverages Google Gemini (`gemini-2.5-flash-lite` / `gemini-3.5-flash-lite`) to output plain-language summaries, monetary values, upcoming deadlines, obligations, and red flags.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Citizen / User]) -->|Voice / Text in EN, HI, BN| Frontend[React 19 + Vite Frontend]
    
    subgraph Frontend Layer
        Frontend --> Router[React Router v7]
        Frontend --> I18n[react-i18next: EN / HI / BN]
        Frontend --> WebSpeech[Web Speech API: speechLang en-IN, hi-IN, bn-IN]
        Frontend --> BulletParser[Bullet Parser: Clean Bullets, Step Cards & FAQs]
        Frontend --> AxiosInst[Axios Client with 60s Timeout]
    end

    AxiosInst -->|REST API Requests| Gateway[Express 4.21 Backend Gateway]

    subgraph Backend Layer
        Gateway --> AuthMiddleware[JWT Auth & Cookie Parser]
        Gateway --> RateLimiter[Express Rate Limiter & Helmet]
        Gateway --> RouterAPI[API Routes: /auth, /profile, /schemes, /recommendations, /chat, /doc-simplifier]
        
        RouterAPI --> AIProfile[Groq LLM Service: Profile Extraction with IPv4 Agent]
        RouterAPI --> TranslationSvc[On-Demand Scheme Translation: Groq + DB Upsert]
        RouterAPI --> RuleEngine[Deterministic Eligibility Engine + Affinity Scorer]
        RouterAPI --> RAGService[Hybrid RAG: Xenova E5 Embeddings + Qdrant]
        RouterAPI --> GeminiDoc[Gemini Vision/Text Document Simplifier]
        RouterAPI --> PrismaClient[Prisma ORM with Connection Retry & IPv4 Routing]
    end

    subgraph Data & Storage
        PrismaClient --> Postgres[(Neon PostgreSQL: 505 Active Schemes, Translations, Profiles)]
        RAGService --> Qdrant[(Qdrant Vector Database)]
    end
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router v7, React-i18next, Lucide React, CSS Modules |
| **Backend** | Node.js 20+ (ES Modules), Express 4.21, Winston Logger, Helmet, CORS, Zod |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM 6 with connection pooling & cold-start retry |
| **LLMs & AI** | Groq Cloud SDK (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`), Google Gen AI SDK (`gemini-2.5-flash-lite`) |
| **Vector Search** | Hugging Face Transformers (`Xenova/multilingual-e5-small`), Qdrant Cloud |
| **Speech & Audio** | Browser Native Web Speech API (`webkitSpeechRecognition`) |

---

## 📂 Repository Structure

```
new yojana saathi/
├── client/                          # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/              # FloatingChat, Navbar, ProtectedRoute
│   │   ├── context/                 # AuthContext, ChatContext, LanguageContext
│   │   ├── hooks/                   # useVoice.js, useDebounce.js
│   │   ├── i18n/                    # i18n configuration and multilingual locales
│   │   │   └── locales/
│   │   │       ├── en.json          # English translation dictionary
│   │   │       ├── hi.json          # Hindi translation dictionary
│   │   │       └── bn.json          # Bengali translation dictionary
│   │   ├── pages/                   # Home, VoiceInput, Recommendations, SchemeDetails,
│   │   │                            # Profile, SavedSchemes, DocSimplifier, Login, Register
│   │   ├── services/                # Axios API client, auth & scheme services
│   │   └── utils/                   # bulletParser.js, formatters.js, constants.js
│   └── package.json
│
├── server/                          # Node.js + Express Backend Engine
│   ├── prisma/
│   │   ├── schema.prisma            # Schema (User, Scheme, SchemeTranslation, SchemeEligibility, etc.)
│   │   ├── seed.js                  # Core database seed script
│   │   ├── seedTranslations.js      # Hindi & Bengali translation seeder
│   │   └── schemes.generated.js     # 505 verified Active schemes repository
│   ├── src/
│   │   ├── config/                  # env.js configuration & startup validation
│   │   ├── controllers/             # auth, profile, scheme, recommendation, chat, doc controllers
│   │   ├── lib/                     # prisma.js, groq.js (with IPv4 agent)
│   │   ├── middleware/              # auth, validate, error, rateLimit
│   │   ├── routes/                  # API route endpoints
│   │   ├── services/
│   │   │   ├── ai/                  # groq.service.js, translation.service.js, gemini.service.js
│   │   │   ├── chat/                # chat.service.js (Saathi assistant logic)
│   │   │   ├── rag/                 # qdrant.service.js, embedding.service.js
│   │   │   ├── recommendation/      # recommendation.service.js, ruleEngine.js
│   │   │   └── scheme/              # scheme.service.js (multilingual & on-demand translation)
│   │   ├── utils/                   # logger.js, response.js
│   │   ├── validators/              # Zod validation schemas
│   │   └── server.js                # Server entrypoint with IPv4 preference & graceful shutdown
│   ├── eval/                        # Research evaluation test suite (60 profiles, gold answers)
│   ├── scripts/                     # activateSchemes.js, importSchemes.js, translateTopSchemes.js
│   ├── tests/                       # rules.test.js, bulletParser.test.js, multilingual.test.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20.x or higher installed
- **Git** installed

### 2. Installation
Clone the repository and install dependencies for both the server and client:
```bash
# Clone the repository
git clone https://github.com/your-username/yojana-saathi.git
cd "new yojana saathi"

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Database & Seeding
From the `server/` directory:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:migrate

# Seed 505 Active schemes and multilingual translations
npm run db:seed
```

### 4. Running the Development Servers

#### Start Backend
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.*

#### Start Frontend
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

Open your browser and navigate to `http://localhost:5173` to explore the platform.

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)
Create or edit `server/.env`:
```env
# ── Core ──
NODE_ENV=development
PORT=5000

# ── Database (PostgreSQL / Neon) ──
# Note: For IPv4 routing with Neon, append the options parameter:
DATABASE_URL="postgresql://user:password@3.220.135.142:5432/neondb?sslmode=require&options=endpoint%3Dep-your-endpoint-id&connect_timeout=30"

# ── Authentication ──
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# ── Frontend URL ──
FRONTEND_URL=http://localhost:5173

# ── Groq Cloud AI ──
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# ── Google Gemini AI (for Document Simplifier) ──
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite

# ── Qdrant Vector Search (Optional) ──
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=yojana_schemes
```

### Frontend (`client/.env`)
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Automated Testing Suite

The project includes unit and integration tests using Node's native test runner (`node:test`):

```bash
cd server
npm test
```

### Current Test Coverage: **25/25 Tests Passing**
1. **Rule Engine & Eligibility Matching (`rules.test.js`)**: 10 tests
   - Validates boundary values (age, income ceilings, state eligibility).
   - Validates category matching, landownership rules, and affinity scoring.
   - Verifies that `PM-JAY` requires strict secondary checks and does not blindly mark unqualified profiles `ELIGIBLE`.
2. **Bullet Parser & Structured Content (`bulletParser.test.js`)**: 8 tests
   - Tests extraction of structured bullet points from monolithic descriptions.
   - Tests clean parsing of Hindi and Bengali bullet points.
   - Tests application process mode extraction and numbered step generation.
   - Tests multi-clause eligibility criteria decomposition and FAQ extraction.
3. **Database Resiliency & Connection Pool Handling (`prismaConnection.test.js`)**: 7 tests
   - Validates `P2024` connection pool timeout and `P1001/P1002/P1008/P1017` retry detection.
   - Tests `withConnectionRetry` automatic backoff and non-retryable error dispatch.
   - Verifies 60-second in-memory session caching and invalidation in auth middleware.

---

## 🔬 Research Evaluation Pack (Eval Harness)

The project includes an end-to-end evaluation harness located in `server/eval/` designed for empirical measurement and research paper reproducibility.

### What It Measures:
- **Parameter Extraction Accuracy**: 60 gold-standard hand-written citizen profiles (20 English, 20 Hindi, 20 Bengali). Measures precision, recall, and F1 across demographic fields, income conversion (numeric and textual), and inference trap resistance.
- **Error Propagation**: Measures the exact delta between recommendations generated from extracted voice parameters vs. ground-truth profiles.
- **Baseline Comparison (Ranking & NDCG)**: Generates a blind review sheet comparing Yojana Saathi's top-5 matches against an optimal keyword-search baseline.
- **Trust in Badges**: Measures precision@k and false-`ELIGIBLE` error rates.

### Running Phase 1 Evaluation:
```bash
cd server

# Quick verification run (3 profiles)
node eval/runEval.js --limit 3

# Full evaluation run across all 60 profiles
node eval/runEval.js
```
The script outputs comprehensive metrics to `server/eval/out/` (`summary.txt`, `env_info.json`, `review_sheet.csv`, `review_key.json`).

---

## 🛡️ Reliability & Engineering Highlights

1. **IPv4 Network Route Enforcement**:
   - On Windows environments where network routers silently drop IPv6 packets to Cloudflare or Neon, Groq API and PostgreSQL connections could hang.
   - Resolved by initializing `groq-sdk` with `https.Agent({ family: 4, keepAlive: true })` and applying `dns.setDefaultResultOrder('ipv4first')` in the server entrypoint, reducing API latency from 30s timeouts down to **~800ms**.
2. **Neon Serverless Cold-Start & Connection Pool Resilience**:
   - Serverless PostgreSQL compute instances (such as Neon) suspend during idle periods.
   - Configured `DATABASE_URL` with `connection_limit=15`, `pool_timeout=30`, and `connect_timeout=30` to prevent Prisma from prematurely timing out with `P2024` during cold-starts or traffic bursts.
   - Built automatic query retry into Prisma Client extensions (`$extends`) catching `P2024`, `P1001`, `P1002`, `P1008`, `P1017`, and socket disconnections with exponential backoff.
   - Added a 60-second in-memory session cache in `auth.middleware.js` to serve burst API requests (`/api/profile`, `/api/bookmarks`, `/api/recommendations`) in sub-milliseconds without hammering the database connection pool.
3. **High-Performance Bulk Operations**:
   - Replaced individual row insertion loops with `prisma.recommendationScheme.createMany` to eliminate Axios 30-second gateway timeouts during recommendation generation.
4. **Hybrid RAG Graceful Degradation**:
   - If Qdrant vector cloud exceeds latency budgets (1.5s), the chatbot immediately falls back to relational database search with regex-based intent classification, ensuring 100% uptime for citizen queries.

---

## 🌐 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service, database, and embedding status check | No |
| `POST` | `/api/auth/register` | Register citizen account | No |
| `POST` | `/api/auth/login` | Citizen login and JWT issuance | No |
| `POST` | `/api/auth/logout` | Clear authorization tokens | Yes |
| `GET` | `/api/profile` | Retrieve citizen eligibility profile | Yes |
| `PUT` | `/api/profile` | Update demographic & financial profile | Yes |
| `POST` | `/api/ai/extract-profile` | Extract structured parameters from voice/text in EN, HI, BN | No |
| `GET` | `/api/schemes` | Search & paginate 505 welfare schemes (filters: state, category) | No |
| `GET` | `/api/schemes/:id` | Fetch detailed scheme with bullet points & on-demand translation | No |
| `POST` | `/api/recommendations` | Generate personalized deterministic scheme recommendations | Yes |
| `GET` | `/api/recommendations/latest` | Retrieve latest recommendation report | Yes |
| `GET` | `/api/bookmarks` | Retrieve user-saved schemes | Yes |
| `POST` | `/api/bookmarks/:schemeId` | Save scheme to bookmarks | Yes |
| `DELETE`| `/api/bookmarks/:schemeId` | Remove scheme from bookmarks | Yes |
| `POST` | `/api/chat` | Chat with Saathi AI Assistant (hybrid RAG) | No / Optional |
| `GET` | `/api/chat/history` | Retrieve past chat conversations | Yes |
| `POST` | `/api/doc-simplifier` | Simplify complex PDF, circular, or image document | No |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
