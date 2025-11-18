#!/usr/bin/env python3
"""
Test Roboflow API with correct image size and endpoint
"""

import requests
import json
import os
from PIL import Image

def resize_image_for_api(input_path, max_size=1024):
    """Resize image to be under the API limit while maintaining aspect ratio"""
    try:
        with Image.open(input_path) as img:
            print(f"📐 Original size: {img.size} ({os.path.getsize(input_path)} bytes)")
            
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
                output_path = "resized_crop_image.jpg"
                resized_img.save(output_path, "JPEG", quality=85)
                
                print(f"📐 Resized to: {new_width}x{new_height} ({os.path.getsize(output_path)} bytes)")
                return output_path
            else:
                return input_path
                
    except Exception as e:
        print(f"❌ Resize error: {str(e)}")
        return None

def test_correct_roboflow_api():
    """Test the correct Roboflow API endpoint and method"""
    
    # First, let's create a smaller test image if we don't have the big one
    if not os.path.exists("aerial-view-of-corn-fields-photo.jpg"):
        print("📥 Creating test crop image...")
        # Create a realistic crop field image
        image = Image.new('RGB', (800, 600), (34, 139, 34))  # Green background
        draw = ImageDraw.Draw(image)
        
        # Add crop field patterns
        for i in range(0, 800, 100):
            for j in range(0, 600, 100):
                # Vary the green tones
                green_val = 120 + ((i + j) % 60)
                color = (10, green_val, 25)
                draw.rectangle([i, j, i+90, j+90], fill=color)
        
        # Add a path (brown strip)
        draw.rectangle([390, 0, 410, 600], fill=(139, 69, 19))
        
        image.save("aerial-view-of-corn-fields-photo.jpg", "JPEG")
        print("✅ Created test image")
    
    # Resize image for API
    resized_path = resize_image_for_api("aerial-view-of-corn-fields-photo.jpg")
    if not resized_path:
        print("❌ Failed to prepare image")
        return False
    
    # API configuration
    api_key = "RlnFmttALS6BQzCy3M6d"
    model_id = "agridroneinsightdetection-zcptl/1"
    
    # Try the correct serverless endpoint (from user's original specification)
    print("\n🎯 TESTING: serverless.roboflow.com (from user spec)")
    try:
        api_endpoint = f"https://detect.roboflow.com/{model_id}"
        print(f"🌐 Endpoint: {api_endpoint}")
        
        with open(resized_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            params = {'api_key': api_key}
            
            print("🚀 Making API request...")
            response = requests.post(
                api_endpoint,
                files=files,
                params=params,
                timeout=60
            )
            
        print(f"📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API SUCCESS!")
            
            # Detailed analysis
            print(f"📈 Result structure: {list(result.keys())}")
            
            predictions = result.get('predictions', [])
            print(f"🎯 Found {len(predictions)} predictions:")
            
            for i, pred in enumerate(predictions):
                class_name = pred.get('class', 'Unknown')
                confidence = pred.get('confidence', 0)
                print(f"   {i+1}. {class_name} - {confidence:.3f} confidence")
                
                # Check for polygon points
                if 'points' in pred:
                    points = pred['points']
                    print(f"      🔸 Polygon with {len(points)} points")
                    print(f"      🔸 Sample points: {points[:3]}...")
                else:
                    print(f"      🔹 Bounding box: x={pred.get('x', 0)}, y={pred.get('y', 0)}")
            
            # Save successful result
            with open("successful_api_result.json", "w") as f:
                json.dump(result, f, indent=2)
            print("📄 Saved result to successful_api_result.json")
            
            return result
            
        elif response.status_code == 413:
            print("❌ Image still too large! Need smaller image.")
            print(f"Current size: {os.path.getsize(resized_path)} bytes")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request Error: {str(e)}")
    
    return False

if __name__ == "__main__":
    print("🌾 ROBOFLOW API CORRECT TEST 🌾")
    print("=" * 50)
    
    result = test_correct_roboflow_api()
    
    if result:
        print("\n🎉 SUCCESS! API call working!")
        print("✅ Ready to update main application!")
    else:
        print("\n❌ Still having issues!")
        print("🔍 Need to check API requirements")
    
    print("\n" + "=" * 50)
    print("🏁 TEST COMPLETE")
