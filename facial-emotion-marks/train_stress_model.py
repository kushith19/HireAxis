"""
Train ResNet Model for Stress vs No-Stress Detection
Dataset: dataset2 folder with train/ and test/ splits
Classes: stress, nostress
"""

import json
import torch
import torch.optim as optim
from collections import Counter
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import torch.nn as nn
import torchvision.models as models
from torch.utils.data import WeightedRandomSampler
import numpy as np
import os
from datetime import datetime


# ============ CONFIGURATION ============
CONFIG = {
    'data_root': './dataset2',
    'model_architecture': 'resnet50',  # Options: resnet18, resnet34, resnet50
    'batch_size': 32,
    'learning_rate': 3e-4,
    'weight_decay': 1e-4,
    'epochs': 30,
    'early_stop_patience': 5,
    'num_workers': 4,
    'dropout_rate': 0.2,
    'device': 'auto',  # auto, mps, cuda, cpu
    'save_path': 'stress_detector_resnet50.pth',
    'labels_path': 'stress_labels.json'
}


# ============ DATA AUGMENTATION ============
train_transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),  # Convert to 3-channel grayscale
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.RandomRotation(degrees=15),
    transforms.RandomApply([
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2)
    ], p=0.5),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def setup_device():
    """Auto-detect best available device"""
    if CONFIG['device'] == 'auto':
        if torch.backends.mps.is_available():
            device = 'mps'
        elif torch.cuda.is_available():
            device = 'cuda'
        else:
            device = 'cpu'
    else:
        device = CONFIG['device']
    
    print(f"🖥️  Using device: {device}")
    return device


def load_datasets():
    """Load train and test datasets"""
    train_path = os.path.join(CONFIG['data_root'], 'train')
    test_path = os.path.join(CONFIG['data_root'], 'test')
    
    if not os.path.exists(train_path):
        raise ValueError(f"Training data not found at {train_path}")
    if not os.path.exists(test_path):
        raise ValueError(f"Test data not found at {test_path}")
    
    print(f"📂 Loading data from {CONFIG['data_root']}")
    
    train_dataset = datasets.ImageFolder(root=train_path, transform=train_transform)
    test_dataset = datasets.ImageFolder(root=test_path, transform=val_transform)
    
    print(f"✅ Train samples: {len(train_dataset)}")
    print(f"✅ Test samples: {len(test_dataset)}")
    print(f"📋 Classes: {train_dataset.classes}")
    
    return train_dataset, test_dataset


def save_labels(classes):
    """Save class labels to JSON"""
    labels_dict = {str(i): cls for i, cls in enumerate(classes)}
    with open(CONFIG['labels_path'], 'w') as f:
        json.dump(labels_dict, f, indent=2)
    print(f"💾 Labels saved to {CONFIG['labels_path']}")


def create_balanced_sampler(dataset):
    """Create weighted sampler for class imbalance"""
    class_counts = Counter(dataset.targets)
    class_weights = {cls: 1.0/count for cls, count in class_counts.items()}
    weights = [class_weights[label] for label in dataset.targets]
    sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
    
    print("\n📊 Class Distribution:")
    for cls_idx, cls_name in enumerate(dataset.classes):
        count = class_counts[cls_idx]
        pct = count / len(dataset) * 100
        print(f"   {cls_name:12s}: {count:5d} samples ({pct:5.1f}%)")
    
    return sampler


def create_model(num_classes):
    """Create ResNet model"""
    architecture = CONFIG['model_architecture']
    
    if architecture == 'resnet18':
        print("🏗️  Creating ResNet18 model")
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    elif architecture == 'resnet34':
        print("🏗️  Creating ResNet34 model")
        model = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
    elif architecture == 'resnet50':
        print("🏗️  Creating ResNet50 model")
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    else:
        raise ValueError(f"Unknown architecture: {architecture}")
    
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(CONFIG['dropout_rate']),
        nn.Linear(num_ftrs, num_classes)
    )
    
    return model


