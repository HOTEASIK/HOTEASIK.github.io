---
title: Label Smoothing
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 손실함수, 규제, AI개론]
---
# Label Smoothing

## 정의·핵심
- **정의**: 원-핫 정답 `[1, 0, 0]`을 **약간 부드럽게** `[0.933, 0.033, 0.033]`처럼 바꿔서 학습하는 기법. **모델 과신 완화** (개론 6차시)
- **해결하는 문제 — 모델 과신**: 원-핫 정답으로 CE를 계속 줄이면, 모델은 정답 로짓을 끝없이 키워 **0.99 이상의 확률**을 부여한다 → 과적합, 새로운 데이터·라벨 오류에 취약, 확률 신뢰도가 떨어짐(Calibration 나쁨)
- **방법**: 정답 클래스에서 α만큼 덜어 **모든 클래스에 α/K씩** 고르게 나눠 준다
  - 강의 예(K=3, α=0.1): 클래스 0 = 1×0.9 + 0.1/3 = **0.933**, 클래스 1·2 = 0×0.9 + 0.1/3 = **0.033**
  - **α 권장값 0.1 (ImageNet 표준)**
- **효과**: 일반화 성능 향상, 과적합 방지, 예측 확률의 신뢰도 증가 (Calibration 개선), 라벨 노이즈에 강해짐
- **PyTorch**: `nn.CrossEntropyLoss(label_smoothing=0.1)` 한 줄
  - 이진분류는 직접 정답을 바꿔서: `y_smooth = y*(1−α) + 0.5α`
- **주의**: 손실 최솟값이 0이 아니게 된다 (완벽 예측해도 손실 > 0). 지식 증류처럼 정확한 확률이 필요한 곳에서는 끄는 편이 낫다

## 수식·원리
```
y_smooth = y × (1 − α) + α / K
CE_smooth = (1−α)·CE(z, y) + α·(1/K)·Σⱼ (−log pⱼ)
```

## 코드 예시
```python
import torch
import torch.nn as nn

K, a = 3, 0.1
y = torch.tensor([1.0, 0.0, 0.0])
print([round(v, 3) for v in (y * (1 - a) + a / K).tolist()])     # [0.933, 0.033, 0.033]

z = torch.tensor([[2.0, 1.0, 0.1]]); t = torch.tensor([0])
ls = nn.CrossEntropyLoss(label_smoothing=0.1)(z, t)
manual = -(torch.tensor([0.9 + 0.1 / 3, 0.1 / 3, 0.1 / 3]) * torch.log_softmax(z, 1)[0]).sum()
print(round(ls.item(), 4), round(manual.item(), 4))               # 0.5137 0.5137

big = torch.tensor([[20.0, 0.0, 0.0]])                            # 과신한 예측
print(round(nn.CrossEntropyLoss()(big, t).item(), 4),
      round(nn.CrossEntropyLoss(label_smoothing=0.1)(big, t).item(), 3))   # 0.0 1.333  ← 과신에 벌점
```

## 관련 개념
[[CrossEntropyLoss]] · [[Calibration]] · [[과적합(Overfitting)]] · [[KL Divergence]] · [[Temperature Scaling]]
