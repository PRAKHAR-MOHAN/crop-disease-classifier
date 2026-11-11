# Dataset Card — Crop Disease & Pest Classifier

## 1. Overview
- **Standardized Label Format**: `Crop___Disease` (or `Crop___healthy`, `Pest___<Name>`)
- **Total Scanned Raw Files**: 15,178
- **Removed (Corrupt / Too Small / Bad Aspect)**: 1
- **Removed Exact Duplicates (SHA-256)**: 2
- **Clean Catalog Size**: 15,175 images across **1** training classes
- **Unique Visual Clusters (pHash Hamming <= 6)**: 14,223
- **Train Imbalance Ratio (max / min class)**: 1.00x

## 2. Split Summary & Leakage Audit
| Split | Images | Domain Notes |
| --- | ---: | --- |
| `train` | 10,623 | Stratified group split (70% target) |
| `val` | 2,276 | Stratified group split (15% target) |
| `test` | 2,276 | Stratified group split (15% target) |
| `test_field` | 0 | Real-field PlantDoc evaluation set |

- **Leakage-Free Verification**: `True`
  - SHA-256 overlaps: `{'train_val': 0, 'train_test': 0, 'val_test': 0}`
  - Near-duplicate visual group overlaps: `{'train_val': 0, 'train_test': 0, 'val_test': 0}`
  - Cross-split pHash hits: `{'train_val': 0, 'train_test': 0, 'val_test': 0, 'train_field': 0}`

## 3. Exploratory Visualizations
![Class Distribution](figures/class_distribution.png)

![Dataset Sources and Crop Breakdown](figures/domain_breakdown.png)

![Resolution and Aspect Ratio](figures/image_resolution_dist.png)

![Sample Images](figures/sample_grid.png)

## 4. Per-Class Counts
| Class (`Crop___Disease`) | Train | Val | Test | Field (`PlantDoc`) | In-Domain Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `data_distribution_for_SVM___healthy` | 10623 | 2276 | 2276 | 0 | 15175 |
