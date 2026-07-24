# photo_verification/predict.py
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
from skimage.metrics import structural_similarity as ssim
from photo_verification.config import SIMILARITY_THRESHOLD, IMAGE_SIZE


class PhotoVerification:

    def __init__(self):
        self.threshold = SIMILARITY_THRESHOLD

    def preprocess(self, image_path):

        image = cv2.imread(image_path)

        image = cv2.resize(image, IMAGE_SIZE)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        return gray

    def verify(self, before_path, after_path):

        before = self.preprocess(before_path)
        after = self.preprocess(after_path)

        similarity_score, _ = ssim(
            before,
            after,
            full=True
        )

        repair_detected = similarity_score < self.threshold

        confidence = round(
            abs(1 - similarity_score),
            2
        )

        return {
            "repair_detected": repair_detected,
            "confidence": confidence,
            "similarity_score": round(similarity_score, 2)
        }


if __name__ == "__main__":

    verifier = PhotoVerification()

    result = verifier.verify(
        "before.jpg",
        "after.jpg"
    )

    print(result)