#!/usr/bin/env python3
"""
Direct test of Roboflow API with exact user credentials
This will test both multipart and base64 approaches
"""

import requests
import base64
from PIL import Image, ImageDraw
import os

def create_test_image():
    """Create a realistic crop field test image"""
    # Create a more realistic crop field image
    image = Image.new('RGB', (640, 640), (34, 139, 34))  # Forest green
    draw = ImageDraw.Draw(image)
    
    # Create crop field patterns
    for i in range(0, 640, 80):
        for j in range(0, 640, 80):
            # Draw crop patches with some variation
            color = (0, 100 + (i + j) % 50, 0)
            draw.rectangle([i, j, i+70, j+70], fill=color)
    
    # Add some lighter areas (potential issues)
    for x in range(100, 600, 200):
        for y in range(100, 600, 200):
            draw.ellipse([x-30, y-30, x+30, y+30], fill=(150, 150, 0))
    
    # Add some darker areas (healthy crops)
    for x in range(200, 500, 150):
        for y in range(200, 500, 150):
            draw.rectangle([x-20, y-20, x+20, y+20], fill=(0, 80, 0))
    
    test_image_path = 'roboflow_test_image.jpg'
    image.save(test_image_path, 'JPEG')
    print(f"✅ Created test image: {test_image_path}")
    return test_image_path

def test_multipart_api():
    """Test Roboflow API with multipart form data"""
    try:
        print("🚀 Testing Multipart API Call...")
        
        # User's exact credentials
        api_key = "RlnFmttALS6BQzCy3M6d"
        model_id = "agridroneinsightdetection-zcptl/1"
        api_url = "https://serverless.roboflow.com"
        
        # Create test image
        test_image_path = create_test_image()
        
        # Construct endpoint
        endpoint = f"{api_url}/{model_id}"
        
        # Make multipart request
        with open(test_image_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            params = {'api_key': api_key}
            
            print(f"🌐 Endpoint: {endpoint}")
            print(f"🔑 API Key: {api_key[:10]}...")
            
            response = requests.post(
                endpoint,
                files=files,
                params=params,
                timeout=30
            )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Multipart API SUCCESS!")
            print(f"📈 Result keys: {list(result.keys())}")
            
            if 'predictions' in result:
                print(f"🎯 Predictions: {len(result['predictions'])} found")
                for i, pred in enumerate(result['predictions'][:2]):
                    print(f"  Prediction {i+1}: {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.2f}")
            
            # Clean up
            if os.path.exists(test_image_path):
                os.remove(test_image_path)
            
            return result
        else:
            print(f"❌ Multipart failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Multipart error: {str(e)}")
    
    return None

def test_base64_api():
    """Test Roboflow API with base64 encoding"""
    try:
        print("\n🚀 Testing Base64 API Call...")
        
        # User's exact credentials
        api_key = "RlnFmttALS6BQzCy3M6d"
        model_id = "agridroneinsightdetection-zcptl/1"
        api_url = "https://serverless.roboflow.com"
        
        # Create test image
        test_image_path = create_test_image()
        
        # Encode image as base64
        with open(test_image_path, 'rb') as image_file:
            image_data = image_file.read()
            image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        # Construct endpoint
        endpoint = f"{api_url}/{model_id}"
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        params = {'api_key': api_key}
        
        print(f"🌐 Endpoint: {endpoint}")
        print(f"🔑 API Key: {api_key[:10]}...")
        print(f"📏 Image size: {len(image_b64)} chars")
        
        response = requests.post(
            endpoint,
            data=image_b64,
            headers=headers,
            params=params,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Base64 API SUCCESS!")
            print(f"📈 Result keys: {list(result.keys())}")
            
            if 'predictions' in result:
                print(f"🎯 Predictions: {len(result['predictions'])} found")
                for i, pred in enumerate(result['predictions'][:2]):
                    print(f"  Prediction {i+1}: {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.2f}")
            
            # Clean up
            if os.path.exists(test_image_path):
                os.remove(test_image_path)
            
            return result
        else:
            print(f"❌ Base64 failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Base64 error: {str(e)}")
    
    return None

if __name__ == "__main__":
    print("🌾 DIRECT ROBOFLOW API TEST - GOD TIER LEVEL 🌾")
    print("=" * 60)
    
    # Test both approaches
    result1 = test_multipart_api()
    result2 = test_base64_api()
    
    if result1 or result2:
        print("\n✅ AT LEAST ONE API METHOD WORKS!")
        print("🎉 ROBOFLOW INTEGRATION SUCCESSFUL!")
    else:
        print("\n❌ BOTH API METHODS FAILED!")
        print("🔧 Need to debug API configuration")
    
    print("\n" + "=" * 60)
    print("🏁 DIRECT API TEST COMPLETE")
