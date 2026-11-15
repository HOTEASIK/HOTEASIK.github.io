---
title: Temperature Scaling
date: 2026-11-05 12:00:00 +0900
categories: [AI, 지도학습·평가]
tags: [지도학습평가, 확률보정, AI개론]
---
# Temperature Scaling

## 정의·핵심
- **정의**: 온도 스케일링. Softmax에 넣기 전 **로짓을 온도 T로 나눠** 확률 분포의 날카로움을 조정하는 확률 보정 방법 (개론 10차시)
- **T의 효과 (강의)**
  - **T = 1**: 원래 확률 (변화 없음)
  - **T > 1**: 확률 분포가 **평평해짐** (덜 확신) → 과신 모델 보정에 사용
  - **T < 1**: 확률 분포가 **날카로워짐** (더 확신)
- **장점 (강의)**: 간단하고 효과적, **단일 파라미터**만 조정, **모델 재학습 불필요**
- **정확도는 바뀌지 않는다**: 모든 로짓을 같은 양수로 나누므로 **순위(argmax)가 그대로** → 정확도·AUC 불변, 확률값만 바뀜
- **T 찾는 법**
  1. 학습을 마친 모델의 **검증 데이터 로짓**을 모은다 (모델 가중치는 고정)
  2. T 하나만 학습 파라미터로 두고 검증 데이터의 **NLL(CrossEntropy)을 최소화** (LBFGS 또는 Adam)
  3. 추론 시 `softmax(logits / T)`
  - T는 양수여야 하므로 `log T`를 학습하기도 한다
- **같은 아이디어의 다른 쓰임**
  - **지식 증류**: 교사 모델의 확률을 T>1로 부드럽게 만들어 클래스 간 관계 정보를 전달
  - **생성 모델 샘플링**: LLM의 `temperature` — 낮으면 일관된 답, 높으면 다양하고 창의적인 답

## 수식·원리
```
pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)
T* = argmin_T  Σ_val −log softmax(z / T)[y]
argmax(z / T) = argmax(z)   (T > 0)
```

## 코드 예시
```python
import torch
import torch.nn as nn

z = torch.tensor([[3.0, 1.0, 0.2]])
for T in (0.5, 1.0, 2.0):
    print(T, [round(v, 3) for v in torch.softmax(z / T, 1)[0].tolist()])
# 0.5 [0.978, 0.018, 0.004]   날카로움
# 1.0 [0.836, 0.113, 0.051]
# 2.0 [0.619, 0.228, 0.153]   평평함

torch.manual_seed(0)                                    # 과신한 가짜 검증 로짓: 정답률 70%인데 로짓이 큼
y = torch.randint(0, 3, (500,))
logits = torch.randn(500, 3)
right = torch.rand(500) < 0.7
logits[right, y[right]] += 8.0
logits[~right, (y[~right] + 1) % 3] += 8.0
logT = torch.zeros(1, requires_grad=True)
opt = torch.optim.LBFGS([logT], lr=0.1, max_iter=100)
def closure():
    opt.zero_grad(); loss = nn.CrossEntropyLoss()(logits / logT.exp(), y); loss.backward(); return loss
opt.step(closure)
T = logT.exp().item()
print(T > 1)                                                         # True  과신 → T>1로 평평하게
print(torch.equal(logits.argmax(1), (logits / T).argmax(1)))        # True  정확도는 그대로
```

## 관련 개념
[[Calibration]] · [[Softmax]] · [[로짓(Logit)]] · [[Label Smoothing]] · [[CrossEntropyLoss]]
