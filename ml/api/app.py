import os
import sys
import tempfile
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
# pyrefly: ignore [missing-import]
from werkzeug.utils import secure_filename

# Add the parent directory (ml/) to sys.path so we can import our models
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(BASE_DIR)

from service_classifier.predict import ServiceClassifier
from photo_verification.predict import PhotoVerification

app = Flask(__name__)

# Initialize models once when the app starts
print("Loading models... This may take a moment.")
classifier = ServiceClassifier()
verifier = PhotoVerification()
print("Models loaded successfully!")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "FixMate ML API is running"}), 200

@app.route('/api/classify', methods=['POST'])
def classify_service():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        # Save file to a temporary location
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)

        try:
            # Run prediction
            result = classifier.classify(filepath)
            
            # Optionally add the priority/recommended worker mapping
            category = result.get('category', '').lower()
            if 'plumbing' in category:
                result['recommended_worker'] = 'Plumber'
                result['priority'] = 'Medium'
            elif 'electrical' in category:
                result['recommended_worker'] = 'Electrician'
                result['priority'] = 'High'
            elif 'ac' in category:
                result['recommended_worker'] = 'AC Technician'
                result['priority'] = 'Low'

            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up temp file
            if os.path.exists(filepath):
                os.remove(filepath)
            os.rmdir(temp_dir)

@app.route('/api/verify', methods=['POST'])
def verify_photo():
    if 'before' not in request.files or 'after' not in request.files:
        return jsonify({"error": "Both 'before' and 'after' image files are required"}), 400
    
    before_file = request.files['before']
    after_file = request.files['after']
    
    if before_file.filename == '' or after_file.filename == '':
        return jsonify({"error": "No selected files"}), 400

    if before_file and after_file:
        temp_dir = tempfile.mkdtemp()
        
        before_filename = secure_filename(before_file.filename)
        before_filepath = os.path.join(temp_dir, f"before_{before_filename}")
        before_file.save(before_filepath)
        
        after_filename = secure_filename(after_file.filename)
        after_filepath = os.path.join(temp_dir, f"after_{after_filename}")
        after_file.save(after_filepath)

        try:
            # Run verification
            result = verifier.verify(before_filepath, after_filepath)
            
            # Convert NumPy boolean/types to Python native types for JSON serialization
            result['repair_detected'] = bool(result['repair_detected'])
            result['confidence'] = float(result['confidence'])
            result['similarity_score'] = float(result['similarity_score'])

            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up temp files
            if os.path.exists(before_filepath):
                os.remove(before_filepath)
            if os.path.exists(after_filepath):
                os.remove(after_filepath)
            os.rmdir(temp_dir)

if __name__ == '__main__':
    # Run the Flask app
    # Use host='0.0.0.0' so it's accessible from other devices on the network
    app.run(host='0.0.0.0', port=5000, debug=True)
