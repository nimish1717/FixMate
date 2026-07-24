import os
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from torch.utils.data import DataLoader, random_split
# pyrefly: ignore [missing-import]
from torchvision import datasets, transforms

from config import DATA_DIR, IMG_SIZE, BATCH_SIZE, TRAIN_SPLIT


def get_transforms(train: bool):
    """
    Training: heavy augmentation to improve generalisation on small dataset.
    Validation: only resize + normalize.
    """
    mean = [0.485, 0.456, 0.406]   # ImageNet stats (EfficientNet pretrained on it)
    std  = [0.229, 0.224, 0.225]

    if train:
        return transforms.Compose([
            transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
            transforms.RandomCrop(IMG_SIZE),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.3, contrast=0.3,
                                   saturation=0.2, hue=0.1),
            transforms.RandomGrayscale(p=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ])


def get_dataloaders():
    """
    Returns (train_loader, val_loader, class_names).
    Performs an 80/20 stratified-ish split via random_split.
    """

    # Load full dataset with train transforms first (we'll swap val transforms below)
    full_dataset = datasets.ImageFolder(
        root=DATA_DIR,
        transform=get_transforms(train=True),
        is_valid_file=_is_valid_image,
    )

    class_names = full_dataset.classes
    n_total     = len(full_dataset)
    n_train     = int(n_total * TRAIN_SPLIT)
    n_val       = n_total - n_train

    train_set, val_set = random_split(full_dataset, [n_train, n_val])

    # Override val transforms (no augmentation)
    val_set.dataset = _clone_with_transform(full_dataset, get_transforms(train=False))

    train_loader = DataLoader(
        train_set,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0,      # 0 = safe on Mac M-series
        pin_memory=False,
    )

    val_loader = DataLoader(
        val_set,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
        pin_memory=False,
    )

    print(f"  Dataset  : {n_total} images")
    print(f"  Classes  : {class_names}")
    print(f"  Train    : {n_train} | Val: {n_val}")

    return train_loader, val_loader, class_names


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _is_valid_image(path: str) -> bool:
    """Skip corrupt / unsupported files."""
    try:
        img = Image.open(path)
        img.verify()
        return True
    except Exception:
        return False


def _clone_with_transform(dataset: datasets.ImageFolder, transform):
    """Return a shallow copy of an ImageFolder with a different transform."""
    import copy
    cloned = copy.copy(dataset)
    cloned.transform = transform
    return cloned


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    train_loader, val_loader, class_names = get_dataloaders()
    imgs, labels = next(iter(train_loader))
    print(f"  Batch shape : {imgs.shape}")
    print(f"  Labels      : {labels}")
