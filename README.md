# راہ — Raah Career Compass 🧭

> **AI-powered career guidance for Pakistani teenagers aged 13–20**
> Built for the Innovators Challenge Hackathon

Raah (راہ, meaning *"path"* in Urdu) is a conversational AI career companion that helps young Pakistanis discover their ideal career path — tailored to their personality, academic strengths, city, and family background.

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

## 🚀 Quick Start (Windows)

### Prerequisites
- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Gemini API Key** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/raah-career-compass.git
cd raah-career-compass
```

### 2. Set up the Backend
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Set up the Frontend
```bash
cd ../frontend

# Install Node dependencies
npm install

# Configure environment (optional — defaults to localhost:8000)
copy .env.example .env
```

### 4. Run the App

**Option A — One-click launcher (recommended):**
```
Double-click start-all.bat
```

**Option B — Manual:**
```bash
# Terminal 1 — Backend
cd backend
py main.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

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
