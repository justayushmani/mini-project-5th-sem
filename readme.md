# 🇮🇳 Yojana Saathi (योजना साथी)

> **Multilingual AI-Powered Government Scheme Recommendation Platform**  
> *B.Tech AI/ML Mini Project*

Yojana Saathi is designed to empower citizens across India to discover, understand, and apply for government welfare schemes tailored to their unique demographics and financial background, using conversational AI and natural language inputs (including voice).

---

## 🏗️ Architecture Overview

The system consists of three modular services:

1. **Frontend (`/client`)**: React + Vite + Tailwind CSS + Lucide Icons
2. **Backend (`/server`)**: Node.js + Express.js + MongoDB + Mongoose + JWT Auth
3. **AI Service (`/ai-service`)**: Python + FastAPI + NLP Extraction & RAG Pipeline

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (running locally or MongoDB Atlas connection string)

---

### Phase 1 Setup & Installation

#### 1. Setup Backend Server (`/server`)
```bash
cd server
npm install
cp .env.example .env
npm run dev
# Server runs on http://localhost:5000
```

#### 2. Setup AI Service (`/ai-service`)
```bash
cd ai-service
# (Optional) Create virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --port 8000 --reload
# AI Service runs on http://localhost:8000
```

#### 3. Setup Frontend Client (`/client`)
```bash
cd client
npm install
cp .env.example .env
npm run dev
# Vite Client runs on http://localhost:5173
```

---

## 🔍 Verification & Health Checks

Verify that all three components are operational:

- **Express Backend Health Check**:  
  `GET http://localhost:5000/api/health`  
  Response: `{"success": true, "message": "Yojana Saathi backend is running"}`

- **Python FastAPI Health Check**:  
  `GET http://localhost:8000/health`  
  Response: `{"status": "ok", "service": "Yojana Saathi AI"}`

- **React Web App UI**:  
  Open `http://localhost:5173` in your browser. The landing page will dynamically check and display the status of the backend API connection.

---

## 📂 Project Directory Structure

```
Yojana-Saathi/
├── client/          # React + Vite + Tailwind CSS Frontend
├── server/          # Express.js + Node.js + MongoDB API Server
├── ai-service/      # Python + FastAPI AI/NLP & RAG Engine
├── data/            # Local scheme datasets and seed files
├── docs/            # Architecture & API documentation
├── .gitignore
├── README.md
└── package.json
```
