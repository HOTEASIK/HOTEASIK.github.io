---
title: Batch Normalization
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 정규화층, AI개론]
---
# Batch Normalization

## 정의·핵심
- **정의**: 각 미니배치 단위로 층의 출력을 **평균 0, 분산 1로 정규화**한 뒤, 학습되는 **γ(scale)·β(shift)** 로 다시 조정해 다음 층에 넘기는 층 (개론 5·12차시). `nn.BatchNorm1d`(Linear 뒤), `nn.BatchNorm2d`(Conv 뒤, **채널별**)
- **Internal Covariate Shift (내부 공변량 이동)**: 학습 중 앞 층 가중치가 바뀌면 **뒤 층이 받는 입력 분포가 계속 변한다** → 뒤 층은 움직이는 목표를 쫓는 셈이라 학습이 느리고 불안정. BN은 매 층 입력 분포를 일정하게 맞춰 이를 줄인다 (원 논문의 설명. 실제 효과는 손실 지형을 매끄럽게 하는 것이 더 크다는 후속 연구도 있다)
- **γ·β는 왜 있나**: 무조건 평균 0·분산 1로 고정하면 표현력이 제한된다 (예: Sigmoid 입력이 선형 구간에만 머묾). γ, β를 **학습**해서 필요하면 원래 분포로도 되돌릴 수 있게 한다 → 파라미터 수 = 2 × 채널 수
- **running_mean·running_var**: 학습 중 배치 통계의 **이동 평균**을 버퍼로 저장(`momentum=0.1`). **평가 모드에서는 배치 통계 대신 이 값을 쓴다** → 한 장씩 추론해도 결과가 일정
  - `model.eval()`을 잊으면 추론 결과가 배치 구성에 따라 바뀐다 → [[train()·eval() 모드]]
  - 파라미터가 아니라 **buffer** → `state_dict`에는 저장되지만 `parameters()`에는 없다
- **효과**: 큰 학습률 사용 가능 → 빠른 수렴, 초기화에 덜 민감, 약한 규제 효과(배치 잡음), 기울기 소실 완화. 12차시: "데이터 분포를 안정시켜 학습 효율을 높이고 과학습을 예방"
- **위치**: 보통 `Conv → BN → ReLU`. BN 바로 앞 Conv는 `bias=False` (β가 대신하므로)
- **약점**: 배치가 **너무 작으면**(1~4) 통계가 불안정 → Layer Norm·Group Norm. 시퀀스(RNN·Transformer)에는 Layer Norm → [[Layer Normalization]]

## 수식·원리
```
μ_B = mean(x),  σ²_B = var(x)            (배치·공간 차원으로, 채널별)
x̂ = (x − μ_B) / √(σ²_B + ε)
y = γ·x̂ + β
running_mean ← (1 − m)·running_mean + m·μ_B     (m = momentum = 0.1)
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
bn = nn.BatchNorm2d(3)
x = torch.randn(8, 3, 4, 4) * 5 + 10                     # 평균 10, 표준편차 5
y = bn(x)                                                 # train 모드: 배치 통계 사용
print(round(y.mean().item(), 3), round(y.std().item(), 2))   # 0.0 1.0
print([n for n, _ in bn.named_parameters()], [n for n, _ in bn.named_buffers()])
# ['weight', 'bias'] ['running_mean', 'running_var', 'num_batches_tracked']   (weight=γ, bias=β)
print([round(v, 1) for v in bn.running_mean.tolist()])    # [1.0, 1.0, 1.0] 근처  (0.9·0 + 0.1·10)

bn.eval()
one = bn(x[:1]); again = bn(x[:1])
print(torch.allclose(one, again))                         # True  eval: running 통계로 일정
```

## 관련 개념
[[Layer Normalization]] · [[train()·eval() 모드]] · [[Dropout]] · [[기울기 소실(Vanishing Gradient)]] · [[Loss Surface]] · [[정규화(Normalize)]]
