import cv2
from torchvision import datasets, transforms
import torch
import torch.nn as nn
import torchvision.models as models
from PIL import Image
import json

video_path = "./interview_video3.mp4"
cap = cv2.VideoCapture(video_path)

device = 'mps' if torch.backends.mps.is_available() else "cuda" if torch.backends.cuda.is_available() else 'cpu'

model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
num_ftrs = model.fc.in_features

with open('facial_labels.json', "r") as f:
    idx_to_class = json.load(f)

num_classes = len(idx_to_class)

model.fc = nn.Sequential(
    nn.Dropout(0.2),
    nn.Linear(num_ftrs, num_classes)
)

model.load_state_dict(torch.load("facial_resnet50_3.pth", map_location=device))
model = model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3), 
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    for (x, y, w, h) in faces:
            # Crop face ROI
            face_roi = frame[y:y+h, x:x+w]
            pil_img = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
            img_tensor = transform(pil_img).unsqueeze(0).to(device)

            with torch.no_grad():
                outputs = model(img_tensor)
                probs = torch.softmax(outputs, dim=1)
                print(probs)
                
                predicted_class = torch.argmax(probs, dim=1).item()
                confidence = probs[0][predicted_class].item()
                
                pred_label = idx_to_class[str(predicted_class)]

            # Draw rectangle & label on the frame
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            text = f"{pred_label} ({confidence*100:.1f}%)"
            cv2.putText(frame, text, (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    cv2.imshow("Facial Emotion Recog", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
