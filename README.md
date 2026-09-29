# Yojana Saathii

Yojana Saathi is an AI-powered government scheme discovery and recommendation platform for India. It helps citizens discover relevant central and state welfare schemes, save bookmarked schemes, manage a profile, and ask follow-up questions through a chat assistant grounded in scheme data.

## Overview

The project combines a React + Vite frontend with an Express backend, Prisma + PostgreSQL data layer, Groq-powered profile extraction, and a Qdrant-based retrieval layer for scheme matching. The app is designed to:

- discover relevant government schemes by profile and context
- recommend schemes based on user eligibility and need
- capture user profile information via voice or typed form input
- let users save and revisit favorite schemes
- support chat-based guidance about schemes and next steps

## Tech stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- CSS modules and custom UI styling

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT auth
- Zod validation
- Helmet, CORS, rate limiting, logging

### AI and retrieval
- Groq LLM for profile extraction and answer generation
- Qdrant vector database for scheme relevance search
- scheme ingestion and retrieval pipeline for contextual answers

## Project structure

- client/: React frontend
- server/: Express API and Prisma schema
- server/prisma/: database schema and seed data
- server/src/services/: AI, recommendation, RAG, and chat services

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Groq API key
- Qdrant instance (optional for full RAG-enabled chat features)

## Environment setup

1. Copy the example environment file:
   - server/.env.example -> server/.env
2. Fill in the required values:
   - DATABASE_URL
   - JWT_SECRET
   - FRONTEND_URL
   - GROQ_API_KEY
   - GROQ_MODEL
   - QDRANT_URL
   - QDRANT_API_KEY
3. Install dependencies in both apps:
   - cd client && npm install
   - cd server && npm install

## Database setup

From the server folder:

```bash
npx prisma migrate dev
npx prisma db seed
```

## Run the app

### Frontend
```bash
cd client
npm run dev
```

### Backend
```bash
cd server
npm run dev
```

The frontend usually runs on http://localhost:5173 and the API on http://localhost:5000.

## Key routes

- /api/auth
- /api/profile
- /api/schemes
- /api/recommendations
- /api/bookmarks
- /api/ai
- /api/chat
- /api/health

## Verification status

The current workspace is in a verified working state after the latest pass:

- client production build succeeds
- backend starts successfully and serves the health endpoint
- Prisma migrations and seed are working
- Groq API validation is operational
- chat endpoints and rate limiting are in place

## Notes

This project was built as a full-stack government scheme assistant and is organized for further enhancement, including stronger monitoring, analytics, and production deployment hardening.
