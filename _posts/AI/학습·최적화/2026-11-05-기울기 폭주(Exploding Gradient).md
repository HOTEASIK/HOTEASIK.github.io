---
title: 기울기 폭주(Exploding Gradient)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 기울기, AI개론]
---
# 기울기 폭주(Exploding Gradient)

## 정의·핵심
- **정의**: 역전파 중 기울기가 층을 거칠수록 **기하급수적으로 커지는** 현상. 한 번의 업데이트로 가중치가 크게 튀어 손실이 갑자기 치솟거나 **`inf`·`NaN`** 이 된다
- **원인**
  - 층마다 **1보다 큰 값이 반복해서 곱해짐**: 큰 가중치 초기화, 깊은 망
  - **RNN**: 같은 가중치를 시간 단계마다 곱함 → 특이값 > 1이면 폭주
  - 너무 큰 학습률, 입력 값이 정규화되지 않음, `log(0)` 같은 수치 문제
- **증상**: 손실 곡선이 갑자기 튀거나 NaN, 가중치 값이 매우 커짐, `grad.norm()`이 수천 이상
- **해결책**
  1. **그래디언트 클리핑(Gradient Clipping)**: 기울기 전체 노름이 임계값을 넘으면 **비율을 유지한 채 잘라 줄인다** — `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` (`backward()` 후, `step()` 전). 6차시: "그래디언트 클리핑: 폭발 방지"
  2. 학습률 낮추기, Warm-up → [[Warm-up]]
  3. 적절한 초기화(He/Xavier/Orthogonal), BatchNorm·LayerNorm
  4. RNN은 LSTM·GRU + 클리핑 (거의 필수)
  5. Huber 같은 기울기 크기가 제한되는 손실 (DQN)
- AMP(FP16)에서는 GradScaler가 inf/NaN 기울기를 감지해 그 스텝을 건너뛴다 → [[AMP(혼합 정밀도)]]

## 수식·원리
```
‖g‖ > max_norm 이면  g ← g · (max_norm / ‖g‖)     (방향 유지, 크기만 줄임)
clip_grad_value_: 각 원소를 [−c, c]로 자름 (방향이 바뀔 수 있음)
```

## 코드 예시
```python
import torch
import torch.nn as nn

model = nn.Linear(10, 1)
with torch.no_grad():
    model.weight.fill_(100.0)                                     # 일부러 큰 가중치
loss = model(torch.ones(4, 10) * 10).pow(2).mean()
loss.backward()
before = torch.cat([p.grad.flatten() for p in model.parameters()]).norm().item()
total = nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # 클리핑 전 노름을 반환
after = torch.cat([p.grad.flatten() for p in model.parameters()]).norm().item()
print(before > 1e5, round(total.item()) == round(before), round(after, 3))   # True True 1.0
```

## 관련 개념
[[기울기 소실(Vanishing Gradient)]] · [[학습률]] · [[Orthogonal 초기화]] · [[LSTM]] · [[Huber Loss]] · [[Loss Surface]]
