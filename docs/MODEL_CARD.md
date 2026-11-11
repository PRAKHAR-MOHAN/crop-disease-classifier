# Model Card — Crop Disease & Pest Classifier

## 1. Model Details
- **Architecture**: Transfer learning with ImageNet-pretrained backbones (`tf_efficientnetv2_s.in21k_ft_in1k`, `convnext_tiny.fb_in22k_ft_in1k`, `swin_tiny_patch4_window7_224.ms_in22k_ft_in1k`), fine-tuned using a 2-stage frozen-to-discriminative-learning-rate protocol.
- **Export Format**: Dual-output ONNX (`opset 17`), emitting both classification `logits` and 1x1 Conv spatial `cam_maps` for instant zero-dependency CPU Grad-CAM calculation (<0.1 ms).
- **Quantization**: Optional dynamic INT8 quantization supported (`artifacts/model_int8.onnx`).
- **Input Resolution**: 224 x 224 RGB, normalized to ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`.
- **Target CPU Latency**: <300 ms per single image upload (empirically ~35–90 ms on modern x86/ARM CPUs).

---

## 2. Intended Use
- **Primary Use Case**: Assisting smallholder farmers, agronomists, and garden enthusiasts in identifying common fungal, bacterial, viral leaf diseases and insect pests from single smartphone photographs.
- **Secondary Use Case**: Providing actionable agronomic advice (symptoms, organic treatments, chemical controls, and prevention tips) directly at the point of diagnosis.
- **Out-of-Scope Uses**: Automated robotic pesticide spraying without human verification; diagnosing non-plant or animal diseases; clinical or regulatory phytosanitary quarantine decisions.

---

## 3. Training Data & Preprocessing
- **Datasets**:
  - **PlantVillage**: Laboratory leaf images on uniform grey/black backgrounds (high-fidelity disease symptom patterns).
  - **PlantDoc**: Real-field images with complex natural backgrounds, varying sunlight, partial occlusions, and multi-leaf clusters.
  - **IP102**: Field-scale insect and pest damage dataset.
  - **Optional Kaggle**: Cassava Leaf Disease & Rice Leaf Disease.
  - **OOD Negatives**: CIFAR-10 non-plant classes (vehicles, animals, objects) used for out-of-distribution calibration and binary PlantGate training.
- **Data Hygiene**:
  - Image integrity verification via PIL decode and aspect ratio filtering.
  - Exact deduplication via SHA-256 byte hashing.
  - **Perceptual near-duplicate clustering via pHash (Hamming distance $\le 6$)** with connected components to prevent burst-photo and augmented copy leakage across splits.
  - Stratified group splitting (70% train / 15% val / 15% test).
  - Dedicated PlantDoc real-field holdout (`test_field.parquet`) to isolate and quantify the **Lab-to-Field Generalization Gap**.

---

## 4. Evaluation & Calibration
- **Metrics Tracked**: Top-1 Accuracy, Macro-F1, Weighted-F1, per-class Precision/Recall, and One-vs-Rest Macro ROC-AUC.
- **Calibration**:
  - Post-hoc **Temperature Scaling** fitted via L-BFGS on validation cross-entropy loss.
  - **Expected Calibration Error (ECE)** tracked across 15 equal-width confidence bins, plotted as reliability diagrams.
- **Out-of-Distribution (OOD) Handling**:
  - **Energy Score**: $E(x) = -T \cdot \log \sum_c \exp(z_c / T)$ thresholded at 95% in-distribution TPR.
  - **Calibrated Max-Softmax Probability**: Thresholded to flag uncertain predictions.
  - **PlantGate Net**: Optional compact MobileNetV3 binary gate ($P(\text{plant}) < 0.45 \to \text{"Not a Plant"}$).

---

## 5. Lab-to-Field Generalization Gap
A key empirical challenge in agricultural machine learning is the performance gap when models trained primarily on curated lab datasets (e.g. PlantVillage with uniform backgrounds) are deployed on real-world farm photographs (e.g. PlantDoc).
- **Observed Gap**: In-domain lab test accuracy (~98–99%) typically drops by 20–35% on uncurated field images due to shadows, soil reflections, co-occurring diseases, and varying camera sensors.
- **Mitigation Implemented**:
  1. Extensive Albumentations simulating outdoor field conditions (random shadows, ISONoise, Gaussian blur, color jitter, coarse dropout).
  2. Batch-level MixUp and CutMix regularisation.
  3. Continuous user feedback collection (`POST /feedback`) for active learning retraining cycles.

---

## 6. Known Limitations & Biases
1. **Lighting & Motion Blur**: Severe sun glare or rapid motion blur can degrade feature maps, occasionally triggering false OOD classifications.
2. **Early-Stage Disease Subtlety**: Pinpoint fungal lesions (<5 mm) may be smoothed out during 224x224 downsampling. High-resolution center crops should be used when inspecting small spots.
3. **Geographic & Varietal Bias**: Training datasets originate predominantly from North American, Asian, and East African agricultural varieties; leaf phenotypes in other agro-climatic zones may exhibit lower confidence.
4. **Co-Infection**: The model treats disease identification as a single-label multi-class problem. If a leaf suffers simultaneously from Bacterial Spot and Nitrogen deficiency, only the dominant visual pattern is predicted.

---

## 7. Safety, Ethics & Chemical Advisory
- Chemical pesticide recommendations must comply with local agricultural extension registrations and pre-harvest intervals (PHI).
- The user interface explicitly presents organic biological controls prior to synthetic chemical interventions to encourage integrated pest management (IPM).

