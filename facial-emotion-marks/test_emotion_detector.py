"""
Test Emotion Detection Model on Videos
"""

import cv2
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import json
import numpy as np
import sys


def load_model(model_path, num_classes, device='cpu'):
    if 'resnet34' in model_path.lower():
        model = models.resnet34(weights=None)
    elif 'resnet18' in model_path.lower():
        model = models.resnet18(weights=None)
    else:
        model = models.resnet50(weights=None)
    
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_ftrs, num_classes)
    )
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    return model


def test_on_video(model_path='./models/emotion_resnet50.pth',
                  labels_path='./models/emotion_labels.json',
                  video_path='./videos/interview_video4.mp4'):
    
    device = 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"🖥️  Device: {device}\n")
    
    # Load labels
    with open(labels_path, 'r') as f:
        labels = json.load(f)
    
    num_classes = len(labels)
    print(f"📋 Classes: {list(labels.values())}")
    
    # Load model
    print(f"📦 Loading: {model_path}")
    model = load_model(model_path, num_classes, device)
    print("✅ Model loaded\n")
    
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
    
    # Tracking
    emotion_counts = {emotion: 0 for emotion in labels.values()}
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
        
        # Largest face
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
            emotion = labels[str(pred_class)]
        
        emotion_counts[emotion] += 1
        confidences.append(confidence)
        
        if frame_count % 100 == 0:
            print(f"📊 Processed {frame_count} frames...")
    
    cap.release()
    
    # Results
    print("\n" + "="*70)
    print("📊 EMOTION DETECTION RESULTS")
    print("="*70)
    print(f"Total Frames: {frame_count}")
    print(f"Faces Detected: {face_count} ({face_count/frame_count*100:.1f}%)\n")
    
    if face_count > 0:
        print("😊 Emotion Distribution:")
        sorted_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)
        
        for emotion, count in sorted_emotions:
            pct = count / face_count * 100
            bar = "█" * int(pct / 3)
            
            # Markers
            if emotion in ['happy', 'neutral']:
                marker = "✅"
            elif emotion in ['fear', 'anger', 'sad', 'disgust', 'contempt']:
                marker = "⚠️ "
            else:
                marker = "➖"
            
            print(f"  {marker} {emotion:12s}: {bar:25s} {pct:5.1f}% ({count})")
        
        avg_conf = np.mean(confidences) * 100
        print(f"\n🎯 Average Confidence: {avg_conf:.1f}%")
        
        # Analysis
        positive_count = emotion_counts.get('happy', 0) + emotion_counts.get('neutral', 0)
        negative_count = sum([emotion_counts.get(e, 0) for e in ['fear', 'anger', 'sad', 'disgust', 'contempt']])
        
        positive_pct = positive_count / face_count * 100
        negative_pct = negative_count / face_count * 100
        
        print(f"\n💡 Analysis:")
        print(f"  Positive emotions: {positive_pct:.1f}%")
        print(f"  Negative emotions: {negative_pct:.1f}%")
        
        if positive_pct > 60:
            print(f"  ✅ Strong positive emotional state")
        elif positive_pct < 40:
            print(f"  ⚠️  Low positive emotions")
        
        if negative_pct > 40:
            print(f"  ⚠️  High stress/negative emotions")
        elif negative_pct < 20:
            print(f"  ✅ Low stress indicators")
    
    print("="*70 + "\n")
    
    return emotion_counts, confidences


if __name__ == "__main__":
    model_path = './models/emotion_resnet34.pth'
    labels_path = './models/emotion_labels.json'
    video_path = './videos/interview_video.mp4'
    
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
    if len(sys.argv) > 2:
        labels_path = sys.argv[2]
    if len(sys.argv) > 3:
        video_path = sys.argv[3]
    
    print("="*70)
    print("🧪 EMOTION DETECTOR TEST")
    print("="*70)
    print(f"Model: {model_path}")
    print(f"Video: {video_path}")
    print("="*70 + "\n")
    
    test_on_video(model_path, labels_path, video_path)

