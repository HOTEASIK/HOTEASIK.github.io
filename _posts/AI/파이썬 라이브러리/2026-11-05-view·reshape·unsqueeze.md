---
title: view·reshape·unsqueeze
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# view·reshape·unsqueeze

## 정의·핵심
- **view(모양)**: 데이터는 그대로 두고 **모양만 바꾼 새 시점(view)** 을 만든다. 원본과 메모리를 공유한다. 메모리가 연속(contiguous)일 때만 된다.
- **reshape(모양)**: view와 같지만, 연속이 아니면 **알아서 복사**해서라도 모양을 바꾼다. 더 안전하다.
- **`-1`**: 그 축 크기를 자동 계산. `x.view(-1, 1)` → `(N, 1)`, `x.view(-1)` → 1차원으로 펴기
- **unsqueeze(dim)**: 지정 위치에 **크기 1인 축을 추가**. `(N,)` → `unsqueeze(1)` → `(N, 1)` (4차시 편향-분산 실습)
- **squeeze(dim)**: 크기 1인 축을 **제거**. `(N, 1)` → `(N,)`
- **permute / transpose**: 축의 **순서**를 바꾼다. CHW ↔ HWC. 결과는 연속이 아니라서 뒤에 view를 쓰려면 `.contiguous()`가 필요하다.
- **딥러닝에서 쓰는 곳**
  - 정답을 `(N, 1)`로: `labels.view(-1, 1)` — 예측 `(N, 1)`과 모양을 맞춰야 MSE·BCE가 바르게 계산된다 (7·8차시) → [[브로드캐스팅]]
  - MNIST 이미지 펴기: `x.view(-1)` → 784 (transforms.Lambda) / 배치에서 `x.view(x.size(0), -1)`
  - 이미지 1장으로 추론: `img.unsqueeze(0)` → 배치 차원 추가 `(1, C, H, W)`
  - CNN 출력 펴기: `nn.Flatten()` 또는 `x.view(N, -1)` → [[Flatten]]

## 수식·원리
```
(6,)   ─view(2,3)─▶ (2,3)
(N,)   ─unsqueeze(1)─▶ (N,1)   ─squeeze(1)─▶ (N,)
(C,H,W) ─permute(1,2,0)─▶ (H,W,C)
조건: 바꾸기 전후 요소 수(numel)가 같아야 함
```

## 코드 예시
```python
import torch

x = torch.arange(6)
v = x.view(2, 3)
v[0, 0] = 100
print(x[0])                        # tensor(100) ← 메모리 공유

y = torch.tensor([1., 2., 3.])
print(y.view(-1, 1).shape)         # torch.Size([3, 1])
print(y.unsqueeze(1).shape)        # torch.Size([3, 1])
print(y.unsqueeze(1).squeeze(1).shape)   # torch.Size([3])

img = torch.zeros(3, 32, 32)
print(img.unsqueeze(0).shape)      # torch.Size([1, 3, 32, 32])
p = img.permute(1, 2, 0)
print(p.is_contiguous())           # False → view 대신 reshape
print(p.reshape(-1).shape)         # torch.Size([3072])
```

## 관련 개념
[[텐서 차원]] · [[reshape·hstack·where]] · [[브로드캐스팅]] · [[Flatten]] · [[transforms]]
