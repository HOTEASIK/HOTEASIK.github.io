---
title: Bounding Box Regression
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, BoundingBox, AI응용]
---
# Bounding Box Regression

## 정의·핵심
- **정의**: 후보 박스(Proposal 또는 Anchor) **P**를 정답 박스(GT) **G**에 가깝게 **미세 조정**하도록, 좌표 자체가 아니라 **이동·크기 변화량(오프셋)** 을 예측하는 회귀 (응용 11차시 R-CNN)
- **왜 오프셋인가**: Selective Search 후보는 **"조금 어긋난(slightly wrong)" 박스** → 그 차이만 학습하면 쉬움, 그리고 **크기와 무관한(scale-invariant)** 값으로 정규화
- **파라미터화 (강의 "P와 G의 관계식")**
  - 중심 이동: `tx = (Gx − Px) / Pw`, `ty = (Gy − Py) / Ph` → **박스 크기로 나눠** 큰 박스·작은 박스를 같은 기준으로
  - 크기 변화: `tw = log(Gw / Pw)`, `th = log(Gh / Ph)` → **로그 스케일**로 배율을 표현 (항상 양수인 w·h 보장, 대칭)
  - 모델은 `d(P) = (dx, dy, dw, dh)`를 예측 → 디코딩: `Ĝx = Pw·dx + Px`, `Ĝw = Pw·exp(dw)`
- **손실 (강의)**: R-CNN은 **L2 손실 + L2 정규화(ridge)**, 클래스별 선형 회귀 / Fast·Faster R-CNN·SSD는 **Smooth L1** / 최근은 **IoU 계열 손실**(GIoU·CIoU) → [[GIoU]], [[DIoU·CIoU]]
  - 강의 보충: L1 Norm = 원소 차의 절댓값 합, L2 Norm = 유클리드 거리 / 정규화는 가중치가 과도하게 커지는 것을 막아 일반화 ↑
- **R-CNN 세부**: IoU ≥ 0.6인 후보만 회귀 학습에 사용(너무 먼 후보는 선형으로 못 맞춤)
- YOLO v2+는 `σ(t) + 격자 좌표`(중심을 격자 안에 묶음), v8은 Anchor-Free로 **중심에서 네 변까지 거리(ltrb)** 를 예측 → [[DFL(Distribution Focal Loss)]]
- **분산 정규화**: torchvision은 오프셋에 weights `(10, 10, 5, 5)`를 곱해 학습 스케일을 맞춤

## 수식·원리
```
tx = (Gx − Px)/Pw,   ty = (Gy − Py)/Ph
tw = log(Gw/Pw),     th = log(Gh/Ph)
L = Σ_{i∈{x,y,w,h}} (t_i − d_i(P))² + λ||w||²     (R-CNN)
smoothL1(x) = 0.5x² (|x|<1),  |x| − 0.5 (그 외)
```

## 코드 예시
```python
import torch

def encode(P, G):                                       # 형식: (cx, cy, w, h)
    return torch.stack([(G[:, 0] - P[:, 0]) / P[:, 2], (G[:, 1] - P[:, 1]) / P[:, 3],
                        torch.log(G[:, 2] / P[:, 2]), torch.log(G[:, 3] / P[:, 3])], 1)
def decode(P, d):
    return torch.stack([P[:, 2] * d[:, 0] + P[:, 0], P[:, 3] * d[:, 1] + P[:, 1],
                        P[:, 2] * torch.exp(d[:, 2]), P[:, 3] * torch.exp(d[:, 3])], 1)

P = torch.tensor([[100., 100., 50., 40.], [300., 200., 200., 160.]])   # 작은·큰 후보
G = torch.tensor([[105., 102., 60., 40.], [320., 208., 240., 160.]])   # 같은 비율로 어긋난 GT
t = encode(P, G)
print([[round(v, 3) for v in r] for r in t.tolist()])                   # [[0.1, 0.05, 0.182, 0.0], [0.1, 0.05, 0.182, 0.0]]  두 행이 같음 → 크기 무관
print(torch.allclose(decode(P, t), G))                                  # True  인코딩·디코딩 왕복
print(torch.nn.functional.smooth_l1_loss(torch.zeros_like(t), t).item() > 0)   # True
```

## 관련 개념
[[Bounding Box]] · [[R-CNN]] · [[Anchor Box(Default Box)]] · [[IoU]] · [[SSD Loss]]
