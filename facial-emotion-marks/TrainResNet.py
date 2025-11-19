# %%
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
#
# %%
tranform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224,224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.RandomRotation(degrees=15),
    transforms.RandomApply([
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2)
    ], p=0.5),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_tranform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# %%
train_dataset = datasets.ImageFolder(root="./datasets/Train/", transform=tranform)
test_dataset = datasets.ImageFolder(root="./datasets/Test/", transform=val_tranform)

# %%
print(train_dataset.classes)
# %%
with open("facial_labels.json", "w") as f:
    json.dump({str(i): cls for i, cls in enumerate(train_dataset.classes)}, f)

# %%
class_counts = Counter(train_dataset.targets)
class_weights = {cls: 1.0/count for cls, count in class_counts.items()}
weights = [class_weights[label] for label in train_dataset.targets]
sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)


# %%
train_loader = DataLoader(train_dataset, batch_size=32, sampler=sampler, num_workers=6)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=6)

# %%
device = 'mps' if torch.backends.mps.is_available() else "cuda" if torch.backends.cuda.is_available() else 'cpu'

# %%
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
num_ftrs = model.fc.in_features

# %%
model.fc = nn.Sequential(
    nn.Dropout(0.2),
    nn.Linear(num_ftrs, len(train_dataset.classes))
)
model = model.to(device)

# %%
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
optimizer = optim.Adam(model.parameters(), lr=3e-4, weight_decay=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='max', patience=2, factor=0.5
)

# %%
epochs = 35
best_val_acc = 0.0
epochs_no_improve = 0
early_stop_patience = 5

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()

    train_acc = correct / len(train_dataset)
    avg_loss = running_loss / len(train_loader)

    model.eval()
    val_correct = 0
    val_loss = 0.0
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            val_loss += criterion(outputs, labels).item()
            val_correct += (outputs.argmax(1) == labels).sum().item()

    val_acc = val_correct / len(test_dataset)
    val_loss_avg = val_loss / len(test_loader)

    scheduler.step(val_acc)

    print(f"Epoch [{epoch+1}/{epochs}], Train Loss: {avg_loss:.4f}, Train Acc: {train_acc:.4f}, Val Loss: {val_loss_avg:.4f}, Val Acc: {val_acc:.4f}")

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), "facial_resnet50_3.pth")
        print(f"✅ New best model saved (Val Acc: {best_val_acc:.4f})")
        epochs_no_improve = 0
    else:
        epochs_no_improve+=1
        print(f"⚠️ No improvement for {epochs_no_improve} epoch(s).")

    if epochs_no_improve >= early_stop_patience:
        print(f"⛔ Early stopping triggered! No improvement for {early_stop_patience} epochs.")
        break

print(f"Training completed. Best validation accuracy: {best_val_acc:.4f}")
# %%
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(num_ftrs, len(train_dataset.classes))
)
model.load_state_dict(torch.load("facial_resnet50_3.pth", map_location=device))
model = model.to(device)
model.eval()

# %%
from PIL import Image
img_path = "./datasets/Train/neutral/image0010108.jpg"
image = Image.open(img_path).convert("RGB")
image = val_tranform(image).unsqueeze(0).to(device)

# %%
with torch.no_grad():
    outputs = model(image)
    probs = torch.softmax(outputs, dim=1)
    predicted_class = torch.argmax(probs, dim=1).item()

# If you have the class mapping file
import json
with open("facial_labels.json", "r") as f:
    idx_to_class = json.load(f)

print(f"Predicted Class: {idx_to_class[str(predicted_class)]}")
print(f"Class Probabilities: {probs.cpu().numpy()}")
