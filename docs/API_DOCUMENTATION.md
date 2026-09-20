# 📖 Yojana Saathi API Specifications

## 1. Node.js Express Backend Endpoints (`http://localhost:5000`)

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns backend operation status.
- **Response**:
```json
{
  "success": true,
  "message": "Yojana Saathi backend is running",
  "timestamp": "2026-09-20T20:25:00.000Z"
}
```

---

## 2. Python FastAPI AI Engine Endpoints (`http://localhost:8000`)

### Health Check
- **Endpoint**: `GET /health`
- **Description**: Returns Python AI service operation status.
- **Response**:
```json
{
  "status": "ok",
  "service": "Yojana Saathi AI"
}
```
