"""
predict.py
----------
Run inference on a single image using the trained EfficientNet-B0 model.

Usage:
    python predict.py --image path/to/image.jpg

Or import and use in Flask:
    from predict import ServiceClassifier
    clf = ServiceClassifier()
    result = clf.classify("image.jpg")
"""

import argparse
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn.functional as F
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from torchvision import models, transforms
# pyrefly: ignore [missing-import]
import torch.nn as nn

from service_classifier.config import MODEL_PATH, IMG_SIZE, NUM_CLASSES, CLASS_NAMES


class ServiceClassifier:

    def __init__(self):
        self.device = self._get_device()
        self.model  = self._load_model()
        self.transform = transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std =[0.229, 0.224, 0.225],
            ),
        ])

    def _get_device(self):
        if torch.cuda.is_available():
            return torch.device("cuda")
        if torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    def _load_model(self):
        checkpoint = torch.load(MODEL_PATH, map_location=self.device)

        # Rebuild architecture
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, NUM_CLASSES),
        )

        model.load_state_dict(checkpoint["model_state"])
        model.to(self.device)
        model.eval()

        # Use class names from checkpoint if available
        self.class_names = checkpoint.get("class_names", CLASS_NAMES)
        return model

    def classify(self, image_path: str) -> dict:
        """
        Returns:
            {
                "category":    "Plumbing",
                "confidence":  0.94,
                "all_scores":  {"plumbing": 0.94, "electrical": 0.04, "ac_repair": 0.02}
            }
        """
        image = Image.open(image_path).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs  = F.softmax(logits, dim=1).squeeze()

        pred_idx    = probs.argmax().item()
        pred_label  = self.class_names[pred_idx]
        confidence  = probs[pred_idx].item()

        all_scores = {
            name: round(probs[i].item(), 4)
            for i, name in enumerate(self.class_names)
        }

        return {
            "category":   pred_label.replace("_", " ").title(),
            "confidence": round(confidence, 4),
            "all_scores": all_scores,
        }


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FixMate Service Classifier")
    parser.add_argument("--image", required=True, help="Path to image file")
    args = parser.parse_args()

    clf    = ServiceClassifier()
    result = clf.classify(args.image)

    print(f"\n🔍 Image     : {args.image}")
    print(f"📌 Category  : {result['category']}")
    print(f"📊 Confidence: {result['confidence']:.1%}")
    print(f"   Scores    : {result['all_scores']}\n")