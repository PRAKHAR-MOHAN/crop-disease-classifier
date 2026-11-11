# Cloud Deployment Guide — Crop Disease Classifier

This guide outlines deployment options for hosting the backend API, frontend web app, and model artifacts on free or low-cost cloud platforms.

---

## 1. Architecture Overview

```
[ User Browser / Mobile ]
           │
           ▼
[ Frontend (Vercel / Netlify / Cloudflare Pages) ]
           │  HTTPS API requests
           ▼
[ Backend (Hugging Face Spaces Docker / Render / Railway) ]
           │  ONNX Runtime (CPU)
           ▼
[ Model Artifacts (Hugging Face Hub / Volume / Baked Image) ]
```

---

## 2. Option A: Hugging Face Spaces (Backend Docker) — Free

Hugging Face Spaces provides 2 vCPU / 16 GB RAM containers with free HTTPS endpoints.

### Steps:
1. Create a new Space on [huggingface.co/spaces](https://huggingface.co/spaces) with **Docker** SDK.
2. Clone your Space repo:
   ```bash
   git clone https://huggingface.co/spaces/<your-username>/<your-space-name>
   cd <your-space-name>
   ```
3. Copy the project files:
   - `backend/` → `backend/`
   - `configs/advice_kb.json` → `configs/advice_kb.json`
   - `artifacts/model.onnx` and `artifacts/model_meta.json` → `artifacts/` (or configure auto-download via `HF_MODEL_REPO`)
   - `backend/Dockerfile` → `Dockerfile` at the root of the Space
4. In `Dockerfile`, ensure port `7860` is exposed if using HF Spaces default port, or set:
   ```dockerfile
   CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
5. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy Crop Disease backend"
   git push
   ```

---

## 3. Option B: Render or Railway (Backend)

### Render:
1. Connect your GitHub repository to [render.com](https://render.com).
2. Create a new **Web Service**.
3. Select **Docker** environment:
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Context**: `.`
4. Set Environment Variables:
   - `APP_ENV=production`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `HF_MODEL_REPO=your-username/crop-disease-artifacts` (optional, for auto-downloading `.onnx`)

### Railway:
1. Deploy using `railway up` or connect GitHub repo.
2. Add volume at `/app/data` to persist user feedback SQLite database across redeployments.

---

## 4. Option C: Vercel or Netlify (Frontend)

The frontend is a static React single-page app (SPA) that compiles to pure HTML/CSS/JS.

### Vercel:
1. Import repository on [vercel.com](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.hf.space` (or your Render/Railway backend URL)
4. Deploy!

### Netlify:
Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 5. Storing Model Artifacts on Hugging Face Hub

Large binary files (`model.onnx`, `plant_gate.onnx`) should not be checked into Git history. Store them on the Hugging Face Hub:

```python
from huggingface_hub import HfApi

api = HfApi()
api.create_repo(repo_id="your-username/crop-disease-artifacts", repo_type="model")

api.upload_file(
    path_or_fileobj="artifacts/model.onnx",
    path_in_repo="model.onnx",
    repo_id="your-username/crop-disease-artifacts",
)
api.upload_file(
    path_or_fileobj="artifacts/model_meta.json",
    path_in_repo="model_meta.json",
    repo_id="your-username/crop-disease-artifacts",
)
```

When `HF_MODEL_REPO` is set in your backend environment variables, the backend automatically downloads missing weights on container startup.

