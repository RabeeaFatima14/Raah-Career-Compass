# راہ — Raah Career Compass 🧭

> **AI-powered career guidance for Pakistani teenagers aged 13–20**
> Built for the Innovators Challenge Hackathon

Raah (راہ, meaning *"path"* in Urdu) is a conversational AI career companion that helps young Pakistanis discover their ideal career path — tailored to their personality, academic strengths, city, and family background.

🔗 Live demo: https://urban-dollop-v6jv499v7qp62w4q9-3000.app.github.dev/

---

## ✨ Features

- 🤖 **AI Chat** — Friendly Urdu-English career conversation powered by Gemini 2.0 Flash
- 🧠 **MBTI Personality Quiz** — 12-question test with Enneagram mapping
- 🗺️ **Personalized Roadmap** — Step-by-step career plan with timeline, costs & opportunities
- 📍 **Local Opportunities** — Volunteering & programs for 8 Pakistani cities
- 📰 **Career Trends** — Live news-based trending careers in Pakistan
- 🔒 **Rate Limiting** — Built-in abuse protection

---

## 🗂️ Project Structure

```
raah-career-compass/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # API routes & server
│   ├── career_matcher.py     # TF-IDF career matching engine
│   ├── prompts.py            # Gemini prompt templates
│   ├── news_fetcher.py       # Career trends via news feeds
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variable template
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Chat, Quiz, Profile, Roadmap, Landing
│   │   ├── components/       # Reusable UI components
│   │   ├── api/client.js     # Axios API client
│   │   ├── App.jsx
│   │   └── index.css         # Global styles
│   ├── .env.example          # Frontend env template
│   └── package.json
│
├── start-all.bat             # 🚀 One-click launcher (Windows)
├── start-frontend.bat        # Start frontend only
├── start-backend.bat         # Start backend only
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com)
- **Gemini API Key** (optional for basic testing) — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/RabeeaFatima14/Raah-Career-Compass.git
cd raah-career-compass
```

### 2. Set Up the Backend
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Configure environment variables for AI features
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY to enable AI features
```

### 3. Set Up the Frontend
```bash
cd ../frontend

# Install Node dependencies
npm install

# (Optional) Configure frontend API URL
cp .env.example .env
# Default points to http://localhost:8000 — change if backend is elsewhere
```

### 4. Run the App

**Option A — Automated Script (All Platforms):**

**Linux/macOS:**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Windows (PowerShell as Administrator):**
```powershell
.\start-all.ps1
```

**Option B — Manual (All Platforms):**

Open **two terminal windows** in the project root:

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the App

For the hackathon demo, visit the live deployment:

- **Live Demo**: https://urban-dollop-v6jv499v7qp62w4q9-3000.app.github.dev/

For local development, open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

> **Tip**: If developing in a containerized environment (Dev Container, Docker, WSL), make sure your browser can reach these addresses. For Dev Containers, use the provided port forwarding setup.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here          # Required
GOOGLE_SEARCH_API_KEY=your_google_search_key     # Optional (web trends)
GOOGLE_SEARCH_CX=your_search_engine_id           # Optional (web trends)
REDDIT_CLIENT_ID=your_reddit_client_id           # Optional (student insights)
REDDIT_CLIENT_SECRET=your_reddit_secret          # Optional (student insights)
FRONTEND_URL=https://your-deployed-frontend.com  # Optional (production CORS)
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000   # Change to your deployed backend URL in production
```

For the current hackathon deployment, the public frontend is available at:

`https://urban-dollop-v6jv499v7qp62w4q9-3000.app.github.dev/`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/session/create` | Create a new session |
| `GET` | `/session/{id}` | Get session data |
| `POST` | `/chat` | Send a chat message |
| `GET` | `/personality/questions` | Get MBTI quiz questions |
| `POST` | `/personality/calculate` | Calculate MBTI type |
| `POST` | `/match-careers` | TF-IDF career matching |
| `POST` | `/generate-roadmap` | Generate AI career roadmap |
| `GET` | `/opportunities/{city}` | Local opportunities by city |
| `GET` | `/trends` | Trending careers from news |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| AI | Google Gemini 2.0 Flash (`google-genai`) |
| ML | scikit-learn (TF-IDF career matching) |
| Database | Firebase Firestore (optional) |
| News | feedparser, BeautifulSoup |

---

## 🔐 Security Notes

- **Never commit `.env` files** — they are gitignored by default
- Rate limiting is built-in: **15 requests per 60 seconds** per IP
- Firebase is **optional** — the app works fully without it
- Input validation via Pydantic with strict max-length limits

---

## ❓ Troubleshooting

### Frontend Connection Refused
**Problem**: `localhost:3000 refused to connect`

**Solutions**:
1. Ensure the frontend dev server is running: `npm run dev` from the `frontend/` directory
2. Check if port 3000 is already in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
3. If port 3000 is occupied, change the port in `frontend/vite.config.js` or kill the process using that port
4. In **Dev Container/Docker environments**, use port forwarding to access the app from your host browser

### Backend Connection Issues
**Problem**: Frontend shows "Cannot connect to server" error

**Solutions**:
1. Verify backend is running: Check that `python -m uvicorn main:app` is executing in the `backend/` directory
2. Verify backend port 8000 is open: `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)
3. Check backend logs for errors — look for startup messages in the terminal
4. Ensure `backend/.env` exists (or use defaults if it doesn't)
5. Without `GEMINI_API_KEY`, AI features are disabled but the app still works

### nodemon or npm errors
**Problem**: `npm run dev` fails with dependency errors

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Ensure Node.js 18+ is installed: `node --version`

### Python dependency errors
**Problem**: `pip install -r requirements.txt` fails

**Solutions**:
1. Upgrade pip: `pip install --upgrade pip`
2. Ensure Python 3.10+: `python --version`
3. Try installing with `--no-cache-dir`: `pip install --no-cache-dir -r requirements.txt`
4. On macOS with Apple Silicon, some packages may need arm64 builds — consider using conda

### Port Already in Use
**Problem**: Ports 3000 or 8000 already in use

**Solutions - Linux/macOS**:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

**Solutions - Windows PowerShell**:
```powershell
# Find process on port 3000 and terminate
Get-Process | Where-Object { $_.ProcessName -match 'node|python' } | Stop-Process -Force
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <b>Built with ❤️ for Pakistan's next generation</b><br>
  <i>Innovators Challenge Hackathon 2026</i>
</div>
