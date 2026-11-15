---
title: parameters·named_parameters
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# parameters·named_parameters

## 정의·핵심
- **파라미터(Parameter)**: 학습으로 값이 바뀌는 텐서. 가중치(weight)와 편향(bias). `nn.Parameter` 타입이며 `requires_grad=True`
- **`net.parameters()`**: 모델 안의 모든 파라미터를 하나씩 돌려주는 반복자(generator)
  - **옵티마이저에 넘기는 용도**: `optim.SGD(net.parameters(), lr=0.01)` — "이 파라미터들을 조정하라"는 뜻 (7차시 코드 5-24, 5-27)
  - 파라미터 수 계산: `sum(p.numel() for p in net.parameters())`
- **`net.named_parameters()`**: `(이름, 파라미터)` 쌍을 돌려준다. (7차시 코드 5-23)
  - 이름 예: `l1.weight`, `l1.bias`, `features.0.weight`
  - 특정 파라미터만 고르기: L1 규제를 weight에만 적용 `if 'weight' in n` (7차시 Lasso) → [[L1 규제(Lasso)]]
  - 일부 층만 동결·학습: `if name.startswith('fc')`
- **배치 정규화의 파라미터**: BN의 γ(scale)·β(shift)는 `bn.weight`, `bn.bias`로 나온다. 초기값 γ=1, β=0. running_mean·running_var는 학습 대상이 아니라서 파라미터가 아니라 **buffer**다. (7차시 주석)
- **generator 주의**: `parameters()`는 한 번 돌면 끝난다. 여러 번 쓰려면 `list(net.parameters())`.
- 모델 요약은 `torchinfo.summary`가 더 자세하다. → [[torchinfo·torchsummary]]

## 수식·원리
```
Net
 ├─ l1.weight (128, 784)   ← parameters()에 포함
 ├─ l1.bias   (128,)
 ├─ bn.weight / bn.bias    ← γ, β
 └─ bn.running_mean        ← buffer (포함 안 됨)
```

## 코드 예시
```python
import torch.nn as nn

net = nn.Sequential(nn.Linear(2, 3), nn.BatchNorm1d(3), nn.Linear(3, 1))
for name, p in net.named_parameters():
    print(name, tuple(p.shape))
# 0.weight (3, 2) / 0.bias (3,) / 1.weight (3,) / 1.bias (3,) / 2.weight (1, 3) / 2.bias (1,)

print(sum(p.numel() for p in net.parameters()))     # 19
print([n for n, _ in net.named_buffers()][:2])      # ['1.running_mean', '1.running_var']
print(net[1].weight.data, net[1].bias.data)          # γ=1, β=0

weights = [p for n, p in net.named_parameters() if "weight" in n]
print(len(weights))                                 # 3
```

## 관련 개념
[[nn.Module]] · [[torch.optim 사용법]] · [[L1 규제(Lasso)]] · [[Batch Normalization]] · [[레이어 동결]]
