---
title: Chest X-ray 폐렴 분류
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 의료영상, 전이학습, AI응용]
---
# Chest X-ray 폐렴 분류

## 정의·핵심
- **과제**: 흉부 X-ray를 **NORMAL / PNEUMONIA** 두 클래스로 분류 (응용 13차시 실습, Kaggle "Chest X-Ray Images (Pneumonia)")
- **데이터 (강의)**
  - JPEG(DICOM에서 변환 완료), **그레이스케일**, 해상도 제각각 → 전처리 필요
  - 학습: NORMAL **약 1,341장**, PNEUMONIA **약 3,875장** → **클래스 불균형** (약 1:2.9)
  - 원 데이터의 val 폴더가 매우 작아(16장) 학습 데이터에서 검증셋을 따로 떼는 경우가 많다
- **파이프라인 (강의)**
  - 데이터: 디스크의 JPEG → **Dataset**(한 장씩 읽고 전처리) → **DataLoader**(배치로 묶기) → 모델 (편의점 비유: Dataset = 진열대에서 하나씩 꺼내기, DataLoader = 카트에 32개씩 담아 계산대로, 배치 크기 = 카트 크기)
  - transforms: **Resize 224×224** (ResNet18 입력) → ToTensor(0~1) → **Normalize(ImageNet 통계)**. 흑백이므로 3채널로 변환
  - 증강: RandomRotation, RandomHorizontalFlip 등 (좌우 반전은 심장 위치가 바뀌어 의학적으로 논란이 있음 → 작은 회전·밝기 변화가 안전)
  - 모델: **ImageNet 사전학습 ResNet18**, FC를 **1000 → 2**로 교체 → [[출력층 교체]]
  - 학습: CrossEntropyLoss, **Adam**, batch 32, epoch 10~20, lr 0.001
  - 분할: Train / **Validation**(모델 선택·튜닝) / Test(최종 1회 평가) — "모의고사로 점검한 뒤 진짜 시험"
- **평가: 재현율 중시 (강의)**
  - TP: 폐렴→폐렴, TN: 정상→정상, **FP: 정상인데 폐렴**(거짓 양성), **FN: 폐렴인데 정상**(거짓 음성)
  - "단순 정확도만으로는 충분하지 않다. **놓치지 않는 것(Recall)** 이 매우 중요" — FN은 치료 시기를 놓친다
  - 고급: **ROC-AUC**, PR 곡선, Early Stopping, 실험 설정 자동 저장
- **해석**: Grad-CAM으로 모델이 **폐 영역**을 보고 판단했는지 확인 (글자·마커를 보고 있다면 지름길 학습) → [[의료영상에서 Grad-CAM 활용]]
- 불균형 대응: 클래스 가중치·WeightedRandomSampler, 임계값을 낮춰 재현율 확보 → [[클래스 불균형 문제]]

## 수식·원리
```
ResNet18:  … → GAP → d=512 → [fc: 512 → 2] → softmax → P(PNEUMONIA)
L = −Σ yᵢ log pᵢ  (CrossEntropy),   class weight w_k = N / (2·N_k)
```

## 코드 예시
```python
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

tf = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),         # 흑백 X-ray → 3채널
    transforms.Resize((224, 224)), transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
xray = Image.fromarray((np.random.rand(300, 260) * 255).astype(np.uint8), mode="L")
x = tf(xray).unsqueeze(0)
print(x.shape)                                           # torch.Size([1, 3, 224, 224])

net = models.resnet18(weights=None)                      # 실습: weights="IMAGENET1K_V1"
net.fc = nn.Linear(net.fc.in_features, 2)                # NORMAL, PNEUMONIA
counts = torch.tensor([1341., 3875.])
w = counts.sum() / (2 * counts)
print([round(v, 3) for v in w.tolist()])                 # [1.945, 0.673]  소수 NORMAL에 큰 가중치
criterion = nn.CrossEntropyLoss(weight=w)
opt = torch.optim.Adam(net.parameters(), lr=0.001)
loss = criterion(net(x), torch.tensor([1])); loss.backward(); opt.step()
print(net(x).shape)                                      # torch.Size([1, 2])
```

## 관련 개념
[[의료영상 AI 개요]] · [[전이학습(Transfer Learning)]] · [[재현율(Recall)]] · [[클래스 가중치]] · [[의료영상에서 Grad-CAM 활용]] · [[ImageNet 정규화 통계]]
