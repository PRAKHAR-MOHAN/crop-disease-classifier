# Next Steps & Production Roadmap

## 1. Active Learning & Continuous Retraining Loop
- **Harvest User Feedback**: The backend currently logs prediction confirmations and corrections to `user_feedback` in SQLite/PostgreSQL.
- **Uncertainty Mining**: Automated background job flagging images with:
  - Energy score near threshold ($-4.0 \le E(x) \le -3.0$).
  - High entropy across top-3 predictions.
  - Confirmed human correction via `/feedback`.
- **Annotation & Retraining Trigger**: Push mined images to Label Studio / CVAT for expert review, appending verified images to the training parquet corpus once per month.

---

## 2. Edge & Mobile Deployment (On-Device Inference)
- **TFLite / MobileNet**:
  - Convert `artifacts/model.onnx` to TensorFlow Lite flatbuffers (`.tflite`) with FP16 or INT8 post-training quantization.
  - Embed inside a React Native or Flutter mobile application for offline field operation in remote agricultural areas with zero cellular connectivity.
- **ONNX Runtime Mobile**:
  - Compile minimal ONNX Runtime mobile package supporting only the operators used in `model.onnx` (reducing binary size to ~3 MB).

---

## 3. Geographic & Crop Expansion
- **Cereals & Staples**: Expand coverage for Sorghum, Millet, Yam, and Teff.
- **Multi-Pest Segmentation**: Upgrade from image-level classification to bounding-box object detection (YOLOv10 / RT-DETR) to count individual aphids, armyworm larvae, and whitefly clusters per leaf.
- **Soil & Nutrient Deficiency Identification**: Distinguish nitrogen, phosphorus, and potassium chlorosis patterns from biotic pathogen lesions.

---

## 4. Voice & Multi-Modal Advisory
- **Audio Symptoms**: Integrate text-to-speech (TTS) and speech-to-text (STT) in local dialects (Swahili, Hindi, Spanish, Yoruba) so non-literate farmers can speak their symptoms and hear audio advice.
- **Multi-Modal Verification**: Feed predicted class and image into a local lightweight VLM (e.g. PaliGemma / Moondream2) to generate contextualized natural-language agronomic explanations.

