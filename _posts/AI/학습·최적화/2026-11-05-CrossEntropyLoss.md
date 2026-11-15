---
title: CrossEntropyLoss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 다중분류, AI개론]
---
# CrossEntropyLoss

## 정의·핵심
- **정의**: **여러 클래스 중 하나**를 고르는 다중분류의 표준 손실. 정답 클래스의 예측 확률에 `−log`를 취한 값. PyTorch는 **Softmax가 내장**되어 있다 (개론 6·9차시)
- **내부 동작**: `CrossEntropyLoss = LogSoftmax + NLLLoss`
  1. 로짓 → LogSoftmax로 로그 확률
  2. **정답 클래스 위치의 값만** 골라 −를 붙임
  3. 배치 평균
- **입력 형식 주의 (강의)**
  - 예측: `[배치, 클래스 수]` 형태의 **raw logits** (Softmax 하지 않은 값)
  - 정답: `[배치]` 형태의 **클래스 인덱스** (정수, `long`) — **원-핫 인코딩 필요 없음**
  - 예: `predictions = tensor([[2.0, 1.0, 0.1]])`, `target = tensor([0])`
  - 이미지 분할처럼 픽셀마다 분류하면 `(N, C, H, W)`와 `(N, H, W)`
- **흔한 실수**
  - 모델 끝에 `Softmax`를 넣고 CrossEntropyLoss 사용 → Softmax 두 번 → 학습이 느리고 정확도가 낮다
  - 정답을 float·원-핫으로 넣음 (최신 버전은 확률 분포 정답도 받지만, 보통은 인덱스)
- **유용한 옵션**
  - `weight=torch.tensor([...])`: 클래스별 가중치 → [[Weighted Cross Entropy]]
  - `label_smoothing=0.1`: 과신 방지 → [[Label Smoothing]]
  - `ignore_index=-100`: 특정 라벨 무시 (NLP 패딩 토큰)
- **값 읽기**: 클래스 K개를 무작위로 찍으면 손실 ≈ `log K` (10클래스 → 2.30). 학습 시작 손실이 이보다 크게 다르면 버그 의심

## 수식·원리
```
CE = −(1/N) Σᵢ log softmax(zᵢ)[yᵢ] = −(1/N) Σᵢ [ zᵢ,yᵢ − log Σⱼ e^(zᵢ,ⱼ) ]
∂CE/∂z = softmax(z) − onehot(y)        (깔끔한 기울기)
```

## 코드 예시
```python
import math
import torch
import torch.nn as nn

pred = torch.tensor([[2.0, 1.0, 0.1]]); target = torch.tensor([0])
ce = nn.CrossEntropyLoss()(pred, target)
manual = -torch.log_softmax(pred, dim=1)[0, 0]
print(round(ce.item(), 4), round(manual.item(), 4))        # 0.417 0.417

z = torch.zeros(4, 10)                                     # 10클래스 균등 예측
print(round(nn.CrossEntropyLoss()(z, torch.tensor([1, 2, 3, 4])).item(), 3), round(math.log(10), 3))   # 2.303 2.303

zz = pred.clone().requires_grad_()
nn.CrossEntropyLoss()(zz, target).backward()
print([round(v, 3) for v in zz.grad[0].tolist()])          # [-0.341, 0.242, 0.099] = softmax − onehot

double = nn.CrossEntropyLoss()(torch.softmax(pred, 1), target)
print(round(double.item(), 3))                             # 0.802  ← Softmax 두 번 적용한 잘못된 값
```

## 관련 개념
[[Softmax]] · [[LogSoftmax]] · [[NLLLoss]] · [[Label Smoothing]] · [[Weighted Cross Entropy]] · [[다중분류]]
