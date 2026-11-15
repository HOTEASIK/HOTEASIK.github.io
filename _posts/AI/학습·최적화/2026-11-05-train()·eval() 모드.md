---
title: train()·eval() 모드
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, PyTorch, AI개론]
---
# train()·eval() 모드

## 정의·핵심
- **정의**: `nn.Module`의 동작 모드 전환. `model.train()`은 학습 모드, `model.eval()`은 평가(추론) 모드. 내부적으로 모든 하위 모듈의 `self.training` 플래그를 True/False로 바꾼다
- **모드에 따라 동작이 달라지는 층은 두 가지**

| 층 | train() | eval() |
|---|---|---|
| **Dropout** | 무작위로 p 비율을 0, 나머지 1/(1−p)배 | **아무것도 안 함** (입력 = 출력) |
| **BatchNorm** | **현재 배치**의 평균·분산으로 정규화, running 통계 갱신 | 저장된 **running_mean·running_var** 사용, 갱신 안 함 |

  - Linear·Conv·ReLU 등 나머지 층은 모드와 무관
- **eval()을 잊으면**: 같은 이미지를 넣어도 예측이 매번 달라지고(Dropout), 배치 구성에 따라 결과가 바뀌며(BN), 검증 정확도가 낮게 나온다. 한 장씩 추론하면 BN 통계가 망가진다
- **eval()과 no_grad()는 다르다**
  - `eval()`: 층의 **동작 방식**을 바꿈. 기울기 계산은 그대로 한다
  - `torch.no_grad()`: **기울기 기록**을 끔 (메모리·속도). 층 동작은 그대로
  - → 검증·추론 때는 **둘 다** 쓴다: `model.eval()` + `with torch.no_grad():` → [[torch.no_grad]]
- **학습 루프 패턴**: 에폭마다 훈련 전에 `model.train()`, 검증 전에 `model.eval()` — 검증 후 다시 train()으로 돌려놓는 것을 잊지 않도록 루프 맨 앞에 둔다
- 전이학습에서 BN 통계를 고정하고 싶으면 BN 층만 eval()로 두는 방법도 있다

## 수식·원리
```
for epoch:
    model.train();  for batch in train_loader: ... backward, step
    model.eval();   with torch.no_grad(): for batch in val_loader: ... 평가
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
model = nn.Sequential(nn.Linear(4, 8), nn.BatchNorm1d(8), nn.ReLU(), nn.Dropout(0.5), nn.Linear(8, 2))
x = torch.randn(16, 4)
model(x)                                              # train 모드에서 running 통계 쌓기

model.train()
print(torch.equal(model(x[:4]), model(x[:4])))       # False  Dropout 때문에 매번 다름
model.eval()
with torch.no_grad():
    a, b = model(x[:4]), model(x[:4])
    one = model(x[:1])
print(torch.equal(a, b), torch.allclose(one, a[:1]))  # True True  일정하고 배치와 무관
print(model.training, model[3].training)              # False False
```

## 관련 개념
[[Dropout]] · [[Batch Normalization]] · [[torch.no_grad]] · [[학습 루프 4단계]] · [[nn.Module]]
