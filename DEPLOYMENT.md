# Deployment Guide — Raah Career Compass

Production deployment instructions for various platforms.

---

## 🎯 Pre-Deployment Checklist

- [ ] Frontend build succeeds: `npm run build` in `frontend/`
- [ ] Backend tests pass: All endpoints respond correctly
- [ ] Environment variables configured (`.env` files created)
- [ ] Database (Firebase) configured if using persistence
- [ ] GEMINI_API_KEY set for AI features
- [ ] CORS origins added to backend if needed
- [ ] `.env` files **NOT** checked into git
- [ ] Built files in `frontend/dist/` are gitignored

---

## 📦 Production Build

### Frontend
```bash
cd frontend
npm install --production
npm run build
# Output: frontend/dist/ (static files ready to serve)
```

### Backend
```bash
cd backend
pip install -r requirements.txt
# No build step needed — Python runs directly
```

---

## ☁️ Deployment Options

### Option 1: Vercel (Recommended for Frontend)

**Frontend on Vercel (Free tier available)**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Set environment variables:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```
5. Deploy (automatic on every push)

### Option 2: Render (Backend)

**Backend on Render (Free tier available)**

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add environment variables:
   ```
   GEMINI_API_KEY=your_key_here
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ```
6. Deploy

### Option 3: Docker (Any Platform)

#### Build Docker Image

Create `Dockerfile` in project root:
```dockerfile
# Use official Python runtime as base
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy frontend and build
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Switch back to app root
WORKDIR /app

# Copy backend code
COPY backend .

# Expose ports
EXPOSE 8000 3000

# Run backend; frontend served via Nginx or static file server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t raah-compass .
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key raah-compass
```

### Option 4: DigitalOcean / AWS / Google Cloud

**Backend Deployment (Similar for all)**

1. Create VM/App Platform instance
2. SSH into server
3. Clone repository
4. Install Python 3.10+, Node.js
5. Run backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn main:app --reload --port 8000  # Or use Gunicorn for production
   ```
6. Use Nginx as reverse proxy pointing to `localhost:8000`
7. Set up SSL certificate (Let's Encrypt)

**Frontend Deployment**

```bash
cd frontend
npm install
npm run build
# Serve `dist/` folder via Nginx or web server
```

---

## 🔒 Production Environment Variables

### Backend (`backend/.env`)
```env
# Required
GEMINI_API_KEY=your_google_gemini_key
FRONTEND_URL=https://your-frontend-domain.com

# Optional - for trends/Reddit features
GOOGLE_SEARCH_API_KEY=your_google_search_key
GOOGLE_SEARCH_CX=your_search_cx
REDDIT_CLIENT_ID=your_reddit_id
REDDIT_CLIENT_SECRET=your_reddit_secret

# Optional - Firebase (for data persistence)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_firebase_key
```

### Frontend (`frontend/.env.production`)
```env
VITE_API_URL=https://your-backend-domain.com
```

---

## 🚀 Quick Deployment with Vercel + Render

### Step 1: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Log in with GitHub
2. Click "New Project" → Select your GitHub repo
3. In settings:
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment:
   ```
   VITE_API_URL=https://backend-raah.onrender.com
   ```
5. Click Deploy ✅

**Frontend URL**: `https://raah-[your-name].vercel.app`

### Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) → Create account
2. Click "New +" → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - Name: `backend-raah`
   - Environment: **Python 3**
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Environment variables:
   ```
   GEMINI_API_KEY=your_api_key
   FRONTEND_URL=https://raiders-[your-name].vercel.app
   ```
6. Click Deploy ✅

**Backend URL**: `https://backend-raah.onrender.com`

### Step 3: Update Frontend CORS

Update backend `main.py` with production URL:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://raah-[your-name].vercel.app",  # Add your Vercel URL
]
```

Push to GitHub → Both Vercel and Render auto-redeploy ✅

---

## 📊 Performance Tips

1. **Frontend**: Use Vite's built-in code splitting (automatic)
2. **Backend**: Use Gunicorn for multi-worker Python
3. **Database**: Firebase auto-scales (when configured)
4. **Rate limiting**: Already built-in (15 req/min per IP)
5. **Caching**: Add Redis for conversation caching (optional)

---

## 🔍 Monitoring

### Check Deployment Health

```bash
# Test frontend
curl https://raah-[your-name].vercel.app

# Test backend
curl https://backend-raah.onrender.com/health

# Test API integration
curl -X POST https://backend-raah.onrender.com/session/create
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **500 Backend Error** | Check GEMINI_API_KEY is set; view logs in Render dashboard |
| **Frontend can't reach API** | Verify `VITE_API_URL` in Vercel environment; check backend CORS origins |
| **Build fails** | Check `npm run build` works locally first |
| **Timeouts** | Increase timeouts in frontend API client if needed |

---

## 🎓 Next Steps

- ✅ **Deployed?** → Share your URL with friends!
- 📈 **Scale up** → Add database, caching, CDN as needed
- 🔐 **Security** → Add OAuth2 authentication (optional)
- 📊 **Analytics** → Integrate Google Analytics or similar

---

**Happy deploying! 🚀**
