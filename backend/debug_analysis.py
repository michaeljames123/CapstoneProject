#!/usr/bin/env python3

import os
import json
from inference_sdk import InferenceHTTPClient
from dotenv import load_dotenv
from PIL import Image, ImageDraw

# Load environment variables
load_dotenv()

def debug_roboflow_api():
    """Debug the Roboflow API call with sample data"""
    try:
        api_key = os.getenv('ROBOFLOW_API_KEY')
        model_id = os.getenv('ROBOFLOW_MODEL_ID')
        
        print(f"🔧 API Key: {api_key[:15]}..." if api_key else "❌ No API Key")
        print(f"🔧 Model ID: {model_id}")
        
        # Initialize client
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key
        )
        
        # Check for test images in uploads folder
        uploads_dir = "uploads"
        if not os.path.exists(uploads_dir):
            os.makedirs(uploads_dir)
            print(f"📁 Created uploads directory: {uploads_dir}")
        
        # Look for any existing images
        image_files = [f for f in os.listdir(uploads_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
        
        if image_files:
            test_image = os.path.join(uploads_dir, image_files[0])
            print(f"🖼️  Testing with image: {test_image}")
            
            # Make API call
            print("📡 Making API call...")
            result = client.infer(test_image, model_id=model_id)
            
            print(f"📊 API Response Structure:")
            print(f"  - Type: {type(result)}")
            print(f"  - Keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            
            if 'predictions' in result:
                predictions = result['predictions']
                print(f"🎯 Found {len(predictions)} predictions:")
                
                for i, pred in enumerate(predictions):
                    print(f"  Prediction {i+1}:")
                    print(f"    - Class: {pred.get('class', 'Unknown')}")
                    print(f"    - Confidence: {pred.get('confidence', 0):.3f}")
                    print(f"    - Has points: {'points' in pred}")
                    if 'points' in pred:
                        print(f"    - Points count: {len(pred['points'])}")
                        print(f"    - First few points: {pred['points'][:3]}")
                    
                    print(f"    - Bounding box: x={pred.get('x', 0)}, y={pred.get('y', 0)}, w={pred.get('width', 0)}, h={pred.get('height', 0)}")
                
                # Test drawing function
                print("🎨 Testing segmentation drawing...")
                from app import draw_predictions_on_image
                
                output_path = os.path.join(uploads_dir, f"debug_annotated_{image_files[0]}")
                success = draw_predictions_on_image(test_image, predictions, output_path)
                
                if success:
                    print(f"✅ Segmentation image created: {output_path}")
                    
                    # Check if file was actually created
                    if os.path.exists(output_path):
                        file_size = os.path.getsize(output_path)
                        print(f"📏 Output file size: {file_size} bytes")
                    else:
                        print("❌ Output file was not created")
                else:
                    print("❌ Failed to create segmentation image")
            
            else:
                print("❌ No predictions in API response")
                print(f"📄 Full response: {json.dumps(result, indent=2)}")
        
        else:
            print("❌ No test images found in uploads directory")
            print("   Upload an image through the web interface first")
        
        return True
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    debug_roboflow_api()
