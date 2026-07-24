# FixMate Service Classifier — V1

A custom AI image classifier that looks at a photo and tells you what kind of home repair service is needed.

---

## What We Built

We built our **own image classification model from scratch** — no YOLO, no object detection tricks. Just raw supervised learning on our own dataset.

**Input:** A photo (pipe, wiring, AC unit, etc.)  
**Output:** One of three service categories:

| Label | Meaning |
|---|---|
| `Plumbing` | Leaking pipe, faucet, toilet, sink, tap |
| `Electrical` | Switchboard, wiring, socket, circuit breaker |
| `AC Repair` | AC unit, HVAC technician, servicing, gas refill |

---

## How We Did It — Step by Step

### Step 1: Dataset Collection

There is no ready-made dataset for "plumbing vs electrical vs AC repair". So we built our own.

We wrote a script (`collect_data.py`) that automatically searched Bing Images with targeted keywords and downloaded images for each class:

| Class | Keywords Used |
|---|---|
| Plumbing | "leaking pipe repair", "plumber fixing pipe", "bathroom faucet leak", "toilet plumbing repair", ... |
| Electrical | "electrician repairing switchboard", "burnt electrical socket", "circuit breaker panel", ... |
| AC Repair | "AC servicing technician", "HVAC technician working", "AC indoor unit maintenance", ... |

**Result:** 358 total images collected automatically — no manual downloading.

```
data/plumbing/      → 120 images
data/electrical/    → 120 images
data/ac_repair/     → 118 images
Total               → 358 images
```

---

### Step 2: Dataset Loader with Augmentation

Since 358 images is a small dataset, we applied heavy **data augmentation** during training to prevent overfitting:

- Random crop (256→224)
- Random horizontal flip
- Random rotation (±15°)
- Color jitter (brightness, contrast, saturation, hue)
- ImageNet normalization

**Train / Val split:** 80% train (286 images) / 20% val (72 images)

---

### Step 3: Model — EfficientNet-B0 with Transfer Learning

We did **not train from scratch**. Instead we used **Transfer Learning**:

1. Start with **EfficientNet-B0** pretrained on ImageNet (1.2 million images, 1000 classes)
2. **Freeze** the entire backbone (keep all learned features)
3. **Unfreeze** only the last 2 MBConv blocks for fine-tuning
4. Replace the final classifier with a new **3-class head**

This means the model already knows how to see edges, textures, shapes — we just teach it to apply that knowledge to our 3 categories.

**Why EfficientNet-B0?**
- Lightweight (5.3M params, only 20MB)
- High accuracy relative to model size
- Fast inference — good for a mobile/web app

---

### Step 4: Training

| Setting | Value |
|---|---|
| Optimizer | AdamW |
| Learning Rate | 1e-4 with Cosine Annealing |
| Epochs | 20 |
| Batch Size | 16 |
| Loss | CrossEntropy with Label Smoothing (0.1) |
| Device | Apple MPS (M-series GPU) |

---

## Results

```
────────────────────────────────────────────────────────────
  Epoch  Train Loss  Train Acc   Val Loss   Val Acc    Time
────────────────────────────────────────────────────────────
      1      1.0762    38.81%     0.9672   61.11%   40.9s
      2      0.9867    60.14%     0.8863   73.61%   25.8s
      3      0.9130    70.98%     0.8233   80.56%   27.5s
      6      0.7403    81.82%     0.6806   81.94%   14.0s
      9      0.6437    84.27%     0.6026   86.11%   17.3s
     13      0.5797    86.71%     0.5593   87.50%   14.1s
     17      0.5792    86.36%     0.5496   90.28%   22.2s ← BEST
     20      0.5613    87.76%     0.5446   87.50%   21.7s
────────────────────────────────────────────────────────────

✅ Best Validation Accuracy : 90.28%
   Total Training Time      : ~8 minutes
   Model Size               : ~20MB
   Saved to                 : model/best_model.pth
```

**90.28% accuracy on 358 images in 8 minutes** — this is the power of transfer learning.

---

## Project Structure

```
service_classifier/
├── data/
│   ├── plumbing/           ← 120 images
│   ├── electrical/         ← 120 images
│   └── ac_repair/          ← 118 images
│
├── model/
│   └── best_model.pth      ← trained weights (saved here)
│
├── collect_data.py         ← auto image downloader (Bing crawler)
├── dataset_loader.py       ← PyTorch DataLoader + augmentation
├── train.py                ← EfficientNet-B0 training pipeline
├── predict.py              ← inference on new images
├── config.py               ← all hyperparameters in one place
└── README.md
```

---

## How to Use

### Collect more data (optional)
```bash
python collect_data.py
```

### Train the model
```bash
python train.py
```

### Predict on a new image
```bash
python predict.py --image path/to/photo.jpg
```

Example output:
```
🔍 Image     : bathroom_leak.jpg
📌 Category  : Plumbing
📊 Confidence: 94.3%
   Scores    : {'ac_repair': 0.02, 'electrical': 0.04, 'plumbing': 0.94}
```

### Use in Flask API
```python
from predict import ServiceClassifier

clf = ServiceClassifier()
result = clf.classify("uploaded_image.jpg")
# → {"category": "Plumbing", "confidence": 0.94, "all_scores": {...}}
```

---

## Next Steps (V2)

- [ ] Collect 300 images per class (currently 120) for higher accuracy
- [ ] Fine-tune all backbone layers (unfreeze fully after epoch 10)
- [ ] Add a "Unknown / Other" class for unrecognised images
- [ ] Integrate with Flask upload endpoint
- [ ] Deploy as a microservice