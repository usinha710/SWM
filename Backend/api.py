from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import numpy as np
import cv2
import httpx
import os
import base64

from model import WasteClassifier


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "waste_model.h5")

classifier = WasteClassifier() # universal

imgbb_api_key = os.environ.get("IMGBB_API_KEY", "83d5c146035083af65fe9a0530b1f49b")

async def upload_image_to_imgbb(image_bytes: bytes) -> str:
    try:
        image_base64 = base64.b64encode(image_bytes).decode()

        async with httpx.AsyncClient(timeout=30.0) as client: 
            response = await client.post(
                "https://api.imgbb.com/1/upload",
                data={
                    "key": imgbb_api_key,
                    "image": image_base64
                }
            )

            if response.status_code == 200:
                response_json = response.json()
                return response_json["data"]["url"]
            else:
                print(f"imgbb upload failed: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"Error uploading image to imgbb: {e}")
        return None 

@app.get("/", response_class=HTMLResponse)
async def root():
    return "<h5>SWM is running</h5>"

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        image_url = await upload_image_to_imgbb(contents)  

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"success": False, "error": "Could not decode image."}

        result_data = classifier.predict(img)
        category_name = result_data.get("category", "Unknown")

        return {
            "success": True,
            "category": category_name,
            "confidence": float(result_data["confidence"]),
            "probabilities": result_data.get("probabilities", {}),
            "image_url": image_url 
        }

    except Exception as e:
        return {"success": False, "error": str(e)}