# SupplySense AI - Deployment Guide (Free Tier)

This guide walks you through deploying all 3 tiers of SupplySense AI for free:
- **Python ML Microservice (FastAPI + XGBoost + SHAP)** &rarr; Render Web Service
- **Node.js Express Backend Orchestrator** &rarr; Render Web Service
- **React 18 Vite Frontend** &rarr; Vercel

---

## Step 1: Push Code to GitHub

Open PowerShell in the project root (`c:\Users\250210\Downloads\SupplySenseAI`) and run:

```powershell
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "feat: complete SupplySense AI platform with ML models and deployment configs"

# 4. Link your remote GitHub repository (create a new public/private repo on github.com first)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/SupplySenseAI.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend & ML Microservice to Render

### Method A: 1-Click Blueprint (Recommended)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** &rarr; **Blueprint**.
3. Select your repository `SupplySenseAI`.
4. Render will detect [`render.yaml`](file:///c:/Users/250210/Downloads/SupplySenseAI/render.yaml) and automatically configure:
   - `supplysense-ml-service` (Python 3.12, FastAPI)
   - `supplysense-backend` (Node.js Express)
5. Click **Apply**.
6. Once deployed:
   - Note your ML Service URL: `https://supplysense-ml-service.onrender.com`
   - Note your Express Backend URL: `https://supplysense-backend.onrender.com`

### Method B: Manual Service Creation on Render
If you prefer creating them manually:
1. **ML Service:**
   - **Type:** Web Service
   - **Root Directory:** `ml-service`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     - `PYTHON_VERSION`: `3.12.0`
     - `GROQ_API_KEY`: *(Your key or leave blank for deterministic fallback)*

2. **Node.js Backend:**
   - **Type:** Web Service
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `ML_SERVICE_URL`: `https://<YOUR_RENDER_ML_SERVICE_NAME>.onrender.com`
     - `NODE_ENV`: `production`

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** &rarr; **Project**.
3. Import your `SupplySenseAI` repository.
4. In project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Click Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://supplysense-backend.onrender.com/api` *(replace with your actual Render backend URL)*
6. Click **Deploy**.

---

## Step 4: Verification Checklist

1. **ML Service:** Visit `https://supplysense-ml-service.onrender.com/health` &rarr; should return `{"status":"healthy"}`.
2. **Backend:** Visit `https://supplysense-backend.onrender.com/api/health` &rarr; should report both Express and ML Service status.
3. **Frontend:** Open your Vercel URL (e.g. `https://supplysense-ai.vercel.app`) &rarr; Dashboard, Suppliers, Risk Analysis, and Simulator should all load live data seamlessly.
