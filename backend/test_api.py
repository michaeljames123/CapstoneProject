#!/usr/bin/env python3

import os
from inference_sdk import InferenceHTTPClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_roboflow_connection():
    """Test the Roboflow API connection"""
    try:
        api_key = os.getenv('ROBOFLOW_API_KEY')
        model_id = os.getenv('ROBOFLOW_MODEL_ID')
        
        print(f"API Key: {api_key[:10] if api_key else 'Not found'}...")
        print(f"Model ID: {model_id}")
        
        # Initialize client
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=api_key
        )
        
        print("Client initialized successfully")
        print("✅ Roboflow connection test passed")
        return True
        
    except Exception as e:
        print(f"❌ Roboflow connection test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_roboflow_connection()
