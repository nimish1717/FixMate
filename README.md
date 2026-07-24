# FixMate (FixKar)

**FixMate** (also known as FixKar) is a comprehensive, full-stack home service and repair platform. It connects users with verified workers (plumbers, electricians, mechanics) and shopkeepers to seamlessly resolve household issues. 

The platform leverages real-time communication, location-based services, and an integrated Machine Learning engine to automatically classify repair needs from photos and verify the completion of tasks using "before and after" image analysis.

🔗 **Live Deployment:** [https://fix-mate-coral.vercel.app/](https://fix-mate-coral.vercel.app/)

---

## 🚀 Key Features

* **Intelligent Issue Classification:** Users can upload a photo of a broken item (e.g., a leaking pipe), and the built-in Machine Learning API automatically classifies the issue and recommends the appropriate worker (Plumber, Electrician, etc.).
* **Automated Repair Verification:** AI-driven "Before & After" photo verification to confirm that a repair job has been successfully completed.
* **Role-Based Dashboards:** Dedicated interfaces and workflows for Users, Workers, Shopkeepers, and Administrators.
* **Real-Time Communication:** Instant messaging and live booking status updates powered by WebSockets.
* **Location & Mapping:** Integrated maps for users to track workers and find nearby shops.
* **Secure Authentication:** JWT-based secure login and session management.
* **Cloud Media Storage:** All user avatars, issue reports, and verification photos are securely stored and optimized in the cloud.

---

## 💻 Technology Stack

FixMate is built using a modern, scalable microservices-inspired architecture, divided into three core environments:

### Frontend (Client)
* **Framework:** React.js powered by Vite for lightning-fast builds and rendering.
* **Styling:** TailwindCSS for a highly responsive, modern, and animated UI.
* **State Management:** Zustand for lightweight and predictable global state.
* **Routing & Maps:** React Router DOM and React-Leaflet for interactive mapping.
* **Real-time:** Socket.io-client for instant UI updates.

### Backend (Node.js Server)
* **Framework:** Node.js with Express.js.
* **Database:** MongoDB (Mongoose) for flexible, document-based data storage.
* **Authentication:** JSON Web Tokens (JWT) and bcryptjs for secure password hashing.
* **Real-time Engine:** Socket.io for managing live connections between users and workers.
* **File Uploads:** Multer and Cloudinary for seamless image uploading and hosting.
* **Background Tasks:** Node-cron for automated system cleanups and job scheduling.

### Machine Learning API (Python)
* **Framework:** Flask (deployed via Gunicorn).
* **Deep Learning:** PyTorch and Ultralytics (YOLO) for advanced image recognition.
* **Computer Vision:** OpenCV (Headless) and Scikit-image for processing and comparing before/after photos.
* **Data Processing:** NumPy, Pandas, and Scikit-learn for data manipulation and analysis.

---

## 🧠 How the ML Verification Works
The standout feature of FixMate is its custom AI engine:
1. **Classification:** When a user uploads a photo of an issue, the image is sent to the Python Flask API. A PyTorch/YOLO model analyzes the image to detect the object and the damage, automatically tagging the booking with the correct priority and required worker type.
2. **Verification:** Upon job completion, the worker submits an "after" photo. The AI compares the semantic differences and structural integrity between the "before" and "after" photos using computer vision algorithms to determine a `confidence` and `similarity_score`, preventing fraudulent job completions.

---

*Designed & built by Nimish Agarwal.*
