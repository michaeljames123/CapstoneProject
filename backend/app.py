from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta
import sqlite3
import json
from PIL import Image, ImageDraw, ImageFont
import requests
import uuid
import base64
from io import BytesIO
import requests
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

DATA_DIR = os.getenv('DATA_DIR', '.')
# Configure upload settings
UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
    
# Initialize extensions
# CORS: always allow browser access to API routes from any origin.
# This avoids preflight failures when calling the backend from the hosted frontend.
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=['Content-Type', 'Authorization'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    supports_credentials=False,
)
jwt = JWTManager(app)

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Roboflow API configuration  
ROBOFLOW_API_URL = "https://serverless.roboflow.com"
ROBOFLOW_API_KEY = os.getenv('ROBOFLOW_API_KEY')
ROBOFLOW_MODEL_ID = os.getenv('ROBOFLOW_MODEL_ID')
ROBOFLOW_CONFIDENCE = int(os.getenv('ROBOFLOW_CONFIDENCE', '50'))
ROBOFLOW_OVERLAP = int(os.getenv('ROBOFLOW_OVERLAP', '30'))
ROBOFLOW_IMAGE_SIZE = int(os.getenv('ROBOFLOW_IMAGE_SIZE', '2048'))

DB_PATH = os.path.join(DATA_DIR, 'agridrone.db')

def init_db():
    """Initialize the database with required tables"""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Analysis records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            drone_name TEXT NOT NULL,
            date_time TEXT NOT NULL,
            location TEXT NOT NULL,
            field_size REAL NOT NULL,
            flight_time REAL NOT NULL,
            original_image_path TEXT NOT NULL,
            result_image_path TEXT,
            analysis_result TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def resize_image_for_api(input_path, max_size=1024):
    """Resize image to be under the API limit while maintaining aspect ratio"""
    try:
        with Image.open(input_path) as img:
            print(f"📐 Original size: {img.size}")
            
            # Calculate new size maintaining aspect ratio
            width, height = img.size
            
            if width > max_size or height > max_size:
                if width > height:
                    new_width = max_size
                    new_height = int((height * max_size) / width)
                else:
                    new_height = max_size
                    new_width = int((width * max_size) / height)
                
                # Resize image
                resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Save resized image
                base_name = os.path.splitext(input_path)[0]
                output_path = f"{base_name}_resized.jpg"
                resized_img.save(output_path, "JPEG", quality=85)
                
                print(f"📐 Resized to: {new_width}x{new_height}")
                return output_path
            else:
                print("📐 Image size is good, no resizing needed")
                return input_path
                
    except Exception as e:
        print(f"❌ Resize error: {str(e)}")
        return input_path  # Return original if resize fails

