#!/usr/bin/env python3
"""
Test the exact Roboflow API call to match their interface
Using the exact same image and parameters
"""

import requests
import json
import os
from PIL import Image, ImageDraw

def download_test_image():
    """Download the exact image from Roboflow that gives good results"""
    image_url = "https://source.roboflow.com/jDNKDO0k2DRRHumOnXHO3CB9tIu2/mHA8pxvxUNiZqTS84ELn/original.jpg"
    
    try:
        print(f"📥 Downloading test image from: {image_url}")
        response = requests.get(image_url, timeout=30)
        
        if response.status_code == 200:
            with open("aerial-view-of-corn-fields-photo.jpg", "wb") as f:
                f.write(response.content)
            print("✅ Downloaded aerial-view-of-corn-fields-photo.jpg")
            return "aerial-view-of-corn-fields-photo.jpg"
        else:
            print(f"❌ Failed to download: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Download error: {str(e)}")
        return None

def test_roboflow_api_methods():
    """Test multiple API call methods to find what works"""
    
    # Download the test image
    image_path = download_test_image()
    if not image_path or not os.path.exists(image_path):
        print("❌ No test image available!")
        return False
    
    # API configuration - exact from user's specification
    api_key = "RlnFmttALS6BQzCy3M6d"
    model_id = "agridroneinsightdetection-zcptl/1"
    base_url = "https://detect.roboflow.com"  # Try different endpoint
    
    print(f"🧪 Testing Roboflow API with image: {image_path}")
    print(f"📏 Image size: {os.path.getsize(image_path)} bytes")
    
    # Method 1: Using detect.roboflow.com endpoint (standard)
    print("\n🔬 METHOD 1: detect.roboflow.com endpoint")
    try:
        api_endpoint = f"{base_url}/{model_id}"
        print(f"🎯 Endpoint: {api_endpoint}")
        
        with open(image_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            params = {'api_key': api_key}
            
            response = requests.post(
                api_endpoint,
                files=files,
                params=params,
                timeout=60
            )
            
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ METHOD 1 SUCCESS!")
            print(f"📈 Predictions: {len(result.get('predictions', []))}")
            
            if result.get('predictions'):
                for i, pred in enumerate(result['predictions']):
                    print(f"   {i+1}. {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.3f}")
                    if 'points' in pred:
                        print(f"      Polygon points: {len(pred['points'])}")
                
                print(f"\n📋 Full result structure: {list(result.keys())}")
                return result
        else:
            print(f"❌ METHOD 1 FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ METHOD 1 ERROR: {str(e)}")
    
    # Method 2: Using inference.roboflow.com endpoint  
    print("\n🔬 METHOD 2: inference.roboflow.com endpoint")
    try:
        base_url2 = "https://inference.roboflow.com"
        api_endpoint = f"{base_url2}/{model_id}"
        print(f"🎯 Endpoint: {api_endpoint}")
        
        with open(image_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            params = {'api_key': api_key}
            
            response = requests.post(
                api_endpoint,
                files=files,
                params=params,
                timeout=60
            )
            
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ METHOD 2 SUCCESS!")
            print(f"📈 Predictions: {len(result.get('predictions', []))}")
            
            if result.get('predictions'):
                for i, pred in enumerate(result['predictions']):
                    print(f"   {i+1}. {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.3f}")
                    if 'points' in pred:
                        print(f"      Polygon points: {len(pred['points'])}")
                
                return result
        else:
            print(f"❌ METHOD 2 FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ METHOD 2 ERROR: {str(e)}")
    
    # Method 3: Different parameter format
    print("\n🔬 METHOD 3: Query parameter format")
    try:
        api_endpoint = f"https://detect.roboflow.com/{model_id}?api_key={api_key}"
        print(f"🎯 Endpoint: {api_endpoint}")
        
        with open(image_path, 'rb') as image_file:
            files = {'file': ('image.jpg', image_file, 'image/jpeg')}
            
            response = requests.post(
                api_endpoint,
                files=files,
                timeout=60
            )
            
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ METHOD 3 SUCCESS!")
            print(f"📈 Predictions: {len(result.get('predictions', []))}")
            
            if result.get('predictions'):
                for i, pred in enumerate(result['predictions']):
                    print(f"   {i+1}. {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.3f}")
                    if 'points' in pred:
                        print(f"      Polygon points: {len(pred['points'])}")
                
                return result
        else:
            print(f"❌ METHOD 3 FAILED: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ METHOD 3 ERROR: {str(e)}")
    
    return False

if __name__ == "__main__":
    print("🌾 ROBOFLOW API EXACT TEST - FIND THE RIGHT METHOD 🌾")
    print("=" * 70)
    
    result = test_roboflow_api_methods()
    
    if result:
        print("\n🎉 SUCCESS! Found working API method!")
        print("🔧 This should be implemented in the main app!")
        
        # Save the working result for reference
        with open("working_api_result.json", "w") as f:
            json.dump(result, f, indent=2)
        print("📄 Saved result to working_api_result.json")
        
    else:
        print("\n❌ All methods failed!")
        print("🔍 Need to investigate API requirements more")
    
    print("\n" + "=" * 70)
    print("🏁 API TEST COMPLETE")
