---
title: DataLoader
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# DataLoader

## 정의·핵심
- **정의**: Dataset에서 샘플을 꺼내 **미니배치로 묶어** 반복문에 넘겨 주는 도구. `torch.utils.data.DataLoader`
- **주요 인자**
  - `batch_size`: 한 번에 묶을 샘플 수. MNIST 6만 장 / 500 = **120개 배치** (10차시)
  - `shuffle`: 에폭마다 순서를 섞을지. **훈련용은 True**(같은 순서 학습으로 생기는 편향 방지), **검증·테스트용은 False**(결과 재현) (12차시)
  - `num_workers`: 데이터를 읽는 병렬 프로세스 수. 이미지 읽기가 병목일 때 늘린다 (Windows에서는 `if __name__ == '__main__':` 필요)
  - `pin_memory=True`: GPU로 옮기는 속도 향상 → [[DataLoader 속도]]
  - `drop_last=True`: 마지막 덜 찬 배치 버리기 (BatchNorm은 배치 크기 1이면 오류)
- **사용 형태**: `for images, labels in train_loader:` — 한 번 돌 때마다 배치 하나. 다 돌면 1 에폭
- 배치 모양: MNIST를 펴서 쓰면 `images [500, 784]`, `labels [500]` (10차시)
- **배치 크기의 영향**: 작으면(16~32) 노이즈가 많지만 일반화에 유리할 수 있고 메모리가 적게 든다. 크면(256~1024) 빠르고 안정적이지만 GPU 메모리를 많이 쓴다. (5차시) → [[미니배치·배치 크기]]
- `len(loader)` = 배치 개수, `len(loader.dataset)` = 샘플 개수
- 한 배치만 확인: `images, labels = next(iter(train_loader))`

## 수식·원리
- 배치 수 $= \lceil N / \text{batch\_size} \rceil$ (drop_last=False일 때)
- 1 epoch = 모든 배치를 한 번씩 학습 = (배치 수)번의 파라미터 업데이트

## 코드 예시
```python
import torch
from torch.utils.data import DataLoader, TensorDataset

ds = TensorDataset(torch.randn(60000, 784), torch.randint(0, 10, (60000,)))
train_loader = DataLoader(ds, batch_size=500, shuffle=True)
test_loader = DataLoader(ds, batch_size=500, shuffle=False)

print(len(train_loader), len(train_loader.dataset))   # 120 60000
images, labels = next(iter(train_loader))
print(images.shape, labels.shape)                     # torch.Size([500, 784]) torch.Size([500])

small = DataLoader(TensorDataset(torch.arange(10)), batch_size=4)
print([b[0].tolist() for b in small])   # [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]]
```

## 관련 개념
[[Dataset]] · [[미니배치·배치 크기]] · [[에폭·이터레이션]] · [[DataLoader 속도]] · [[학습 루프 4단계]]
