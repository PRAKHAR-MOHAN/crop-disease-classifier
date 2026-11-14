# 🌾 Crop Disease & Pest Classifier

An end-to-end, production-grade deep learning system for crop disease and pest identification with calibrated confidence, Grad-CAM visual explainability, agronomic treatment advice, out-of-distribution (OOD) rejection, a FastAPI backend, and a mobile-first React frontend.

---

## 🌟 Key Features

1. **Multi-Dataset Training**:
   - Ingests **PlantVillage** (lab images), **PlantDoc** (real-field images), **IP102** (agricultural insect pests), and optional **Cassava & Rice Leaf Disease**.
   - Standardized canonical taxonomy: `Crop___Disease` (e.g. `Tomato___Early_blight`, `Tomato___healthy`, `Pest___Aphids`).
2. **Leak-Free Splitting & De-duplication**:
   - Exact SHA-256 deduplication + **perceptual hash (pHash Hamming distance $\le 6$) clustering** via connected components to ensure burst-shot photos and augmented copies never leak across splits.
   - Stratified group splitting (70% train / 15% val / 15% test).
   - Dedicated PlantDoc real-field holdout to quantify the **Lab-to-Field Generalization Gap**.
3. **Advanced PyTorch + timm Modeling**:
   - Backbones compared: **EfficientNetV2-S**, **ConvNeXt-Tiny**, and **Swin-Tiny** / ViT-Small.
   - Two-stage training: frozen-head warmup followed by discriminative learning rate fine-tuning with AdamW, cosine LR schedule, linear warmup, AMP mixed precision, EMA (`ModelEmaV2`), and gradient clipping.
   - Albumentations outdoor field augmentations + batch-level MixUp/CutMix.
   - Optuna hyperparameter optimization with `MedianPruner` and Weights & Biases / MLflow tracking.
   - Optional knowledge distillation into lightweight `mobilenetv3_large_100`.
4. **Calibration, OOD & Explainability**:
   - Post-hoc **Temperature Scaling** via L-BFGS to minimize Expected Calibration Error (ECE).
   - OOD detection combining **Energy-based scoring** ($E(x) = -T \log \sum e^{z/T}$) and a lightweight binary **PlantGate** to safely reject non-plant images or unconfident predictions.
   - **Dual-output ONNX export**: Computes exact GAP Grad-CAM in `<0.1 ms` directly inside ONNX Runtime via a 1x1 convolution, achieving `<100 ms` total CPU inference latency (well below the 300 ms target) without needing PyTorch in production.
5. **FastAPI Backend**:
   - `POST /predict`, `GET /health`, `GET /classes`, `GET /advice/{class_id}`, `POST /feedback`.
   - Magic-byte validation, CORS, `slowapi` rate limiting, structured JSON logging with request IDs, and SQLite/PostgreSQL persistence.
6. **Mobile-First React Frontend**:
   - React + Vite + Tailwind CSS with dark mode, native camera capture (`capture="environment"`), image preview, calibrated confidence bar, interactive Grad-CAM heatmap overlay toggle & opacity slider, agronomic treatment advice, "Was this correct?" feedback loop, and multi-language support (English, Hindi, Spanish).

---

## 📸 Screenshots

| Mobile Camera Upload | Grad-CAM Attention Heatmap | Treatment Advice & Feedback |
|:---:|:---:|:---:|
| *(Upload leaf or capture via camera)* | *(Grad-CAM heatmap overlay)* | *(Organic & chemical advice card)* |

---

## 🚀 Quickstart (Docker Compose)

The easiest way to run the full stack locally is with Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/your-username/crop-disease-classifier.git
cd crop-disease-classifier

# 2. Launch backend and frontend containers
docker compose up --build
```

- **Frontend Web App**: [http://localhost](http://localhost)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Step-by-Step Local Setup

### 1. Environment & Dependencies

Requires **Python 3.11** and **Node.js 20+**:

```bash
# Copy and configure environment variables
cp .env.example .env

