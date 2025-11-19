"""
Test the trained stress detection model on interview videos
"""

import cv2
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import json
import numpy as np


def load_model(model_path, device='cpu'):
    """Load trained stress detection model"""
    # Auto-detect architecture from filename
    if 'resnet34' in model_path.lower():
        model = models.resnet34(weights=None)
    elif 'resnet18' in model_path.lower():
        model = models.resnet18(weights=None)
    else:
        model = models.resnet50(weights=None)
    
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_ftrs, 2)  # Binary: stress/nostress
    )
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    
    return model


def test_on_video(model_path='stress_detector_resnet50.pth', 
                  video_path='./interview_video3.mp4'):
    """Test stress detector on video"""
    
    device = 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"🖥️  Device: {device}\n")
    
    # Load model and labels
    print(f"📦 Loading model: {model_path}")
    model = load_model(model_path, device)
    
    with open('stress_labels.json', 'r') as f:
        labels = json.load(f)
    print(f"📋 Classes: {list(labels.values())}\n")
    
    # Transform
    transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Face detector
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Could not open {video_path}")
        return
    
    print(f"🎥 Analyzing: {video_path}\n")
    
    # Stats
    predictions = {'stress': 0, 'nostress': 0}
    confidences = []
    frame_count = 0
    face_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Detect face
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        
        if len(faces) == 0:
            continue
        
        face_count += 1
        
        # Get largest face
        (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
        face_roi = frame[y:y+h, x:x+w]
        
        # Predict
        pil_img = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
        img_tensor = transform(pil_img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_class].item()
            prediction = labels[str(pred_class)]
        
        predictions[prediction] += 1
        confidences.append(confidence)
        
        # Progress
        if frame_count % 100 == 0:
            print(f"📊 Processed {frame_count} frames...")
    
    cap.release()
    
    # Results
    print("\n" + "="*70)
    print("📊 STRESS DETECTION RESULTS")
    print("="*70)
    print(f"Total Frames: {frame_count}")
    print(f"Faces Detected: {face_count}")
    
    if face_count > 0:
        stress_pct = predictions['stress'] / face_count * 100
        nostress_pct = predictions['nostress'] / face_count * 100
        avg_conf = np.mean(confidences) * 100
        
        print(f"\n📈 Predictions:")
        print(f"   Stress:    {predictions['stress']:5d} frames ({stress_pct:5.1f}%)")
        print(f"   No Stress: {predictions['nostress']:5d} frames ({nostress_pct:5.1f}%)")
        print(f"\n🎯 Average Confidence: {avg_conf:.1f}%")
        
        # Overall assessment
        print(f"\n💡 Overall Assessment:")
        if stress_pct > 60:
            print(f"   ⚠️  HIGH STRESS DETECTED ({stress_pct:.1f}%)")
            print(f"   Candidate shows significant stress/anxiety")
        elif stress_pct > 40:
            print(f"   ⚠️  MODERATE STRESS ({stress_pct:.1f}%)")
            print(f"   Some stress indicators present")
        elif stress_pct > 20:
            print(f"   ✅ MILD STRESS ({stress_pct:.1f}%)")
            print(f"   Normal stress levels for interview")
        else:
            print(f"   ✅ LOW STRESS ({stress_pct:.1f}%)")
            print(f"   Candidate appears calm and composed")
    
    print("="*70 + "\n")
    
    return predictions, confidences


if __name__ == "__main__":
    import sys
    
    # Default values
    model_path = './models/stress_detector_resnet50.pth'
    video_path = './videos/interview_video4.mp4'
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
    if len(sys.argv) > 2:
        video_path = sys.argv[2]
    
    print("="*70)
    print("🧪 STRESS DETECTOR TEST")
    print("="*70)
    print(f"Model: {model_path}")
    print(f"Video: {video_path}")
    print("="*70 + "\n")
    
    test_on_video(model_path, video_path)

