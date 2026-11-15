---
title: state_dict 저장·불러오기
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# state_dict 저장·불러오기

## 정의·핵심
- **state_dict**: 모델의 학습된 값(파라미터 + BN 통계 같은 buffer)을 **`{이름: 텐서}` 딕셔너리**로 담은 것. `net.state_dict()`
- **저장 방법 (권장)**: 모델 객체 전체가 아니라 **state_dict만** 저장한다.
  - 저장: `torch.save(net.state_dict(), 'model.pth')`
  - 불러오기: **같은 구조의 모델을 먼저 만들고** → `net.load_state_dict(torch.load('model.pth'))`
  - 이유: 모델 전체(`torch.save(net)`)를 저장하면 클래스 코드 위치까지 묶여서 코드가 바뀌면 못 불러온다.
- **불러온 뒤 `net.eval()`**: 추론 전에 Dropout·BN을 평가 모드로 (10차시 과제)
- **GPU에서 저장 → CPU에서 불러오기**: `torch.load(path, map_location='cpu')`
- **최고 성능 모델 저장 (Early Stopping과 함께)**: 검증 손실이 가장 낮을 때 저장. 메모리에 들고 있을 거면 `copy.deepcopy(net.state_dict())` — 그냥 대입하면 계속 바뀌는 텐서를 가리킨다. → [[얕은 복사·깊은 복사]]
- **옵티마이저도 state_dict가 있다**: 학습을 이어서 하려면 `optimizer.state_dict()`(모멘텀 등)도 함께 저장한다 (체크포인트).
- **전이학습**: torchvision 사전학습 가중치도 결국 state_dict를 불러오는 것이다. 구조가 일부 다르면 `strict=False`. → [[torchvision.models]]
- 05의 [[실전 예측 함수]]에서 저장한 모델로 새 데이터를 예측하는 흐름을 다룬다.

## 수식·원리
```
학습 → torch.save(net.state_dict(), path)
                      ↓
새 Net() 생성 → load_state_dict(torch.load(path)) → eval() → 예측
```

## 코드 예시
```python
import os, copy, tempfile
import torch
import torch.nn as nn

net = nn.Sequential(nn.Linear(4, 3), nn.ReLU(), nn.Linear(3, 2))
print(list(net.state_dict().keys()))      # ['0.weight', '0.bias', '2.weight', '2.bias']

path = os.path.join(tempfile.gettempdir(), "model.pth")
torch.save(net.state_dict(), path)

net_new = nn.Sequential(nn.Linear(4, 3), nn.ReLU(), nn.Linear(3, 2))
net_new.load_state_dict(torch.load(path, map_location="cpu"))
net_new.eval()
x = torch.randn(1, 4)
print(torch.equal(net(x), net_new(x)))    # True

best = copy.deepcopy(net.state_dict())    # 최고 모델 보관
with torch.no_grad():
    net[0].weight.add_(1.0)
print(torch.equal(best["0.weight"], net.state_dict()["0.weight"]))   # False (복사본은 그대로)
```

## 관련 개념
[[nn.Module]] · [[얕은 복사·깊은 복사]] · [[Early Stopping]] · [[torchvision.models]] · [[train()·eval() 모드]]
