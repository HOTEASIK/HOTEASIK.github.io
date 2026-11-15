---
title: 배치 경사하강법(Full Batch)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 경사하강법, AI개론]
---
# 배치 경사하강법(Full Batch)

## 정의·핵심
- **정의**: **학습 데이터 전체**로 손실과 기울기를 계산한 뒤 파라미터를 **한 번** 업데이트하는 방식. 1 에폭 = 1 업데이트
- **장점**
  - 전체 데이터의 평균 기울기라 **방향이 정확하고 안정적** — 손실 곡선이 매끄럽게 감소
  - 같은 조건이면 결과가 항상 같다 (무작위성 없음)
- **단점**
  - 데이터가 크면 **메모리에 다 올릴 수 없다** (ImageNet 120만 장을 한 번에 GPU에 넣을 수 없음)
  - 업데이트 한 번에 전체 계산이 필요해 **느리다**
  - 기울기에 잡음이 없어 **국소 최솟값·안장점에서 빠져나오기 어렵다**
- **언제 쓰나**: 데이터가 아주 작은 예제 — 강의의 신장·체중 5명, 보스턴 집값(506개) 선형회귀 실습은 전체 데이터를 한 번에 넣는 Full Batch
- 실전 딥러닝은 거의 항상 **미니배치** 사용 → [[미니배치·배치 크기]]

## 수식·원리
```
g = (1/N) Σᵢ₌₁ᴺ ∇L(xᵢ, yᵢ)      ← N = 전체 데이터 수
W ← W − η·g                    (에폭당 1회)
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
X = torch.randn(506, 1); Y = 3 * X + 2 + 0.1 * torch.randn(506, 1)
W = torch.zeros(1, requires_grad=True); B = torch.zeros(1, requires_grad=True)
for epoch in range(200):                       # 매 에폭 전체 506개로 1번 업데이트
    loss = ((X * W + B - Y) ** 2).mean()
    loss.backward()
    with torch.no_grad():
        W -= 0.05 * W.grad; B -= 0.05 * B.grad
        W.grad.zero_(); B.grad.zero_()
print(round(W.item(), 1), round(B.item(), 1))  # 3.0 2.0
```

## 관련 개념
[[경사하강법(GD)]] · [[확률적 경사하강법(SGD)]] · [[미니배치·배치 크기]] · [[선형회귀]]
