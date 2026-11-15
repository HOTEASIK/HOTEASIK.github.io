---
title: He(Kaiming) 초기화
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 가중치초기화, AI개론]
---
# He(Kaiming) 초기화

## 정의·핵심
- **정의**: **ReLU 계열**에 맞춘 가중치 초기화. 분산을 `2 / fan_in`으로 설정한다 (Kaiming He, 2015 — ResNet 저자)
- **왜 2배인가**: ReLU는 음수 절반을 0으로 만들어 **출력 분산이 절반**이 된다. Xavier(≈1/fan_in)를 쓰면 층마다 분산이 반으로 줄어 깊은 망에서 신호가 사라진다 → **2를 곱해 보상**
- **PyTorch**
  - `nn.init.kaiming_normal_(w, mode='fan_in', nonlinearity='relu')`: N(0, 2/fan_in)
  - `nn.init.kaiming_uniform_(w, nonlinearity='relu')`
  - `mode='fan_out'`: 역전파 기울기 분산 보존 쪽 (torchvision ResNet의 Conv 초기화가 `fan_out`)
  - Leaky ReLU는 `nonlinearity='leaky_relu', a=기울기`
- **Conv의 fan_in** = 입력 채널 × 커널 높이 × 커널 너비
- **BN과 함께 쓰면**: BatchNorm이 층마다 분포를 다시 맞춰 주므로 초기화에 덜 민감해진다. 그래도 He 초기화가 표준
- 편향은 보통 **0으로** 초기화

## 수식·원리
```
Var(W) = 2 / fan_in                 (ReLU)
Var(W) = 2 / ((1 + a²)·fan_in)      (Leaky ReLU, 기울기 a)
Conv2d: fan_in = C_in × k_h × k_w
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
def depth_std(init, layers=30, n=256):
    x = torch.randn(1000, n)
    for _ in range(layers):
        lin = nn.Linear(n, n, bias=False); init(lin.weight)
        x = torch.relu(lin(x))
    return x.std().item()

print(depth_std(nn.init.xavier_normal_) < 1e-3)                                   # True   ReLU+Xavier: 신호가 점점 소멸
print(0.3 < depth_std(lambda w: nn.init.kaiming_normal_(w, nonlinearity="relu")) < 3)   # True  유지

conv = nn.Conv2d(64, 128, 3)
nn.init.kaiming_normal_(conv.weight, mode="fan_out", nonlinearity="relu"); nn.init.zeros_(conv.bias)
print(round(conv.weight.var().item() * 128 * 9, 1))                               # 2.0  (Var × fan_out)
```

## 관련 개념
[[Xavier(Glorot) 초기화]] · [[ReLU]] · [[nn.init]] · [[ResNet]] · [[Batch Normalization]]
