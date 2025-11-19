"""
Train ResNet Model for Emotion Detection
8 Classes: anger, contempt, disgust, fear, happy, neutral, sad, surprise
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


# ============ CONFIGURATION ============
CONFIG = {
    'data_root': './datasets',
    'model_architecture': 'resnet34',  # resnet18, resnet34, resnet50 (34 is faster)
    'batch_size': 64,  # Larger batch = faster training
    'learning_rate': 5e-4,  # Slightly higher for faster convergence
    'weight_decay': 1e-4,
    'epochs': 25,  # Reduced from 35
    'early_stop_patience': 4,  # Reduced from 5
    'num_workers': 0,  # Set to 0 to avoid "too many open files" error on macOS
    'dropout_rate': 0.2,
    'save_path': './models/emotion_resnet34.pth',
    'labels_path': './models/emotion_labels.json',
    'max_samples_per_class': 2000,  # Limit to 2000 per class for faster training
}


# ============ DATA TRANSFORMS ============
train_transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
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
    if torch.backends.mps.is_available():
        device = 'mps'
    elif torch.cuda.is_available():
        device = 'cuda'
    else:
        device = 'cpu'
    print(f"🖥️  Device: {device}")
    return device


def create_model(num_classes):
    if CONFIG['model_architecture'] == 'resnet18':
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    elif CONFIG['model_architecture'] == 'resnet34':
        model = models.resnet34(weights=models.ResNet34_Weights.DEFAULT)
    else:
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(CONFIG['dropout_rate']),
        nn.Linear(num_ftrs, num_classes)
    )
    return model


def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in loader:
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
    
    return running_loss / len(loader), 100. * correct / total


def validate(model, loader, criterion, device, num_classes):
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0
    
    class_correct = [0] * num_classes
    class_total = [0] * num_classes
    
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            for i in range(len(labels)):
                label = labels[i].item()
                class_correct[label] += (predicted[i] == labels[i]).item()
                class_total[label] += 1
    
    avg_loss = val_loss / len(loader)
    accuracy = 100. * correct / total
    class_acc = [100 * class_correct[i] / class_total[i] if class_total[i] > 0 else 0 
                 for i in range(num_classes)]
    
    return avg_loss, accuracy, class_acc


def main():
    print("\n" + "="*70)
    print("🎭 EMOTION DETECTION MODEL TRAINING")
    print("="*70 + "\n")
    
    device = setup_device()
    
    # Load datasets
    print(f"📂 Loading data from {CONFIG['data_root']}")
    train_dataset_full = datasets.ImageFolder(root=f"{CONFIG['data_root']}/train", transform=train_transform)
    test_dataset = datasets.ImageFolder(root=f"{CONFIG['data_root']}/validation", transform=val_transform)
    
    print(f"✅ Original Train: {len(train_dataset_full)} samples")
    print(f"✅ Original Test: {len(test_dataset)} samples")
    
    # Store classes before subsetting
    train_classes = train_dataset_full.classes
    
    # Limit samples per class if configured
    train_dataset = train_dataset_full
    if CONFIG['max_samples_per_class'] is not None:
        print(f"\n🔄 Limiting to {CONFIG['max_samples_per_class']} samples per class...")
        
        train_indices = []
        
        for class_idx in range(len(train_classes)):
            # Get all indices for this class
            class_indices = [i for i, label in enumerate(train_dataset_full.targets) if label == class_idx]
            # Randomly sample
            import random
            random.shuffle(class_indices)
            selected = class_indices[:CONFIG['max_samples_per_class']]
            train_indices.extend(selected)
        
        # Create subset
        from torch.utils.data import Subset
        train_dataset = Subset(train_dataset_full, train_indices)
        print(f"✅ Reduced Train: {len(train_dataset)} samples")
    
    print(f"📋 Classes: {train_classes}\n")
    
    # Save labels
    labels_dict = {str(i): cls for i, cls in enumerate(train_classes)}
    import os
    os.makedirs(os.path.dirname(CONFIG['labels_path']), exist_ok=True)
    with open(CONFIG['labels_path'], 'w') as f:
        json.dump(labels_dict, f, indent=2)
    print(f"💾 Labels saved to {CONFIG['labels_path']}")
    
    # Class distribution (handle both full dataset and subset)
    if hasattr(train_dataset, 'dataset'):
        # It's a Subset
        targets = [train_dataset_full.targets[i] for i in train_dataset.indices]
    else:
        targets = train_dataset.targets
    
    class_counts = Counter(targets)
    print("\n📊 Class Distribution:")
    for idx, cls_name in enumerate(train_classes):
        count = class_counts[idx]
        pct = count / len(train_dataset) * 100
        print(f"   {cls_name:12s}: {count:5d} ({pct:5.1f}%)")
    
    # Weighted sampler for class balance
    class_weights = {cls: 1.0/count for cls, count in class_counts.items()}
    weights = [class_weights[label] for label in targets]
    sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
    
    # Data loaders
    train_loader = DataLoader(train_dataset, batch_size=CONFIG['batch_size'], 
                             sampler=sampler, num_workers=CONFIG['num_workers'])
    test_loader = DataLoader(test_dataset, batch_size=CONFIG['batch_size'], 
                            shuffle=False, num_workers=CONFIG['num_workers'])
    
    # Model
    num_classes = len(train_classes)
    model = create_model(num_classes)
    model = model.to(device)
    
    # Training setup
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.Adam(model.parameters(), lr=CONFIG['learning_rate'], 
                          weight_decay=CONFIG['weight_decay'])
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', patience=2, factor=0.5
    )
    
    # Training loop
    print("\n" + "="*70)
    print("🎯 TRAINING")
    print("="*70 + "\n")
    
    best_val_acc = 0.0
    epochs_no_improve = 0
    
    for epoch in range(CONFIG['epochs']):
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, class_acc = validate(model, test_loader, criterion, device, num_classes)
        
        scheduler.step(val_acc)
        
        print(f"Epoch [{epoch+1:2d}/{CONFIG['epochs']}]")
        print(f"  Train: Loss={train_loss:.4f}, Acc={train_acc:.2f}%")
        print(f"  Val:   Loss={val_loss:.4f}, Acc={val_acc:.2f}%")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            os.makedirs(os.path.dirname(CONFIG['save_path']), exist_ok=True)
            torch.save(model.state_dict(), CONFIG['save_path'])
            print(f"  ✅ Best model saved! (Acc: {best_val_acc:.2f}%)")
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            print(f"  ⚠️  No improvement ({epochs_no_improve})")
        
        print()
        
        if epochs_no_improve >= CONFIG['early_stop_patience']:
            print(f"⛔ Early stopping! No improvement for {CONFIG['early_stop_patience']} epochs.\n")
            break
    
    print("="*70)
    print("✅ TRAINING COMPLETE")
    print("="*70)
    print(f"Best Accuracy: {best_val_acc:.2f}%")
    print(f"Model: {CONFIG['save_path']}")
    print(f"Labels: {CONFIG['labels_path']}\n")


if __name__ == "__main__":
    main()

