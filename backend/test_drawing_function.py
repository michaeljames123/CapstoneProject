#!/usr/bin/env python3
"""
Test the drawing function with real Roboflow API response
"""

import requests
import base64
from PIL import Image, ImageDraw
import os
import sys
import json

# Add current directory to Python path to import app functions
sys.path.append('.')

def create_test_image():
    """Create a realistic crop field test image"""
    image = Image.new('RGB', (640, 640), (34, 139, 34))
    draw = ImageDraw.Draw(image)
    
    # Create crop field patterns
    for i in range(0, 640, 80):
        for j in range(0, 640, 80):
            color = (0, 100 + (i + j) % 50, 0)
            draw.rectangle([i, j, i+70, j+70], fill=color)
    
    # Add some variation
    for x in range(100, 600, 200):
        for y in range(100, 600, 200):
            draw.ellipse([x-30, y-30, x+30, y+30], fill=(150, 150, 0))
    
    test_image_path = 'test_drawing_image.jpg'
    image.save(test_image_path, 'JPEG')
    print(f"✅ Created test image: {test_image_path}")
    return test_image_path

def get_real_api_response():
    """Get real API response from Roboflow"""
    try:
        print("🌐 Getting real API response...")
        
        api_key = "RlnFmttALS6BQzCy3M6d"
        model_id = "agridroneinsightdetection-zcptl/4"
        api_url = "https://serverless.roboflow.com"
        
        test_image_path = create_test_image()
        
        # Use multipart approach (we know this works)
        endpoint = f"{api_url}/{model_id}"
        
        with open(test_image_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            params = {'api_key': api_key}
            
            response = requests.post(endpoint, files=files, params=params, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Got real API response!")
            
            # Save the response for analysis
            with open('real_api_response.json', 'w') as f:
                json.dump(result, f, indent=2)
            print("💾 Saved response to real_api_response.json")
            
            return result, test_image_path
        else:
            print(f"❌ API failed: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ API error: {str(e)}")
        return None, None

def test_drawing_function():
    """Test the drawing function with real API data"""
    try:
        print("\n🎨 Testing Drawing Function...")
        
        # Get real API response
        api_result, test_image_path = get_real_api_response()
        
        if not api_result or not test_image_path:
            print("❌ Could not get API response for drawing test")
            return False
        
        print(f"📊 API Response Analysis:")
        print(f"   Keys: {list(api_result.keys())}")
        
        if 'predictions' in api_result:
            predictions = api_result['predictions']
            print(f"   Predictions count: {len(predictions)}")
            
            for i, pred in enumerate(predictions):
                print(f"   Prediction {i+1}:")
                print(f"     Keys: {list(pred.keys())}")
                print(f"     Class: {pred.get('class', 'Unknown')}")
                print(f"     Confidence: {pred.get('confidence', 0)}")
                
                # Check for segmentation data
                if 'points' in pred:
                    points = pred['points']
                    print(f"     Points: {len(points)} points found")
                elif 'x' in pred and 'y' in pred:
                    print(f"     Bounding box: x={pred.get('x')}, y={pred.get('y')}, w={pred.get('width')}, h={pred.get('height')}")
        
        # Import drawing function
        from app import draw_predictions_on_image
        
        # Test drawing
        output_path = 'test_annotated_result.jpg'
        
        print(f"\n🖌️ Drawing annotations...")
        success = draw_predictions_on_image(test_image_path, predictions, output_path)
        
        if success and os.path.exists(output_path):
            print(f"✅ Drawing successful! Output: {output_path}")
            
            # Check output image
            output_image = Image.open(output_path)
            print(f"📸 Output image size: {output_image.size}")
            return True
        else:
            print("❌ Drawing failed")
            return False
            
    except Exception as e:
        print(f"❌ Drawing test error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up
        for path in ['test_drawing_image.jpg', 'test_annotated_result.jpg']:
            if os.path.exists(path):
                os.remove(path)

if __name__ == "__main__":
    print("🎨 DRAWING FUNCTION TEST - GOD TIER LEVEL 🎨")
    print("=" * 50)
    
    success = test_drawing_function()
    
    if success:
        print("\n✅ DRAWING FUNCTION WORKS!")
        print("🎉 COMPLETE PIPELINE READY!")
    else:
        print("\n❌ DRAWING FUNCTION NEEDS FIXES!")
    
    print("\n" + "=" * 50)
    print("🏁 DRAWING TEST COMPLETE")
