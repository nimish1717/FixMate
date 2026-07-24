import os

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, "data")
MODEL_DIR  = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "best_model.pth")

# ─── Classes ──────────────────────────────────────────────────────────────────
CLASS_NAMES = ["plumbing", "electrical", "ac_repair"]
NUM_CLASSES = len(CLASS_NAMES)

# ─── Image ────────────────────────────────────────────────────────────────────
IMG_SIZE = 224          # EfficientNet-B0 default

# ─── Training ─────────────────────────────────────────────────────────────────
BATCH_SIZE    = 16
EPOCHS        = 20
LEARNING_RATE = 1e-4
WEIGHT_DECAY  = 1e-4

# ─── Data Split ───────────────────────────────────────────────────────────────
TRAIN_SPLIT = 0.80
VAL_SPLIT   = 0.20

# ─── Device ───────────────────────────────────────────────────────────────────
# Will be set dynamically in train.py (cpu / mps / cuda)
DEVICE = "cpu"