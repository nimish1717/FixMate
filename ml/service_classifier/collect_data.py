"""
collect_data.py
---------------
Automatically downloads images for each service category.
Uses Bing image crawler (no API key required).

Usage:
    python collect_data.py

This will populate:
    data/plumbing/      → ~100 images
    data/electrical/    → ~100 images
    data/ac_repair/     → ~100 images
"""

import os
# pyrefly: ignore [missing-import]
from icrawler.builtin import BingImageCrawler

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# ─── Search Queries per Class ─────────────────────────────────────────────────
SEARCH_QUERIES = {
    "plumbing": [
        "leaking pipe repair",
        "plumber fixing pipe",
        "bathroom faucet leak",
        "PVC pipe plumbing",
        "sink water leak",
        "toilet plumbing repair",
        "water pipe burst",
        "plumbing work home",
    ],
    "electrical": [
        "electrician repairing switchboard",
        "electrical wiring repair",
        "burnt electrical socket",
        "circuit breaker panel",
        "home electrical repair",
        "electrical fault wiring",
        "electrician working",
        "plug socket repair",
    ],
    "ac_repair": [
        "AC servicing technician",
        "air conditioner repair",
        "HVAC technician working",
        "AC indoor unit maintenance",
        "AC outdoor unit repair",
        "air conditioner gas refill",
        "split AC service",
        "AC leaking water fix",
    ],
}

# ─── How many images per query ────────────────────────────────────────────────
IMAGES_PER_QUERY = 15   # 8 queries × 15 = ~120 images per class


def download_images(category: str, queries: list[str]):
    save_dir = os.path.join(DATA_DIR, category)
    os.makedirs(save_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  Downloading: {category.upper()}  →  {save_dir}")
    print(f"{'='*60}")

    for i, query in enumerate(queries, 1):
        print(f"\n  [{i}/{len(queries)}] Query: '{query}'")

        crawler = BingImageCrawler(
            storage={"root_dir": save_dir},
            feeder_threads=1,
            parser_threads=1,
            downloader_threads=4,
        )

        crawler.crawl(
            keyword=query,
            max_num=IMAGES_PER_QUERY,
            min_size=(100, 100),       # skip tiny thumbnails
            max_size=None,
            file_idx_offset="auto",   # avoid overwriting existing files
        )

    total = len([f for f in os.listdir(save_dir)
                 if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])
    print(f"\n  ✅ {category}: {total} images downloaded")
    return total


def main():
    print("\n🚀 FixMate Dataset Collection Starting...")
    print(f"   Saving to: {DATA_DIR}\n")

    summary = {}
    for category, queries in SEARCH_QUERIES.items():
        summary[category] = download_images(category, queries)

    print(f"\n{'='*60}")
    print("  COLLECTION COMPLETE — Summary")
    print(f"{'='*60}")
    for cat, count in summary.items():
        bar = "█" * (count // 5)
        print(f"  {cat:<15} {count:>4} images  {bar}")
    total = sum(summary.values())
    print(f"\n  Total: {total} images collected")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
