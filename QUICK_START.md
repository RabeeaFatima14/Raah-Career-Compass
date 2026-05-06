# Quick Start Guide — Raah Career Compass

Get the app running in **less than 5 minutes** on any platform!

---

## 📋 Prerequisites

Install these first:

1. **Python 3.10+** → [python.org/downloads](https://www.python.org/downloads/)
2. **Node.js 18+** → [nodejs.org](https://nodejs.org/)
3. **Git** → [git-scm.com](https://git-scm.com)

Verify installation:
```bash
python --version
node --version
npm --version
```

---

## 🚀 Option 1: Automated Start (Recommended)

### Linux / macOS
```bash
chmod +x start-all.sh
./start-all.sh
```

### Windows (PowerShell as Administrator)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-all.ps1
```

### Windows (Command Prompt)
```cmd
start-all.bat
```

✅ Both servers will start automatically. Open your browser to **http://localhost:3000**

---

## 🚀 Option 2: Manual Start (All Platforms)

### Step 1: Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v4.5.14 ready in 296 ms
➜  Local:   http://localhost:3000/
```

### Step 3: Open Browser
Navigate to: **http://localhost:3000**

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main app (careers quiz & roadmap) |
| **Backend** | http://localhost:8000 | API server |
| **API Docs** | http://localhost:8000/docs | Swagger UI (test endpoints) |
| **Backend Health** | http://localhost:8000/health | Server status check |

---

## ⚙️ Environment Setup (Optional)

For **AI features** (roadmap generation with Gemini):

### Backend (`backend/.env`)
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

Get a free Gemini API key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Frontend (`frontend/.env`)
```bash
cd frontend
cp .env.example .env
# Default is http://localhost:8000 — only change if backend is elsewhere
```

---

## ✅ What to Expect

When you open http://localhost:3000:

1. **Landing Page** — Raah welcome screen with feature overview
2. **Guided Questions** — Local onboarding questionnaire (no API needed)
3. **Personality Quiz** — MBTI test (12 questions)
4. **Profile Form** — Enter background info
5. **Roadmap** — AI-generated career paths (requires `GEMINI_API_KEY` for full AI features)

The app **works without AI enabled** — you'll see placeholder roadmaps if `GEMINI_API_KEY` is not set.

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows PowerShell
Stop-Process -Name node -Force
```

### "Cannot connect to backend"
1. ✅ Check backend is running on http://localhost:8000
2. ✅ Verify port 8000 is open
3. ✅ Check your firewall settings

### "npm command not found"
- Reinstall Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal

### "Python not found"
- Install Python 3.10+ from [python.org](https://python.org/downloads/)
- On macOS with M1/M2, use `python3` instead of `python`

### App loads but shows blank page
1. Open DevTools (F12)
2. Check Console for errors
3. Verify frontend can reach backend: Visit http://localhost:8000/health

---

## 📁 Project Structure

```
raah-career-compass/
├── backend/              # Python FastAPI server
│   ├── main.py           # API routes
│   ├── requirements.txt   # Python dependencies
│   └── .env.example      # Configure Gemini API key here
│
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── pages/        # Quiz, Roadmap, Landing
│   │   └── api/          # Backend client
│   ├── package.json      # NPM dependencies
│   └── .env.example      # Configure API URL here
│
└── start-all.*           # One-click launchers (choose your OS)
```

---

## 🔐 Security Notes

- **Never** commit your `.env` files (they're already in `.gitignore`)
- Don't share your `GEMINI_API_KEY` publicly
- If you fork this repo, keep your keys secret in `.env` (local only)

---

## 📞 Next Steps

- ✅ **App working?** → Explore the conversation flow and roadmap generation
- ❓ **Need help?** → Check [TROUBLESHOOTING.md](README.md#troubleshooting) or issues section
- 🎓 **Want to customize?** → See [README.md](README.md) for full documentation
- 🚀 **Ready to deploy?** → See deployment section in [README.md](README.md)

---

**Happy career exploring! 🧭**
