#!/usr/bin/env python3

import os
import json
import requests
from PIL import Image, ImageDraw
from inference_sdk import InferenceHTTPClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_test_image():
    """Create a simple test image for segmentation"""
    # Create a simple green field image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), (34, 139, 34))  # Forest green
    
    draw = ImageDraw.Draw(image)
    
    # Add some texture/pattern to make it look more like a field
    for i in range(0, width, 20):
        for j in range(0, height, 20):
            # Vary the green slightly
            color = (34 + (i+j) % 20, 139 + (i+j) % 30, 34 + (i+j) % 20)
            draw.rectangle([i, j, i+10, j+10], fill=color)
    
    # Add a brown path in the middle
    draw.rectangle([width//2-20, 0, width//2+20, height], fill=(139, 69, 19))
    
    # Save test image
    test_path = os.path.join('uploads', 'test_field.jpg')
    os.makedirs('uploads', exist_ok=True)
    image.save(test_path, 'JPEG', quality=95)
    print(f"✅ Created test image: {test_path}")
    return test_path

def test_roboflow_with_test_image():
    """Test the full segmentation pipeline"""
    try:
        # Step 1: Create test image
        test_image_path = create_test_image()
        
        # Step 2: Test Roboflow API
        api_key = os.getenv('ROBOFLOW_API_KEY')
        model_id = os.getenv('ROBOFLOW_MODEL_ID')
        
        print(f"🔧 Testing with API Key: {api_key[:15]}...")
        print(f"🔧 Model ID: {model_id}")
        
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key
        )
        
        print("📡 Making API call...")
        result = client.infer(test_image_path, model_id=model_id)
        
        print(f"📊 API Response:")
        print(f"  - Type: {type(result)}")
        print(f"  - Keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if 'predictions' in result:
            predictions = result['predictions']
            print(f"🎯 Found {len(predictions)} predictions")
            
            for i, pred in enumerate(predictions):
                print(f"\n  Prediction {i+1}:")
                print(f"    - Class: {pred.get('class', 'Unknown')}")
                print(f"    - Confidence: {pred.get('confidence', 0):.3f}")
                print(f"    - Has points: {'points' in pred}")
                print(f"    - Has bounding box: {all(k in pred for k in ['x', 'y', 'width', 'height'])}")
                
                if 'points' in pred:
                    points = pred['points']
                    print(f"    - Points count: {len(points)}")
                    if len(points) > 0:
                        print(f"    - First point: {points[0]}")
                        print(f"    - Last point: {points[-1]}")
                
                if 'x' in pred:
                    print(f"    - Bounding box: x={pred['x']}, y={pred['y']}, w={pred['width']}, h={pred['height']}")
            
            # Step 3: Test segmentation drawing
            print("\n🎨 Testing segmentation drawing...")
            from app import draw_predictions_on_image
            
            output_path = os.path.join('uploads', 'test_segmentation_result.jpg')
            success = draw_predictions_on_image(test_image_path, predictions, output_path)
            
            if success and os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                print(f"✅ Segmentation image created successfully!")
                print(f"   - Output: {output_path}")
                print(f"   - Size: {file_size} bytes")
                
                # Open and check the result
                result_image = Image.open(output_path)
                print(f"   - Dimensions: {result_image.size}")
                print(f"   - Mode: {result_image.mode}")
                
                return True
            else:
                print("❌ Failed to create segmentation image")
                return False
        
        else:
            print("❌ No predictions in API response")
            print(f"📄 Full response: {json.dumps(result, indent=2, default=str)}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_backend_endpoint():
    """Test the backend /api/analyze endpoint"""
    try:
        print("\n🌐 Testing backend endpoint...")
        
        # Create test image if it doesn't exist
        test_image_path = os.path.join('uploads', 'test_field.jpg')
        if not os.path.exists(test_image_path):
            create_test_image()
        
        # Prepare form data
        files = {'image': ('test_field.jpg', open(test_image_path, 'rb'), 'image/jpeg')}
        data = {
            'drone_name': 'Test Drone',
            'date_time': '2025-01-01T12:00',
            'location': 'Test Field',
            'field_size': '10.5',
            'flight_time': '15.0'
        }
        
        # Make request to backend
        response = requests.post('http://localhost:5000/api/analyze', files=files, data=data)
        files['image'][1].close()
        
        print(f"📊 Backend Response:")
        print(f"  - Status Code: {response.status_code}")
        print(f"  - Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"  - Response Keys: {list(result.keys())}")
            
            if 'original_image_url' in result:
                print(f"  - Original image URL: {result['original_image_url']}")
            
            if 'annotated_image_url' in result:
                print(f"  - Annotated image URL: {result['annotated_image_url']}")
            
            print("✅ Backend endpoint test passed!")
            return True
        else:
            print(f"❌ Backend error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting comprehensive segmentation tests...\n")
    
    # Test 1: Roboflow API + Segmentation drawing
    test1_result = test_roboflow_with_test_image()
    
    # Test 2: Backend endpoint (requires authentication, might fail)
    # test2_result = test_backend_endpoint()
    
    print(f"\n📋 Test Results:")
    print(f"  - Roboflow + Segmentation: {'✅ PASS' if test1_result else '❌ FAIL'}")
    # print(f"  - Backend Endpoint: {'✅ PASS' if test2_result else '❌ FAIL'}")
    
    if test1_result:
        print("\n🎉 Segmentation system is working correctly!")
        print("   You can now test with real crop field images.")
    else:
        print("\n❌ Segmentation system needs debugging.")
