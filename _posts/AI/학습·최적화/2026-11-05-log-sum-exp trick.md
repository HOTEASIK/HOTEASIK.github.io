---
title: log-sum-exp trick
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 수치안정성, AI개론]
---
# log-sum-exp trick

## 정의·핵심
- **문제 — 오버플로우·언더플로우**: Softmax·CE는 `log(Σ e^zᵢ)`를 계산한다. float32는 약 3.4e38까지만 표현 가능
  - **오버플로우**: `e^89` 이상이면 `inf` → `inf/inf = nan`
  - **언더플로우**: `e^(−104)` 이하면 0 → `log(0) = −inf`
- **트릭**: 가장 큰 값 m = max(z)를 **빼고 계산한 뒤 다시 더한다**
  - `log Σ e^zᵢ = m + log Σ e^(zᵢ − m)`
  - 빼고 나면 지수의 최댓값이 `e^0 = 1`이라 오버플로우가 없고, 합이 최소 1이라 `log(0)`도 없다
  - 수학적으로 값은 **완전히 같다** (e^m을 밖으로 꺼낸 것뿐)
- **PyTorch 안에서 이미 쓰인다**: `torch.logsumexp`, `torch.log_softmax`, `nn.CrossEntropyLoss`, `nn.BCEWithLogitsLoss` → 그래서 **로짓을 그대로 손실함수에 넣는 것**이 안전하다
- **Softmax도 같은 원리**: `softmax(z) = softmax(z − max z)`
- 직접 확률을 계산해서 log를 취하는 코드(`torch.log(torch.softmax(z))`)는 이 보호를 받지 못한다 → `log_softmax` 사용

## 수식·원리
```
LSE(z) = log Σᵢ e^(zᵢ) = m + log Σᵢ e^(zᵢ − m),   m = maxᵢ zᵢ
log_softmax(z)ᵢ = zᵢ − LSE(z)
```

## 코드 예시
```python
import torch

z = torch.tensor([1000.0, 1001.0, 1002.0])
print(torch.log(torch.exp(z).sum()).item())                    # inf   ← 오버플로우
m = z.max()
print(round((m + torch.log(torch.exp(z - m).sum())).item(), 4))   # 1002.4076
print(round(torch.logsumexp(z, 0).item(), 4))                   # 1002.4076

small = torch.tensor([-1000.0, 0.0])
print(torch.log(torch.softmax(small, 0))[0].item())             # -inf  ← 언더플로우
print(torch.log_softmax(small, 0)[0].item())                    # -1000.0
```

## 관련 개념
[[로짓(Logit)]] · [[Softmax]] · [[LogSoftmax]] · [[BCEWithLogitsLoss]] · [[CrossEntropyLoss]] · [[부동소수점]]
