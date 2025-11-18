#!/usr/bin/env python3
"""
Comprehensive test for Roboflow API integration
Tests the exact model and credentials provided by the user
"""

import os
import sys
from PIL import Image, ImageDraw
from inference_sdk import InferenceHTTPClient
import json

# Set environment variables
os.environ['ROBOFLOW_API_KEY'] = 'RlnFmttALS6BQzCy3M6d'
os.environ['ROBOFLOW_MODEL_ID'] = 'agridroneinsightdetection-zcptl/1'

def create_test_image():
    """Create a test crop field image for testing"""
    # Create a simple test image representing a crop field
    image = Image.new('RGB', (640, 640), (34, 139, 34))  # Forest green background
    draw = ImageDraw.Draw(image)
    
    # Draw some crop rows and patterns
    for i in range(0, 640, 60):
        draw.line([(i, 0), (i, 640)], fill=(0, 100, 0), width=3)
        
    for j in range(0, 640, 80):
        draw.line([(0, j), (640, j)], fill=(0, 100, 0), width=2)
    
    # Add some variation to simulate crop field patterns
    for x in range(50, 600, 100):
        for y in range(50, 600, 100):
            draw.ellipse([x-20, y-20, x+20, y+20], fill=(255, 255, 0))
    
    test_image_path = 'test_crop_field.jpg'
    image.save(test_image_path, 'JPEG')
    print(f"✅ Created test image: {test_image_path}")
    return test_image_path

def test_roboflow_client():
    """Test the Roboflow client with exact credentials"""
    try:
        print("🚀 Testing Roboflow Client Integration...")
        
        # Initialize client exactly as specified by user
        CLIENT = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key="RlnFmttALS6BQzCy3M6d"
        )
        
        print("✅ Client initialized successfully")
        
        # Create test image
        test_image_path = create_test_image()
        
        # Test inference with exact model ID
        model_id = "agridroneinsightdetection-zcptl/1"
        print(f"🔍 Running inference with model: {model_id}")
        
        result = CLIENT.infer(test_image_path, model_id=model_id)
        
        print("✅ Inference successful!")
        print(f"📊 Result type: {type(result)}")
        print(f"📋 Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        # Print detailed result analysis
        if isinstance(result, dict):
            print("\n📈 DETAILED RESULT ANALYSIS:")
            for key, value in result.items():
                print(f"  {key}: {type(value)} = {value if key != 'predictions' else f'[{len(value)} items]'}")
            
            if 'predictions' in result:
                print(f"\n🎯 PREDICTIONS ANALYSIS:")
                predictions = result['predictions']
                print(f"  Total predictions: {len(predictions)}")
                
                for i, pred in enumerate(predictions[:3]):  # Show first 3 predictions
                    print(f"\n  Prediction {i+1}:")
                    for k, v in pred.items():
                        if k == 'points':
                            print(f"    {k}: {len(v)} points")
                        else:
                            print(f"    {k}: {v}")
        
        # Save result for reference
        with open('roboflow_test_result.json', 'w') as f:
            json.dump(result, f, indent=2, default=str)
        print("✅ Result saved to roboflow_test_result.json")
        
        # Clean up test image
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
        
        return result
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_drawing_function(result):
    """Test the drawing function with the actual API result"""
    if not result or 'predictions' not in result:
        print("❌ No predictions to test drawing function")
        return
    
    try:
        print("\n🎨 Testing drawing function...")
        
        # Create test image for drawing
        test_image_path = create_test_image()
        output_path = 'test_annotated_output.jpg'
        
        # Import the drawing function from app.py
        sys.path.append('.')
        from app import draw_predictions_on_image
        
        # Test drawing
        success = draw_predictions_on_image(test_image_path, result['predictions'], output_path)
        
        if success and os.path.exists(output_path):
            print("✅ Drawing function successful!")
            print(f"📸 Annotated image saved: {output_path}")
        else:
            print("❌ Drawing function failed")
        
        # Clean up
        for path in [test_image_path, output_path]:
            if os.path.exists(path):
                os.remove(path)
                
    except Exception as e:
        print(f"❌ Drawing test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🌾 ROBOFLOW INTEGRATION TEST - GOD TIER LEVEL 🌾")
    print("=" * 60)
    
    # Test API connection and inference
    result = test_roboflow_client()
    
    if result:
        print("\n✅ API TEST PASSED!")
        # Test drawing function
        test_drawing_function(result)
    else:
        print("\n❌ API TEST FAILED!")
    
    print("\n" + "=" * 60)
    print("🏁 TEST COMPLETE")
