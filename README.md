# Hanzala AI Tutor — Next.js 15

Migrated from React CRA + Flask to **Next.js 15** (App Router). All Flask API endpoints are now Next.js API routes. No Python required.

## Quick Start

### 1. Create the MySQL database
```sql
CREATE DATABASE IF NOT EXISTS ai_tutor_db;
```

### 2. Install & setup
```bash
npm install
node scripts/setup-db.js   # creates all tables
npm run dev                # http://localhost:3000
```

### 3. Environment variables
Edit `.env.local` (pre-filled with your original keys). For Vercel, add these in the dashboard.

## Production / Vercel
```bash
npm run build && npm start
```
For Vercel, use a cloud MySQL (PlanetScale, Railway, Aiven) and update DB_HOST.

## API Routes (identical to original Flask)
GET/POST /api/sessions | DELETE/PUT /api/sessions/[id] | PUT /api/sessions/[id]/rename | PUT /api/sessions/[id]/pin
GET /api/chat/[sessionId] | POST /api/chat | POST /api/upload | POST /api/enhance-prompt
POST /api/assess | POST /api/save-profile | POST /api/generate-curriculum
POST /api/quiz | POST /api/quiz/score | GET /api/progress
