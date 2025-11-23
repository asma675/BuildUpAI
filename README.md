# CareerLift AI – Fullstack App (Frontend + Backend)

This project is a minimal fullstack implementation of **CareerLift AI**, built from your React single-file app and extended with:

- A **Vite + React** frontend
- A **Node + Express** backend that talks to the **Gemini API**
- Optional **Firebase** integration for persisting analysis results per user

---

## 1. Folder Structure

- `frontend/` – Vite + React app (your UI logic)
- `backend/` – Node + Express server that calls the Gemini API
- `backend/.env.example` – Template for Gemini API key and port

---

## 2. Setup Instructions

### 2.1. Backend (Gemini API wrapper)

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
npm install
npm run dev   # or: npm start
```

The backend exposes:

- `POST /api/analyze` – accepts `{ resumeText, careerGoal }` and returns the structured JSON analysis from Gemini plus metadata.

By default it listens on **port 4000**.

---

### 2.2. Frontend (React + Vite + Firebase)

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in `frontend/` (same level as `package.json`) with:

```bash
VITE_APP_ID=careerlift-local
VITE_FIREBASE_CONFIG={"apiKey":"YOUR_KEY","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
# Optional if you use custom tokens; otherwise leave unset and anonymous auth is used
# VITE_INITIAL_AUTH_TOKEN=...
```

> **Note:** The app uses Tailwind via CDN (no build-time config needed).

The Vite dev server proxies `/api` to `http://localhost:4000` as defined in `vite.config.js`.

---

## 3. Firebase Notes

- The app uses `anonymous` auth by default.
- It stores analysis documents under:

  ```
  /artifacts/{appId}/users/{userId}/career_analyses
  ```

  where:
  - `appId` = `VITE_APP_ID` or defaults to `careerlift-default-app`
  - `userId` = Firebase authenticated user ID (or a fallback ID if auth fails)

If you don’t want persistence yet, you can still run the app without valid Firebase config; it will log an error and skip Firestore writes.

---

## 4. How the Flow Works

1. User opens frontend and pastes resume + selects a career goal.
2. Frontend calls `POST /api/analyze` on the backend.
3. Backend calls **Gemini** with the structured JSON schema and Google Search tool enabled.
4. Gemini returns a JSON string; backend parses it and adds:
   - `timestamp`
   - `careerGoal`
   - `sources` (grounding links)
5. Frontend stores this document in Firestore (if configured) and shows:
   - Dashboard with score, summary, missing skills
   - Recommendations page with certifications, opportunities, and grounding sources.

---

## 5. Production Tips

- Deploy `backend/` (e.g., Render, Railway, Cloud Run, etc.) and set `GEMINI_API_KEY` as a secret.
- Build frontend (`npm run build`) and host on Vercel/Netlify/S3+CloudFront etc.
- Update the Vite proxy or `fetch('/api/analyze')` base URL to your deployed backend.
- Lock down CORS on the backend to your frontend origin(s).

---

You can now open this project in VS Code or any IDE, run both servers, and start using **CareerLift AI** end to end.