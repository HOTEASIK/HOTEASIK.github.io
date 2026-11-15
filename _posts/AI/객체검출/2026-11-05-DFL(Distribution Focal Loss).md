---
title: DFL(Distribution Focal Loss)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 손실함수, YOLO, AI응용]
---
# DFL(Distribution Focal Loss)

## 정의·핵심
- **정의**: DFL (Distribution Focal Loss, GFL 2020). 박스 경계까지의 거리를 **하나의 값(회귀)** 이 아니라 **이산 구간 위의 확률 분포**로 예측하고, 정답 거리 **양옆 두 구간**에 확률이 몰리도록 학습하는 손실 (YOLO v8 Box Loss = CIoU + **DFL**, 응용 12차시 비교표)
- **왜 분포로 예측하나**
  - 경계가 **모호한 경우**(가려짐, 흐림, 그림자)에 하나의 값(디랙 델타)은 불확실성을 표현 못 함
  - 분포로 예측하면 **기댓값 = 거리**, 분포의 퍼짐 = **불확실성**
- **YOLO v8 구현**
  - Anchor-Free로 점에서 네 변까지 거리 (l, t, r, b) 예측 → 각 거리를 **reg_max = 16개 구간(0 ~ 15, stride 단위)** 의 softmax 분포로 → [[Anchor-Based vs Anchor-Free]]
  - 박스 헤드 출력 채널 = **4 × reg_max = 64**
  - 디코딩: `거리 = Σ_i i · softmax(logits)_i` (기댓값, `DFL` 모듈이 1×1 conv로 구현)
- **손실**: 정답 거리 y가 정수 구간 `y_i ≤ y < y_{i+1}` 사이에 있으면
  - `DFL = −[(y_{i+1} − y)·log S_i + (y − y_i)·log S_{i+1}]`
  - → **가까운 쪽 구간에 더 큰 가중치**로 두 구간의 확률을 높임 (선형 보간 타깃의 CE)
- **CIoU와 함께**: CIoU는 박스 전체의 겹침·중심·비율 / DFL은 각 변 거리의 분포를 날카롭게 → 위치 정밀도 ↑
- 이름의 "Focal": 타깃 근처에 확률을 **집중(focus)** 시킨다는 의미

## 수식·원리
```
ŷ = Σ_{i=0}^{n−1} i · S_i,   S = softmax(logits)   (n = reg_max = 16)
DFL(S_i, S_{i+1}) = −((y_{i+1} − y) log S_i + (y − y_i) log S_{i+1})
y = 5.3 → 구간 5에 가중 0.7, 구간 6에 가중 0.3
```

## 코드 예시
```python
import torch
import torch.nn.functional as F

reg_max = 16
def dfl_loss(logits, y):                                    # logits (N, 16), y (N,) 실수 거리
    yl = y.floor().long(); yr = yl + 1
    wl, wr = yr.float() - y, y - yl.float()
    return (F.cross_entropy(logits, yl, reduction="none") * wl +
            F.cross_entropy(logits, yr, reduction="none") * wr).mean()

y = torch.tensor([5.3])
logits = torch.zeros(1, reg_max, requires_grad=True)
opt = torch.optim.SGD([logits], lr=1.0)
for _ in range(200):
    opt.zero_grad(); dfl_loss(logits, y).backward(); opt.step()
p = logits.softmax(1)[0]
print([round(v, 2) for v in p[4:8].tolist()])               # [0.0, 0.7, 0.3, 0.0]  구간 5·6에 확률 집중
print(round((p * torch.arange(reg_max)).sum().item(), 2))   # 5.32  기댓값 ≈ 5.3
print(4 * reg_max)                                          # 64  박스 헤드 출력 채널
```

## 관련 개념
[[YOLO v8]] · [[Anchor-Based vs Anchor-Free]] · [[DIoU·CIoU]] · [[Task-Aligned Assignment]] · [[CrossEntropyLoss]]