def train_epoch(model, train_loader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    avg_loss = running_loss / len(train_loader)
    accuracy = 100. * correct / total
    
    return avg_loss, accuracy


def validate(model, test_loader, criterion, device):
    """Validate model"""
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0
    
    # For per-class accuracy
    class_correct = [0, 0]
    class_total = [0, 0]
    
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            # Per-class accuracy
            for i in range(len(labels)):
                label = labels[i].item()
                class_correct[label] += (predicted[i] == labels[i]).item()
                class_total[label] += 1
    
    avg_loss = val_loss / len(test_loader)
    accuracy = 100. * correct / total
    
    # Calculate per-class accuracy
    class_acc = [100 * class_correct[i] / class_total[i] if class_total[i] > 0 else 0 
                 for i in range(2)]
    
    return avg_loss, accuracy, class_acc


def train_model():
    """Main training function"""
    print("\n" + "="*70)
    print("🚀 STARTING STRESS DETECTION MODEL TRAINING")
    print("="*70 + "\n")
    
    # Setup
    device = setup_device()
    
    # Load data
    train_dataset, test_dataset = load_datasets()
    save_labels(train_dataset.classes)
    
    # Create data loaders with balanced sampling
    sampler = create_balanced_sampler(train_dataset)
    train_loader = DataLoader(
        train_dataset, 
        batch_size=CONFIG['batch_size'], 
        sampler=sampler, 
        num_workers=CONFIG['num_workers']
    )
    test_loader = DataLoader(
        test_dataset, 
        batch_size=CONFIG['batch_size'], 
        shuffle=False, 
        num_workers=CONFIG['num_workers']
    )
    
    # Create model
    model = create_model(num_classes=len(train_dataset.classes))
    model = model.to(device)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.Adam(
        model.parameters(), 
        lr=CONFIG['learning_rate'], 
        weight_decay=CONFIG['weight_decay']
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', patience=2, factor=0.5
    )
    
    # Training loop
    print("\n" + "="*70)
    print("🎯 TRAINING START")
    print("="*70)
    
    best_val_acc = 0.0
    epochs_no_improve = 0
    training_history = []
    
    for epoch in range(CONFIG['epochs']):
        # Train
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        
        # Validate
        val_loss, val_acc, class_acc = validate(model, test_loader, criterion, device)
        
        # Update scheduler
        scheduler.step(val_acc)
        
        # Print progress
        print(f"Epoch [{epoch+1:2d}/{CONFIG['epochs']}]")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")
        print(f"  Class Acc:  nostress={class_acc[0]:.1f}% | stress={class_acc[1]:.1f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), CONFIG['save_path'])
            print(f"  ✅ New best model saved! (Val Acc: {best_val_acc:.2f}%)")
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            print(f"  ⚠️  No improvement for {epochs_no_improve} epoch(s)")
        
        print()
        
        # Early stopping
        if epochs_no_improve >= CONFIG['early_stop_patience']:
            print(f"⛔ Early stopping triggered! No improvement for {CONFIG['early_stop_patience']} epochs.")
            break
        
        # Save history
        training_history.append({
            'epoch': epoch + 1,
            'train_loss': train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'val_acc': val_acc,
            'class_acc': class_acc
        })
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETED")
    print("="*70)
    print(f"Best validation accuracy: {best_val_acc:.2f}%")
    print(f"Model saved to: {CONFIG['save_path']}")
    print(f"Labels saved to: {CONFIG['labels_path']}")
    
    # Save training history
    history_file = CONFIG['save_path'].replace('.pth', '_history.json')
    with open(history_file, 'w') as f:
        json.dump(training_history, f, indent=2)
    print(f"Training history saved to: {history_file}")
    
    return model, training_history


def test_model():
    """Test the trained model"""
    print("\n" + "="*70)
    print("🧪 TESTING TRAINED MODEL")
    print("="*70 + "\n")
    
    device = setup_device()
    
    # Load test data
    _, test_dataset = load_datasets()
    test_loader = DataLoader(
        test_dataset, 
        batch_size=CONFIG['batch_size'], 
        shuffle=False, 
        num_workers=CONFIG['num_workers']
    )
    
    # Load model
    model = create_model(num_classes=len(test_dataset.classes))
    model.load_state_dict(torch.load(CONFIG['save_path'], map_location=device))
    model = model.to(device)
    
    # Test
    criterion = nn.CrossEntropyLoss()
    test_loss, test_acc, class_acc = validate(model, test_loader, criterion, device)
    
    print(f"📊 Test Results:")
    print(f"   Overall Accuracy: {test_acc:.2f}%")
    print(f"   No-Stress Accuracy: {class_acc[0]:.2f}%")
    print(f"   Stress Accuracy: {class_acc[1]:.2f}%")
    print(f"   Test Loss: {test_loss:.4f}")
    
    # Calculate balanced accuracy
    balanced_acc = (class_acc[0] + class_acc[1]) / 2
    print(f"\n   Balanced Accuracy: {balanced_acc:.2f}%")
    
    return test_acc, class_acc


if __name__ == "__main__":
    print("\n" + "="*70)
    print("🎭 STRESS DETECTION MODEL TRAINER")
    print("="*70)
    print(f"\nConfiguration:")
    for key, value in CONFIG.items():
        print(f"  {key:20s}: {value}")
    print("="*70)
    
    # Train
    model, history = train_model()
    
    # Test
    test_acc, class_acc = test_model()
    
    print("\n" + "="*70)
    print("🎉 ALL DONE!")
    print("="*70)
    print(f"\nYour model is ready to use:")
    print(f"  Model file: {CONFIG['save_path']}")
    print(f"  Labels file: {CONFIG['labels_path']}")
    print(f"\nTo use in confidence_scorer.py:")
    print(f'  model = self._load_model("{CONFIG["save_path"]}", num_classes=2)')
    print("\n")

