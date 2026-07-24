"""
train.py
--------
Trains EfficientNet-B0 (ImageNet pretrained) on the FixMate dataset.

Usage:
    python train.py

Output:
    model/best_model.pth   ← saved whenever val accuracy improves
"""

import os
import time
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn as nn
# pyrefly: ignore [missing-import]
from torchvision import models
# pyrefly: ignore [missing-import]
from torch.optim import AdamW
# pyrefly: ignore [missing-import]
from torch.optim.lr_scheduler import CosineAnnealingLR

from config import (
    NUM_CLASSES, EPOCHS, LEARNING_RATE, WEIGHT_DECAY,
    MODEL_DIR, MODEL_PATH
)
from dataset_loader import get_dataloaders


# ─── Device ───────────────────────────────────────────────────────────────────

def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")   # Apple Silicon GPU
    return torch.device("cpu")


# ─── Model ────────────────────────────────────────────────────────────────────

def build_model(num_classes: int, device: torch.device):
    """
    EfficientNet-B0 pretrained on ImageNet.
    Replace the final classifier for our 3-class problem.
    """
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

    # Freeze all backbone layers initially
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )

    # Unfreeze last 2 MBConv blocks for fine-tuning
    for name, param in model.named_parameters():
        if "features.7" in name or "features.8" in name or "classifier" in name:
            param.requires_grad = True

    return model.to(device)


# ─── Training Loop ────────────────────────────────────────────────────────────

def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(imgs)
        loss    = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * imgs.size(0)
        preds      = outputs.argmax(dim=1)
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

    return total_loss / total, correct / total


def val_epoch(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0

    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            outputs = model(imgs)
            loss    = criterion(outputs, labels)

            total_loss += loss.item() * imgs.size(0)
            preds      = outputs.argmax(dim=1)
            correct    += (preds == labels).sum().item()
            total      += imgs.size(0)

    return total_loss / total, correct / total


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    device = get_device()
    print(f"\n🚀 FixMate Classifier Training")
    print(f"   Device : {device}")

    # Data
    train_loader, val_loader, class_names = get_dataloaders()

    # Model
    model     = build_model(NUM_CLASSES, device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # Only optimize unfrozen params
    optimizer = AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

    os.makedirs(MODEL_DIR, exist_ok=True)

    best_val_acc = 0.0
    print(f"\n{'─'*60}")
    print(f"  {'Epoch':>5}  {'Train Loss':>10}  {'Train Acc':>9}  "
          f"{'Val Loss':>9}  {'Val Acc':>8}  {'Time':>6}")
    print(f"{'─'*60}")

    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()

        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss,   val_acc   = val_epoch  (model, val_loader,   criterion,            device)
        scheduler.step()

        elapsed = time.time() - t0
        marker  = " ← best" if val_acc > best_val_acc else ""

        print(f"  {epoch:>5}  {train_loss:>10.4f}  {train_acc:>8.2%}  "
              f"{val_loss:>9.4f}  {val_acc:>7.2%}  {elapsed:>5.1f}s{marker}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch":       epoch,
                "model_state": model.state_dict(),
                "val_acc":     val_acc,
                "class_names": class_names,
            }, MODEL_PATH)

    print(f"{'─'*60}")
    print(f"\n✅ Training complete!")
    print(f"   Best val accuracy : {best_val_acc:.2%}")
    print(f"   Model saved to    : {MODEL_PATH}\n")


if __name__ == "__main__":
    main()
