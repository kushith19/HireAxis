"""
Balance and reduce dataset for faster training
Takes minimum class count and samples equally from all classes
"""

import os
import shutil
from pathlib import Path
import random
from collections import Counter


def balance_dataset(source_dir, target_dir, samples_per_class=2000):
    """
    Create balanced dataset with equal samples per class
    
    Args:
        source_dir: Original dataset folder (e.g., './datasets/Train')
        target_dir: New balanced dataset folder (e.g., './datasets_balanced/Train')
        samples_per_class: Number of samples to take from each class
    """
    
    source_path = Path(source_dir)
    target_path = Path(target_dir)
    
    if not source_path.exists():
        print(f"❌ Source directory not found: {source_dir}")
        return
    
    # Get all class folders
    class_folders = [d for d in source_path.iterdir() if d.is_dir()]
    
    if len(class_folders) == 0:
        print(f"❌ No class folders found in {source_dir}")
        return
    
    print(f"\n📂 Source: {source_dir}")
    print(f"📂 Target: {target_dir}")
    print(f"🎯 Samples per class: {samples_per_class}\n")
    
    # Count images per class
    print("Original class distribution:")
    class_counts = {}
    for class_folder in class_folders:
        image_files = list(class_folder.glob('*.jpg')) + list(class_folder.glob('*.png'))
        count = len(image_files)
        class_counts[class_folder.name] = count
        print(f"  {class_folder.name:12s}: {count:5d} images")
    
    # Find minimum
    min_count = min(class_counts.values())
    print(f"\n📉 Minimum class: {min_count} images")
    
    # Use smaller of min_count or samples_per_class
    actual_samples = min(samples_per_class, min_count)
    print(f"✅ Will use: {actual_samples} images per class\n")
    
    # Create balanced dataset
    target_path.mkdir(parents=True, exist_ok=True)
    
    total_copied = 0
    
    for class_folder in class_folders:
        class_name = class_folder.name
        target_class_path = target_path / class_name
        target_class_path.mkdir(exist_ok=True)
        
        # Get all images
        image_files = list(class_folder.glob('*.jpg')) + list(class_folder.glob('*.png'))
        
        # Randomly sample
        selected = random.sample(image_files, actual_samples)
        
        # Copy to target
        for img_file in selected:
            target_file = target_class_path / img_file.name
            shutil.copy2(img_file, target_file)
        
        total_copied += len(selected)
        print(f"✅ {class_name:12s}: Copied {len(selected)} images")
    
    print(f"\n🎉 Done! Total images: {total_copied}")
    print(f"📂 Balanced dataset at: {target_dir}\n")


def balance_both_splits(samples_per_class_train=1000, samples_per_class_test=200):
    """Balance both train and test splits"""
    
    print("="*70)
    print("⚖️  DATASET BALANCING")
    print("="*70)
    
    # Balance Train
    balance_dataset(
        './datasets/Train',
        './datasets_balanced/Train',
        samples_per_class_train
    )
    
    # Balance Test
    balance_dataset(
        './datasets/Test',
        './datasets_balanced/Test',
        samples_per_class_test
    )
    
    print("="*70)
    print("✅ BALANCING COMPLETE")
    print("="*70)
    print("\nUpdate train_emotion_model.py:")
    print("  CONFIG['data_root'] = './datasets_balanced'")
    print()


if __name__ == "__main__":
    # Adjust these numbers to control dataset size
    TRAIN_SAMPLES = 3000  # 1000 per class = 8000 total
    TEST_SAMPLES = 200    # 200 per class = 1600 total
    
    print(f"\nConfiguration:")
    print(f"  Train: {TRAIN_SAMPLES} samples per class")
    print(f"  Test:  {TEST_SAMPLES} samples per class")
    print(f"  Expected total: {TRAIN_SAMPLES * 8} train + {TEST_SAMPLES * 8} test\n")
    
    response = input("Proceed? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        balance_both_splits(TRAIN_SAMPLES, TEST_SAMPLES)
    else:
        print("Cancelled.")

