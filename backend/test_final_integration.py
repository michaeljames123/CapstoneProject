#!/usr/bin/env python3
"""
Final integration test - simulate exact frontend request
"""

import requests
import os
from PIL import Image, ImageDraw

def create_crop_image():
    """Create a realistic crop field image"""
    image = Image.new('RGB', (640, 640), (34, 139, 34))
    draw = ImageDraw.Draw(image)
    
    # Create crop field patterns - more realistic
    for i in range(0, 640, 80):
        for j in range(0, 640, 80):
            # Vary the green tones
            green_val = 100 + ((i + j) % 80)
            color = (0, green_val, 20)
            draw.rectangle([i, j, i+70, j+70], fill=color)
    
    # Add some crop issues (lighter/darker areas)
    for x in range(150, 500, 200):
        for y in range(150, 500, 200):
            # Pest damage areas (more yellow/brown)
            draw.ellipse([x-40, y-40, x+40, y+40], fill=(180, 150, 50))
    
    # Add healthy dense crop areas
    for x in range(300, 400, 50):
        for y in range(300, 400, 50):
            draw.rectangle([x-15, y-15, x+15, y+15], fill=(0, 120, 10))
    
    test_image = 'final_test_image.jpg'
    image.save(test_image, 'JPEG')
    print(f"✅ Created test crop image: {test_image}")
    return test_image

def test_backend_analyze_endpoint():
    """Test the /api/analyze endpoint exactly like frontend"""
    try:
        print("🚀 Testing Backend Analyze Endpoint...")
        
        # Create test image
        image_path = create_crop_image()
        
        # Login first to get token
        login_data = {
            'username': 'testuser',
            'password': 'testpass'
        }
        
        print("🔐 Logging in...")
        login_response = requests.post('http://localhost:5000/api/login', json=login_data)
        
        if login_response.status_code != 200:
            # Try to register first
            print("📝 Registering new user...")
            register_data = {
                'username': 'testuser',
                'email': 'test@test.com',
                'password': 'testpass'
            }
            register_response = requests.post('http://localhost:5000/api/register', json=register_data)
            
            if register_response.status_code == 201:
                print("✅ Registration successful!")
                token = register_response.json()['access_token']
            else:
                print(f"❌ Registration failed: {register_response.status_code}")
                return False
        else:
            print("✅ Login successful!")
            token = login_response.json()['access_token']
        
        # Prepare analyze request exactly like frontend
        print("📤 Making analyze request...")
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        # Multipart form data like frontend sends
        with open(image_path, 'rb') as f:
            files = {'image': ('test_image.jpg', f, 'image/jpeg')}
            
            form_data = {
                'drone_name': 'Test Drone DJI',
                'date_time': '2025-11-14T02:50:00',
                'location': 'Test Farm Location',
                'field_size': '5.5',
                'flight_time': '15.2'
            }
            
            print("⏰ Starting analysis (this may take 30-60 seconds)...")
            
            analyze_response = requests.post(
                'http://localhost:5000/api/analyze',
                files=files,
                data=form_data,
                headers=headers,
                timeout=180  # 3 minutes like frontend
            )
        
        print(f"📊 Response Status: {analyze_response.status_code}")
        
        if analyze_response.status_code == 200:
            result = analyze_response.json()
            print("✅ ANALYSIS SUCCESS!")
            print(f"📈 Result keys: {list(result.keys())}")
            
            if 'analysis_result' in result:
                analysis = result['analysis_result']
                if 'predictions' in analysis:
                    predictions = analysis['predictions']
                    print(f"🎯 Found {len(predictions)} predictions:")
                    for i, pred in enumerate(predictions):
                        print(f"   {i+1}. {pred.get('class', 'Unknown')} - {pred.get('confidence', 0):.2f}")
            
            if 'annotated_image_url' in result:
                print(f"🖼️ Annotated image: {result['annotated_image_url']}")
            
            # Clean up
            if os.path.exists(image_path):
                os.remove(image_path)
            
            return True
            
        else:
            print(f"❌ Analysis failed: {analyze_response.status_code}")
            print(f"Response: {analyze_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🌾 FINAL INTEGRATION TEST - GOD TIER LEVEL 🌾")
    print("=" * 60)
    
    success = test_backend_analyze_endpoint()
    
    if success:
        print("\n🎉 COMPLETE SUCCESS!")
        print("✅ Backend works perfectly!")
        print("✅ 422 errors should be fixed!")
        print("✅ Ready for live web testing!")
    else:
        print("\n❌ Still has issues!")
        print("🔧 Check server logs for details")
    
    print("\n" + "=" * 60)
    print("🏁 FINAL TEST COMPLETE")
