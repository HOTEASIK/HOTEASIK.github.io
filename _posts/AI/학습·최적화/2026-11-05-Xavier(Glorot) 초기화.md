---
title: Xavier(Glorot) 초기화
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 가중치초기화, AI개론]
---
# Xavier(Glorot) 초기화

## 정의·핵심
- **왜 초기화가 중요한가**: 가중치를 너무 작게 시작하면 층을 지날수록 신호가 0으로 줄고(기울기 소실), 너무 크게 시작하면 폭발하거나 Sigmoid·Tanh가 포화된다. **모두 같은 값(0)** 으로 시작하면 모든 뉴런이 똑같이 학습되어(대칭) 뉴런이 여러 개인 의미가 없다
- **Xavier 초기화**: 각 층의 **출력 분산이 입력 분산과 같도록**(순전파), 그리고 기울기 분산도 유지되도록(역전파) 가중치 분산을 `2 / (fan_in + fan_out)`로 맞춘다 (Glorot & Bengio, 2010)
  - fan_in: 입력 뉴런 수, fan_out: 출력 뉴런 수
- **어울리는 활성화**: **Sigmoid, Tanh**처럼 0 근처에서 거의 선형이고 대칭인 함수. ReLU에는 분산이 절반이 되므로 He 초기화가 맞다 → [[He(Kaiming) 초기화]]
- **PyTorch**
  - `nn.init.xavier_uniform_(w)`: U(−a, a), a = √(6/(fan_in+fan_out))
  - `nn.init.xavier_normal_(w)`: N(0, 2/(fan_in+fan_out))
  - `gain` 인자로 활성화별 보정 (`nn.init.calculate_gain('tanh')` = 5/3)
- 참고: PyTorch `nn.Linear`의 기본 초기화는 Kaiming uniform 변형(a=√5)이다 → 직접 바꾸려면 [[nn.init]]
- 6차시 "좋은 손실 곡면 만드는 방법"의 하나: "적절한 초기화: He/Xavier 초기화"

## 수식·원리
```
Var(W) = 2 / (fan_in + fan_out)
uniform: W ~ U(−√(6/(fan_in+fan_out)), +√(6/(fan_in+fan_out)))
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
def depth_std(init, act, layers=20, n=256):
    x = torch.randn(1000, n)
    for _ in range(layers):
        lin = nn.Linear(n, n, bias=False); init(lin.weight)
        x = act(lin(x))
    return x.std().item()

print(round(depth_std(lambda w: nn.init.normal_(w, std=0.01), torch.tanh), 6))   # 0.0  ← 너무 작음, 신호 소멸
print(round(depth_std(nn.init.xavier_normal_, torch.tanh), 2) > 0.1)             # True  신호 유지
w = torch.empty(300, 100); nn.init.xavier_uniform_(w)
print(round(w.var().item(), 4), round(2 / 400, 4))                               # 0.005 0.005
```

## 관련 개념
[[He(Kaiming) 초기화]] · [[Orthogonal 초기화]] · [[nn.init]] · [[기울기 소실(Vanishing Gradient)]] · [[Tanh]]
