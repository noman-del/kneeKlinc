from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import uvicorn

app = FastAPI(title="Knee Arthritis Prediction API")

# --- CORS (Crucial for Mobile/Web Apps) ---
# This allows your group member's app to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all apps to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
CLASS_NAMES = ['0_Healthy', '1_Doubtful', '2_Minimal', '3_Moderate', '4_Severe']
device = torch.device("cpu") # Use CPU for free cloud servers

# --- LOAD MODEL ---
def load_model():
    print("Loading Model...")
    model = models.resnet34(pretrained=False)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, len(CLASS_NAMES))
    
    # Load weights (ensure the file name matches exactly)
    try:
        model.load_state_dict(torch.load("resnet34_knee_final.pth", map_location=device))
    except FileNotFoundError:
        print("Error: Model file not found. Make sure 'resnet34_knee_final.pth' is in the root folder.")
        return None
        
    model.eval()
    return model

model = load_model()

# --- PREPROCESSING ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# --- API ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "Knee Arthritis AI API is Running. Use /predict to analyze images."}

@app.post("/predict")
async def predict_knee(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded properly."}
    
    try:
        # 1. Read Image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # 2. Transform
        tensor = transform(image).unsqueeze(0)
        
        # 3. Predict
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)
            
        grade_index = int(predicted.item())
        
        return {
            "success": True,
            "prediction": {
                "grade_index": grade_index,
                "label": CLASS_NAMES[grade_index],
                "confidence_score": float(confidence.item())
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)