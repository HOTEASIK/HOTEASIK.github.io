---
title: LogSoftmax
date: 2026-11-05 12:00:00 +0900
categories: [AI, 신경망 기초]
tags: [신경망기초, 활성화함수, 다중분류, AI개론]
---
# LogSoftmax

## 정의·핵심
- **정의**: Softmax 결과에 로그를 취한 것 `log(softmax(z))`. 출력은 **로그 확률**(항상 0 이하, 0에 가까울수록 확률 1)
- **왜 따로 있나 — 수치 안정성**: `softmax` 후 `log`를 따로 하면 아주 작은 확률이 0으로 반올림되어 `log(0) = −inf`가 된다. LogSoftmax는 **log-sum-exp 공식으로 한 번에** 계산해 안정적이다
  - `log_softmax(z)ᵢ = zᵢ − log Σⱼ e^(zⱼ)`
- **NLLLoss와 짝**: `nn.LogSoftmax(dim=1)` + `nn.NLLLoss()` = `nn.CrossEntropyLoss()` (개론 9차시)
  - NLLLoss는 정답 클래스의 로그 확률에 −를 붙여 평균낼 뿐이다 → [[NLLLoss]]
- **강의의 두 가지 모델 작성 패턴** (개론 9차시)
  - 패턴1: 모델은 **로짓만 출력** + 손실은 `CrossEntropyLoss` (일반적, 권장)
  - 패턴2: **모델 클래스 안에 LogSoftmax를 포함** + 손실은 `NLLLoss` — 출력이 바로 로그 확률이라 `exp()`하면 확률
  - 두 패턴을 섞으면(LogSoftmax 출력 + CrossEntropyLoss) Softmax가 두 번 적용되는 실수
- `dim=1`(클래스 축) 지정 필수

## 수식·원리
```
log_softmax(z)ᵢ = zᵢ − logsumexp(z)
CrossEntropy(z, y) = NLL(log_softmax(z), y) = −log_softmax(z)[y]
```

## 코드 예시
```python
import torch
import torch.nn as nn

z = torch.tensor([[2.0, 1.0, 0.1], [0.5, 2.5, 0.3]])
y = torch.tensor([0, 1])
ls = nn.LogSoftmax(dim=1)(z)
print(torch.allclose(ls, torch.log(torch.softmax(z, 1))))      # True
print(torch.allclose(ls.exp().sum(1), torch.ones(2)))          # True  exp하면 확률

ce = nn.CrossEntropyLoss()(z, y)
nll = nn.NLLLoss()(ls, y)
print(round(ce.item(), 4), round(nll.item(), 4))               # 0.3185 0.3185  같은 값

big = torch.tensor([[0.0, 200.0]])
print(torch.log(torch.softmax(big, 1))[0, 0].item())            # -inf  (따로 계산하면 터짐)
print(torch.log_softmax(big, 1)[0, 0].item())                   # -200.0
```

## 관련 개념
[[Softmax]] · [[NLLLoss]] · [[CrossEntropyLoss]] · [[log-sum-exp trick]] · [[다중분류]]
