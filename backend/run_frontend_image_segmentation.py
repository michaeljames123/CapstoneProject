#!/usr/bin/env python3

import os
import json
from dotenv import load_dotenv
import app


def main():
    # Ensure we load the .env that lives in the backend folder
    backend_dir = os.path.dirname(__file__)
    load_dotenv(dotenv_path=os.path.join(backend_dir, ".env"))

    # After loading env, make sure the imported app module sees the values
    app.ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY") or "RlnFmttALS6BQzCy3M6d"
    model_id = os.getenv("ROBOFLOW_MODEL_ID") or "agridroneinsightdetection-zcptl/4"

    # Absolute path provided by you (fallback to relative if needed)
    abs_image_path = r"c:\\Users\\ADMIN\\Desktop\\bb project\\Capstoneproject\\frontend\\aerial-view-of-corn-fields-photo.jpg"
    rel_image_path = os.path.abspath(os.path.join(backend_dir, "..", "frontend", "aerial-view-of-corn-fields-photo.jpg"))

    image_path = abs_image_path if os.path.exists(abs_image_path) else rel_image_path
    if not os.path.exists(image_path):
        print("❌ Image not found at expected paths:")
        print(f"   - {abs_image_path}")
        print(f"   - {rel_image_path}")
        return

    print("🚀 Using Roboflow Detect API (serverless)")
    print(f"   - Model ID: {model_id}")
    print(f"   - Image: {image_path}")

    # Prepare image with the same size as the UI uses, then infer with explicit params
    prepared_path = app.resize_image_for_api(image_path, max_size=app.ROBOFLOW_IMAGE_SIZE)
    result = app.call_roboflow_inference(
        prepared_path,
        model_id,
        confidence=app.ROBOFLOW_CONFIDENCE,
        overlap=app.ROBOFLOW_OVERLAP,
        image_size=app.ROBOFLOW_IMAGE_SIZE,
    )

    # Persist raw result for inspection
    out_json = os.path.join(backend_dir, "frontend_image_result.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(f"📄 Saved API result to {out_json}")

    # Prepare annotated output path
    uploads_dir = os.path.join(backend_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    annotated_path = os.path.join(uploads_dir, "frontend_image_annotated.jpg")

    # Draw polygons exactly like Roboflow UI
    predictions = result.get("predictions", []) if isinstance(result, dict) else []
    print(f"🎯 Predictions found: {len(predictions)}")

    if predictions:
        ok = app.draw_predictions_on_image(prepared_path, predictions, annotated_path)
        if ok and os.path.exists(annotated_path):
            print("✅ Annotated image created")
            print(f"   - {annotated_path}")
        else:
            print("❌ Failed to create annotated image")
    else:
        print("⚠️ No predictions returned by the model.")


if __name__ == "__main__":
    main()