# Install ML & Training dependencies
pip install -r requirements-ml.txt

# Install Backend dependencies
pip install -r backend/requirements.txt

# Install Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Data Ingestion & Splitting

```bash
# Download datasets (PlantVillage, PlantDoc, and CIFAR-10 OOD non-plant negatives)
python -m ml.data.download --datasets plantvillage plantdoc ood_non_plant

# Clean, deduplicate, and catalog images into data/processed/catalog.parquet
python -m ml.data.clean_and_merge

# Run leak-free perceptual-hash group splitting (70/15/15) + PlantDoc holdout
python -m ml.data.split

# Generate exploratory figures and reports/dataset_card.md
python -m ml.data.dataset_card
```

### 3. Model Training & Comparison

```bash
# Optional: Run Optuna hyperparameter search
python -m ml.training.tune_optuna --config configs/train_efficientnetv2_s.yaml --n-trials 8

# Train and compare all 3 candidate architectures (winner saved to artifacts/best_model.pt)
python -m ml.training.train --compare \
  configs/train_efficientnetv2_s.yaml \
  configs/train_convnext_tiny.yaml \
  configs/train_swin_tiny.yaml

# Train lightweight Plant/Pest vs. Non-Plant OOD gate
python -m ml.models.plant_gate --epochs 4

# Optional: Distill best model into ultra-fast MobileNetV3-Large student
python -m ml.training.distill --config configs/distill_mobilenetv3.yaml --teachers artifacts/best_model.pt
```

### 4. Evaluation, Calibration & Export

```bash
# Evaluate test set & PlantDoc real-field generalization gap + fit temperature scaling
python -m ml.evaluation.evaluate --checkpoint artifacts/best_model.pt

# Export dual-output ONNX (logits + CAM) + model_meta.json + TorchScript + INT8 ONNX
python -m ml.export.export_model --checkpoint artifacts/best_model.pt --torchscript --quantize-int8

# Benchmark CPU latency (<300 ms target) and verify PyTorch-to-ONNX numerical parity
python -m ml.export.benchmark_cpu --onnx artifacts/model.onnx --checkpoint artifacts/best_model.pt
```

### 5. Running the Backend & Frontend

In terminal 1 (Backend API):
```bash
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

In terminal 2 (Frontend App):
```bash
cd frontend && npm run dev
```

Visit `http://localhost:5173` to upload leaf images and test the live classifier.

---

## 🧪 Testing

Run the automated pytest suite covering preprocessing, EXIF orientation, model inference, Grad-CAM generation, and all API endpoints:

```bash
pytest -v backend/tests
```

Run code formatting and lint checks:
```bash
ruff check ml backend
```

---

## 🌐 Standalone Gradio Demo (Fallback)

If you prefer a single-file Gradio web interface without running React:

```bash
pip install gradio
python -m demo.app_gradio
# → Open http://localhost:7860
```

---

## 📚 Documentation
- [Model Card](file:///c:/Users/prakh/OneDrive/Documents/Crop%20Disease/docs/MODEL_CARD.md) — Intended use, calibration, failure modes, and lab-to-field generalization analysis.
- [Dataset Card](file:///c:/Users/prakh/OneDrive/Documents/Crop%20Disease/reports/dataset_card.md) — Class distribution, domain counts, and leakage audit.
- [Cloud Deployment Guide](file:///c:/Users/prakh/OneDrive/Documents/Crop%20Disease/docs/DEPLOYMENT.md) — Deploy to Hugging Face Spaces, Render/Railway, and Vercel/Netlify.
- [Next Steps Roadmap](file:///c:/Users/prakh/OneDrive/Documents/Crop%20Disease/docs/NEXT_STEPS.md) — Active learning feedback loop, TFLite mobile deployment, and multi-modal advisory.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE) &copy; 2026 Prakhar.

