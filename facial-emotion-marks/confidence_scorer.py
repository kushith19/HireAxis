"""
Simple Confidence Score Calculator
Analyzes interview videos using trained emotion and stress models
"""

import cv2
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import json
import numpy as np


class ConfidenceScorer:
    def __init__(self):
        self.device = 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"🖥️  Using device: {self.device}")
        
        # Load emotion model
        print("📦 Loading emotion model...")
        self.emotion_model = self._load_model("facial_resnet34_2.pth", num_classes=8)
        with open('facial_labels.json', 'r') as f:
            self.emotion_labels = json.load(f)
        
        # Load stress model
        print("📦 Loading stress model...")
        self.stress_model = self._load_model("facial_stress_resnet50.pth", num_classes=2)
        with open('facial_labels_stress.json', 'r') as f:
            self.stress_labels = json.load(f)
        
        print("✅ Models loaded successfully!\n")
        
        # Face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Emotion scoring weights
        self.emotion_weights = {
            'happy': 1.0,       # Very positive
            'neutral': 0.7,     # Calm/professional
            'surprise': 0.3,    # Can be positive or negative
            'sad': -0.5,        # Negative
            'fear': -0.7,       # Very negative
            'anger': -0.9,      # Very negative
            'disgust': -0.8,    # Very negative
            'contempt': -0.6    # Negative
        }
    
    def _load_model(self, path, num_classes):
        """Load ResNet50 model"""
        model = models.resnet50(weights=None)
        num_ftrs = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_ftrs, num_classes)
        )
        model.load_state_dict(torch.load(path, map_location=self.device))
        model = model.to(self.device)
        model.eval()
        return model
    
    def analyze_video(self, video_path):
        """Main function to analyze video and calculate confidence score"""
        print(f"🎥 Analyzing: {video_path}\n")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("❌ Error: Could not open video")
            return None
        
        # Tracking variables
        emotion_history = []
        stress_history = []
        frame_scores = []
        total_frames = 0
        face_detected_frames = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            total_frames += 1
            
            # Detect face
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
            )
            
            if len(faces) == 0:
                continue
            
            face_detected_frames += 1
            
            # Get largest face
            (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
            face_roi = frame[y:y+h, x:x+w]
            
            # Predict emotion and stress
            emotion, emotion_conf = self._predict_emotion(face_roi)
            stress, stress_conf = self._predict_stress(face_roi)
            
            # Calculate frame score
            frame_score = self._calculate_frame_score(emotion, emotion_conf, stress, stress_conf)
            
            # Store data
            emotion_history.append(emotion)
            stress_history.append(stress)
            frame_scores.append(frame_score)
            
            # Progress
            if total_frames % 50 == 0:
                print(f"📊 Processed {total_frames} frames... (Score so far: {np.mean(frame_scores):.1f})")
        
        cap.release()
        
        print(f"\n✅ Processing complete!")
        print(f"   Total frames: {total_frames}")
        print(f"   Faces detected: {face_detected_frames}\n")
        
        # Calculate final results
        return self._calculate_final_score(
            emotion_history, 
            stress_history, 
            frame_scores,
            total_frames,
            face_detected_frames
        )
    
    def _predict_emotion(self, face_roi):
        """Predict emotion from face"""
        pil_img = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
        img_tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.emotion_model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_class].item()
            emotion = self.emotion_labels[str(pred_class)]
        
        return emotion, confidence
    
    def _predict_stress(self, face_roi):
        """Predict stress level"""
        pil_img = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
        img_tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.stress_model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][pred_class].item()
            stress = self.stress_labels[str(pred_class)]
        
        return stress, confidence
    
    def _calculate_frame_score(self, emotion, emotion_conf, stress, stress_conf):
        """
        Calculate confidence score for single frame (0-100)
        
        Components:
        1. Emotion Score (60% weight) - positive emotions = higher score
        2. Stress Score (40% weight) - no stress = higher score
        """
        # Emotion contribution
        emotion_weight = self.emotion_weights.get(emotion, 0)
        # Convert from [-1, 1] to [0, 100]
        emotion_score = ((emotion_weight + 1) / 2) * emotion_conf * 60
        
        # Stress contribution
        if stress == 'nostress':
            stress_score = stress_conf * 40
        else:
            stress_score = (1 - stress_conf) * 40
        
        total = emotion_score + stress_score
        return max(0, min(100, total))
    
    def _calculate_final_score(self, emotion_history, stress_history, frame_scores, total_frames, face_frames):
        """Calculate final comprehensive confidence score"""
        
        if not frame_scores:
            return {
                'error': 'No faces detected in video',
                'confidence_score': 0
            }
        
        # 1. Base Confidence (average of all frames)
        avg_confidence = np.mean(frame_scores)
        
        # 2. Engagement (face visibility)
        engagement_ratio = (face_frames / total_frames) * 100
        
        # 3. Emotion Distribution
        emotion_counts = {}
        for emotion in emotion_history:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        emotion_percentages = {
            emotion: (count / len(emotion_history) * 100)
            for emotion, count in emotion_counts.items()
        }
        
        # 4. Positive Emotion Ratio
        positive_emotions = ['happy', 'neutral']
        positive_count = sum(1 for e in emotion_history if e in positive_emotions)
        positive_ratio = (positive_count / len(emotion_history)) * 100
        
        # 5. Stress Analysis
        stress_count = sum(1 for s in stress_history if s == 'stress')
        stress_percentage = (stress_count / len(stress_history)) * 100
        
        # 6. Emotional Stability (less variation = better)
        emotion_changes = sum(
            1 for i in range(1, len(emotion_history)) 
            if emotion_history[i] != emotion_history[i-1]
        )
        stability = max(0, 100 - (emotion_changes / len(emotion_history) * 100))
        
        # FINAL CONFIDENCE SCORE (weighted average)
        confidence_score = (
            avg_confidence * 0.40 +        # 40% - Frame-by-frame confidence
            engagement_ratio * 0.20 +      # 20% - Face visibility
            positive_ratio * 0.20 +        # 20% - Positive emotions
            stability * 0.10 +             # 10% - Emotional consistency
            (100 - stress_percentage) * 0.10  # 10% - Low stress
        )
        
        # Determine confidence level
        if confidence_score >= 75:
            level = "Very High"
            grade = "A"
            recommendation = "✅ Excellent candidate - Strong confidence and composure"
        elif confidence_score >= 60:
            level = "High"
            grade = "B"
            recommendation = "👍 Good candidate - Solid confidence levels"
        elif confidence_score >= 45:
            level = "Moderate"
            grade = "C"
            recommendation = "⚠️  Average - May need additional evaluation"
        elif confidence_score >= 30:
            level = "Low"
            grade = "D"
            recommendation = "⚠️  Below average - Shows nervousness"
        else:
            level = "Very Low"
            grade = "F"
            recommendation = "❌ Poor performance - Significant confidence issues"
        
        return {
            'confidence_score': round(confidence_score, 2),
            'confidence_level': level,
            'grade': grade,
            'recommendation': recommendation,
            
            'metrics': {
                'average_frame_confidence': round(avg_confidence, 2),
                'engagement_ratio': round(engagement_ratio, 2),
                'positive_emotion_ratio': round(positive_ratio, 2),
                'emotional_stability': round(stability, 2),
                'stress_percentage': round(stress_percentage, 2)
            },
            
            'emotion_distribution': {
                k: round(v, 2) for k, v in emotion_percentages.items()
            },
            
            'stats': {
                'total_frames': total_frames,
                'frames_with_face': face_frames,
                'frames_analyzed': len(frame_scores),
                'peak_confidence': round(max(frame_scores), 2),
                'lowest_confidence': round(min(frame_scores), 2)
            }
        }
    
    def print_report(self, results):
        """Print formatted report"""
        if 'error' in results:
            print(f"❌ {results['error']}")
            return
        
        print("\n" + "="*70)
        print("📊 INTERVIEW CONFIDENCE ANALYSIS REPORT")
        print("="*70)
        
        print(f"\n🎯 FINAL CONFIDENCE SCORE: {results['confidence_score']}/100 (Grade: {results['grade']})")
        print(f"📈 Confidence Level: {results['confidence_level']}")
        print(f"💡 {results['recommendation']}")
        
        print("\n📉 KEY METRICS:")
        for key, value in results['metrics'].items():
            print(f"   • {key.replace('_', ' ').title():30s}: {value:6.2f}%")
        
        print("\n😊 EMOTION BREAKDOWN:")
        sorted_emotions = sorted(
            results['emotion_distribution'].items(),
            key=lambda x: x[1],
            reverse=True
        )
        for emotion, percentage in sorted_emotions:
            bar_length = int(percentage / 3)
            bar = "█" * bar_length
            print(f"   {emotion:12s}: {bar:30s} {percentage:5.1f}%")
        
        print("\n📊 STATISTICS:")
        print(f"   • Total Frames: {results['stats']['total_frames']}")
        print(f"   • Faces Detected: {results['stats']['frames_with_face']}")
        print(f"   • Detection Rate: {results['metrics']['engagement_ratio']:.1f}%")
        print(f"   • Peak Confidence: {results['stats']['peak_confidence']}")
        print(f"   • Lowest Confidence: {results['stats']['lowest_confidence']}")
        
        print("\n" + "="*70 + "\n")


# Quick test function
def test_video(video_path):
    """Quick test on a video"""
    scorer = ConfidenceScorer()
    results = scorer.analyze_video(video_path)
    
    if results:
        scorer.print_report(results)
        
        # Save results
        # import json
        # with open('confidence_results.json', 'w') as f:
        #     json.dump(results, f, indent=2)
        # print("💾 Results saved to 'confidence_results.json'\n")
    
    return results


if __name__ == "__main__":
    # Test on your interview video
    video_path = "./interview_video5.mp4"
    
    print("="*70)
    print("🎭 INTERVIEW CONFIDENCE SCORER")
    print("="*70)
    print()
    
    results = test_video(video_path)