def call_roboflow_inference(image_path, model_id, confidence=None, overlap=None, image_size=None):
    """Call Roboflow API using correct endpoint and image sizing"""
    try:
        print(f"Making inference call for model: {model_id}")
        print(f"Image path: {image_path}")
        
        # Resize image for API if needed
        target_size = int(image_size or ROBOFLOW_IMAGE_SIZE)
        resized_path = resize_image_for_api(image_path, max_size=target_size)
        print(f"Using resized image: {resized_path}")
        
        # Use correct endpoint - detect.roboflow.com works!
        api_endpoint = f"https://detect.roboflow.com/{model_id}"
        
        # Prepare the request with correct file parameter
        with open(resized_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}  # Changed from 'image' to 'file'
            params = {
                'api_key': ROBOFLOW_API_KEY,
                'confidence': str(int(confidence or ROBOFLOW_CONFIDENCE)),
                'overlap': str(int(overlap or ROBOFLOW_OVERLAP)),
                'image_size': str(target_size),
                'format': 'json'
            }
            
            print(f"Making request to: {api_endpoint}")
            print(f"API Key (first 10 chars): {ROBOFLOW_API_KEY[:10]}...")
            
            # Make the API call with extended timeout for processing
            print(f"🚀 Starting API request... (this may take 30-60 seconds)")
            response = requests.post(
                api_endpoint,
                files=files,
                params=params,
                timeout=120  # Increased to 2 minutes for processing time
            )
            
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Inference successful!")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            return result
        else:
            print(f"API Error: {response.status_code}")
            print(f"Response text: {response.text}")
            
            # Try alternative format with base64 encoding
            return call_roboflow_inference_base64(image_path, model_id, confidence=confidence, overlap=overlap, image_size=image_size)
            
    except Exception as e:
        print(f"Multipart inference call failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Try alternative format with base64 encoding
        return call_roboflow_inference_base64(image_path, model_id)

def call_roboflow_inference_base64(image_path, model_id, confidence=None, overlap=None, image_size=None):
    """Alternative Roboflow API call using base64 encoding"""
    try:
        print(f"Trying base64 inference for model: {model_id}")
        
        # Read and encode image as base64
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        # Use correct endpoint for base64 as well
        api_endpoint = f"https://detect.roboflow.com/{model_id}"
        
        # Prepare headers and data
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        target_size = int(image_size or ROBOFLOW_IMAGE_SIZE)
        params = {
            'api_key': ROBOFLOW_API_KEY,
            'confidence': str(int(confidence or ROBOFLOW_CONFIDENCE)),
            'overlap': str(int(overlap or ROBOFLOW_OVERLAP)),
            'image_size': str(target_size),
            'format': 'json'
        }
        
        print(f"Making base64 request to: {api_endpoint}")
        
        # Make the API call with extended timeout
        print(f"🚀 Starting base64 API request... (this may take 30-60 seconds)")
        response = requests.post(
            api_endpoint,
            data=image_b64,
            headers=headers,
            params=params,
            timeout=120  # Increased timeout
        )
        
        print(f"Base64 response status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Base64 inference successful!")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            return result
        else:
            print(f"Base64 API Error: {response.status_code}")
            print(f"Response text: {response.text}")
            return None
            
    except Exception as e:
        print(f"Base64 inference call failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def draw_predictions_on_image(image_path, predictions, output_path):
    """Draw instance segmentation polygons and labels exactly like Roboflow interface"""
    try:
        # Open the original image
        image = Image.open(image_path).convert('RGB')
        draw = ImageDraw.Draw(image)
        
        # Get image dimensions
        img_width, img_height = image.size
        
        # EXACT Roboflow class colors from your screenshots
        colors = {
            'healthy corn field area': (0, 255, 0),           # Green - for healthy areas
            'disease corn field area': (255, 255, 0),         # Yellow - for disease areas  
            'damage-pest corn field area': (255, 0, 0),       # Red - for damage/pest areas
            'damage pest corn field area': (255, 0, 0),       # Red - alternative naming
            'default': (0, 255, 255)  # Cyan for unknown
        }
        
        # Outline colors (darker for visibility)
        outline_colors = {
            'healthy corn field area': (0, 180, 0),           # Dark green outline
            'disease corn field area': (200, 200, 0),         # Dark yellow outline
            'damage-pest corn field area': (180, 0, 0),       # Dark red outline
            'damage pest corn field area': (180, 0, 0),       # Dark red outline
            'default': (0, 180, 180)  # Dark cyan outline
        }
        
        # Try to load a font
        try:
            font_size = max(16, min(32, img_width // 50))
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.load_default()
            except:
                font = None
        
        print(f"Drawing {len(predictions)} segmentation masks on image {img_width}x{img_height}")
        
        # Draw each prediction
        for i, prediction in enumerate(predictions):
            class_name = prediction.get('class', 'Unknown')
            confidence = prediction.get('confidence', 0)
            
            print(f"Processing prediction {i+1}: {class_name} with confidence {confidence:.3f}")
            
            # Check if this is instance segmentation (has points)
            if 'points' in prediction and prediction['points']:
                points = prediction['points']
                print(f"Found {len(points)} polygon points for segmentation")
                
                # Convert points to PIL format
                polygon_points = []
                for point in points:
                    x = max(0, min(point['x'], img_width - 1))
                    y = max(0, min(point['y'], img_height - 1))
                    polygon_points.append((x, y))
                
                if len(polygon_points) >= 3:  # Need at least 3 points for a polygon
                    # Get colors
                    class_key = class_name.lower()
                    fill_color = colors.get(class_key, colors['default'])
                    outline_color = outline_colors.get(class_key, outline_colors['default'])
                    
                    # Create transparent overlay for filled polygon like Roboflow
                    polygon_overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
                    poly_draw = ImageDraw.Draw(polygon_overlay)
                    
                    # Draw semi-transparent filled polygon
                    transparent_fill = fill_color + (80,)  # Add transparency
                    poly_draw.polygon(polygon_points, fill=transparent_fill)
                    
                    # Composite the overlay onto the main image
                    image = Image.alpha_composite(image.convert('RGBA'), polygon_overlay).convert('RGB')
                    draw = ImageDraw.Draw(image)  # Refresh draw object
                    
                    # Draw thick outline polygon like Roboflow
                    draw.polygon(polygon_points, outline=outline_color, width=4)
                    
                    # Calculate label position (centroid of polygon)
                    if polygon_points:
                        center_x = sum(p[0] for p in polygon_points) // len(polygon_points)
                        center_y = sum(p[1] for p in polygon_points) // len(polygon_points)
                        
                        # Create label
                        label = f"{class_name} {confidence:.0%}"
                        
                        # Enhanced label drawing like Roboflow
                        if font:
                            bbox = draw.textbbox((0, 0), label, font=font)
                            label_width = bbox[2] - bbox[0] 
                            label_height = bbox[3] - bbox[1]
                        else:
                            label_width = len(label) * 10  # Bigger default size
                            label_height = 16
                        
                        # Position label at top-left of polygon
                        min_x = min(p[0] for p in polygon_points)
                        min_y = min(p[1] for p in polygon_points)
                        
                        label_x = max(5, min_x)
                        label_y = max(5, min_y - label_height - 5)  # Above polygon
                        
                        # Draw prominent label background like Roboflow
                        padding = 6
                        bg_rect = [
                            label_x - padding, 
                            label_y - padding,
                            label_x + label_width + padding, 
                            label_y + label_height + padding
                        ]
                        
                        # Black background with outline color border
                        draw.rectangle(bg_rect, fill=(0, 0, 0), outline=outline_color, width=2)
                        
                        # Draw bold white text like Roboflow
                        if font:
                            draw.text((label_x, label_y), label, fill=(255, 255, 255), font=font)
                        else:
                            draw.text((label_x, label_y), label, fill=(255, 255, 255))
                    
                    print(f"Drew segmentation mask with {len(polygon_points)} points")
                else:
                    print(f"Not enough points ({len(polygon_points)}) to draw polygon")
            
            else:
                # Fallback to bounding box if no segmentation points
                print("No segmentation points found, drawing bounding box instead")
                x = prediction.get('x', 0)
                y = prediction.get('y', 0)
                width = prediction.get('width', 0)
                height = prediction.get('height', 0)
                
                if width > 0 and height > 0:
                    left = x - width / 2
                    top = y - height / 2
                    right = x + width / 2
                    bottom = y + height / 2
                    
                    # Clamp to image bounds
                    left = max(0, min(left, img_width))
                    top = max(0, min(top, img_height))
                    right = max(0, min(right, img_width))
                    bottom = max(0, min(bottom, img_height))
                    
                    class_key = class_name.lower()
                    outline_color = outline_colors.get(class_key, outline_colors['default'])
                    
                    # Draw bounding box
                    draw.rectangle([left, top, right, bottom], outline=outline_color, width=3)
        
        # Save the annotated image
        image.save(output_path, quality=95, format='JPEG')
        print(f"✅ Annotated image saved to: {output_path}")
        
        # Verify file was created
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"📁 File size: {file_size} bytes")
            return True
        else:
            print("❌ File was not created!")
            return False
        
    except Exception as e:
        print(f"Error drawing segmentation: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        password_hash = generate_password_hash(password)
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                (username, email, password_hash)
            )
            conn.commit()
            
            access_token = create_access_token(identity=str(cursor.lastrowid))
            return jsonify({
                'message': 'User registered successfully',
                'access_token': access_token,
                'user': {
                    'id': cursor.lastrowid,
                    'username': username,
                    'email': email
                }
            }), 201
            
        except sqlite3.IntegrityError as e:
            if 'username' in str(e):
                return jsonify({'error': 'Username already exists'}), 400
            elif 'email' in str(e):
                return jsonify({'error': 'Email already exists'}), 400
            else:
                return jsonify({'error': 'Registration failed'}), 400
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({'error': 'Username and password are required'}), 400
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            access_token = create_access_token(identity=str(user['id']))
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email']
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/analyze', methods=['POST'])
@jwt_required()
def analyze_image():
    try:
        user_id = int(get_jwt_identity())
        
        print(f"📊 Request analysis:")
        print(f"   Files keys: {list(request.files.keys())}")
        print(f"   Form keys: {list(request.form.keys())}")
        print(f"   Content type: {request.content_type}")
        
        # Check if image file is present (flexible key checking)
        image_file = None
        for key in ['image', 'file', 'drone_image']:
            if key in request.files:
                image_file = request.files[key]
                print(f"   Found image with key: {key}")
                break
        
        if image_file is None:
            return jsonify({'error': 'No image file provided. Available keys: ' + str(list(request.files.keys()))}), 422
        
        if image_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(image_file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, GIF allowed'}), 400
        
        # Get form data
        drone_name = request.form.get('drone_name')
        date_time = request.form.get('date_time')
        location = request.form.get('location')
        field_size = request.form.get('field_size')
        flight_time = request.form.get('flight_time')
        
        if not all([drone_name, date_time, location, field_size, flight_time]):
            return jsonify({'error': 'All form fields are required'}), 400
        
        # Save original image
        filename = secure_filename(image_file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        image_file.save(file_path)
        
        print(f"💾 Saved image to: {file_path}")
        print(f"📏 File size: {os.path.getsize(file_path)} bytes")
        
        # Process image with Roboflow API
        try:
            print(f"Processing image: {file_path}")
            print(f"Model ID: {os.getenv('ROBOFLOW_MODEL_ID')}")
            print(f"API Key: {os.getenv('ROBOFLOW_API_KEY')[:10]}...")
            
            # Check if file exists
            if not os.path.exists(file_path):
                raise Exception(f"Image file not found: {file_path}")
            
            # Prepare image to Roboflow UI image size and call inference with explicit params
            prepared_path = resize_image_for_api(file_path, max_size=ROBOFLOW_IMAGE_SIZE)
            result = call_roboflow_inference(prepared_path, ROBOFLOW_MODEL_ID, confidence=ROBOFLOW_CONFIDENCE, overlap=ROBOFLOW_OVERLAP, image_size=ROBOFLOW_IMAGE_SIZE)
            
            if result is None:
                raise Exception("Roboflow inference failed")
            
            print(f"API Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
            
            if 'predictions' in result:
                print(f"Found {len(result['predictions'])} predictions")
            else:
                print("No predictions key in result")
            
            # Create annotated image if predictions exist
            annotated_image_path = None
            annotated_filename = f"annotated_{unique_filename}"
            
            if 'predictions' in result and result['predictions']:
                print(f"Creating annotated image with {len(result['predictions'])} predictions")
                # Create annotated image path
                annotated_image_path = os.path.join(app.config['UPLOAD_FOLDER'], annotated_filename)
                
                # Draw predictions on image
                success = draw_predictions_on_image(prepared_path, result['predictions'], annotated_image_path)
                if success:
                    print(f"Successfully created annotated image: {annotated_image_path}")
                else:
                    print("Failed to create annotated image")
                    annotated_image_path = None
            else:
                print("No predictions found, skipping annotation")
                annotated_image_path = None
            
            # Convert result to JSON string for storage
            analysis_result = json.dumps(result)
            
            # Save analysis record to database
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO analysis_records 
                (user_id, drone_name, date_time, location, field_size, flight_time, 
                 original_image_path, result_image_path, analysis_result)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, drone_name, date_time, location, float(field_size), 
                  float(flight_time), file_path, annotated_image_path, analysis_result))
            
            record_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Prepare response with image URLs
            response_data = {
                'message': 'Analysis completed successfully',
                'record_id': record_id,
                'analysis_result': result,
                'original_image_url': f"/api/uploads/{unique_filename}",
                'annotated_image_url': f"/api/uploads/{annotated_filename}" if annotated_image_path else None,
                'metadata': {
                    'drone_name': drone_name,
                    'date_time': date_time,
                    'location': location,
                    'field_size': float(field_size),
                    'flight_time': float(flight_time)
                }
            }
            
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Analysis error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Clean up uploaded file if analysis fails
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
        
    except Exception as e:
        print(f"Request error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Analysis request failed: {str(e)}'}), 500

@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    try:
        user_id = get_jwt_identity()
        
        conn = get_db_connection()
        records = conn.execute('''
            SELECT id, drone_name, date_time, location, field_size, flight_time, 
                   created_at, analysis_result
            FROM analysis_records 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,)).fetchall()
        conn.close()
        
        history = []
        for record in records:
            analysis_result = json.loads(record['analysis_result']) if record['analysis_result'] else {}
            history.append({
                'id': record['id'],
                'drone_name': record['drone_name'],
                'date_time': record['date_time'],
                'location': record['location'],
                'field_size': record['field_size'],
                'flight_time': record['flight_time'],
                'created_at': record['created_at'],
                'analysis_result': analysis_result
            })
        
        return jsonify({'history': history}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch history'}), 500

@app.route('/api/field-estimations', methods=['POST'])
@jwt_required()
def log_field_estimation():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}

        name = data.get('name') or 'Field estimation'
        description = data.get('description') or ''
        group = data.get('group') or ''
        measure_type = data.get('type') or 'AREA'
        area_m2 = data.get('area_m2')
        perimeter_m = data.get('perimeter_m')
        distance_m = data.get('distance_m')
        geometry = data.get('geometry')

        center_lat = None
        center_lng = None

        if isinstance(geometry, list) and geometry:
            lats = [float(p.get('lat', 0)) for p in geometry]
            lngs = [float(p.get('lng', 0)) for p in geometry]
            center_lat = sum(lats) / len(lats)
            center_lng = sum(lngs) / len(lngs)
        elif isinstance(geometry, dict) and 'point' in geometry and geometry['point']:
            point = geometry['point']
            center_lat = float(point.get('lat', 0))
            center_lng = float(point.get('lng', 0))

        if center_lat is not None and center_lng is not None:
            location = f"Field estimation: {name} ({center_lat:.6f}, {center_lng:.6f})"
        else:
            location = f"Field estimation: {name}"

        if area_m2 is not None:
            try:
                field_size = float(area_m2) / 4046.8564224
            except Exception:
                field_size = 0.0
        else:
            field_size = 0.0

        flight_time = 0.0
        date_time = datetime.utcnow().isoformat()

        analysis_payload = {
            'type': 'field_estimation',
            'name': name,
            'description': description,
            'group': group,
            'measure_type': measure_type,
            'area_m2': area_m2,
            'perimeter_m': perimeter_m,
            'distance_m': distance_m,
            'geometry': geometry,
            'predictions': []
        }

        analysis_result = json.dumps(analysis_payload)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO analysis_records 
            (user_id, drone_name, date_time, location, field_size, flight_time, 
             original_image_path, result_image_path, analysis_result)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            'Field Estimation',
            date_time,
            location,
            float(field_size),
            float(flight_time),
            '',
            None,
            analysis_result
        ))

        record_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return jsonify({'message': 'Field estimation logged', 'record_id': record_id}), 201

    except Exception as e:
        return jsonify({'error': 'Failed to log field estimation'}), 500

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB'}), 413

# Ensure DB is initialized when running under gunicorn too (idempotent)
try:
    init_db()
except Exception as _e:
    pass

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(debug=True, host='0.0.0.0', port=port)
