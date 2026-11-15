---
title: Anchor-Based vs Anchor-Free
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, Anchor, AnchorFree, AI응용]
---
# Anchor-Based vs Anchor-Free

## 정의·핵심
- **Anchor-Based**: 특징 맵 위치마다 **미리 정한 크기·비율의 앵커 박스**를 깔고, 앵커 대비 **오프셋**과 클래스를 예측 (Faster R-CNN, SSD, YOLO v2~v5, RetinaNet) → [[Anchor Box(Default Box)]]
- **Anchor-Free**: 앵커 없이 **객체의 중심점(또는 각 특징 맵 위치)** 에서 **중심에서 네 변까지의 거리(l, t, r, b)** 나 크기를 **직접 예측** (FCOS, CenterNet, **YOLO v8**, YOLOX, v10) (응용 12차시)
- **Anchor-Based의 문제점 (강의)**: 사전 정의된 앵커 크기에 의존 → 최적 앵커를 찾기 위한 **K-means 등 추가 연산과 하이퍼파라미터 튜닝**이 필수
  - 앵커 수·크기·비율·IoU 임계값 등 설정이 많음, 데이터셋이 바뀌면 다시 조정
  - 위치당 여러 앵커 → 예측 수 ↑, 대부분 배경 → 불균형
- **Anchor-Free의 장점 (강의 "왜 중요한가?")**: **앵커 튜닝 비용 0**, **비정형 비율의 객체나 극소형 물체**에서 훨씬 유연, 구조·후처리 단순
  - 강의 비유: **지도 격자**("가장 가까운 칸을 찾아라") vs **GPS 좌표**("정확한 위도·경도 직송") / **기성복**(S·M·L 중 골라 수선) vs **맞춤복**(치수 재서 바로 제작)
- **Anchor-Free의 과제와 해결**
  - 한 위치가 어떤 GT를 맡을지(할당) 기준이 필요 → **Task-Aligned Assigner**(v8), center sampling(FCOS) → [[Task-Aligned Assignment]]
  - 박스 경계 모호성 → **DFL**로 거리를 분포로 예측 → [[DFL(Distribution Focal Loss)]]
  - 다중 스케일 할당 → FPN 레벨(stride)별로 담당 크기 분리

| | Anchor-Based | Anchor-Free |
|---|---|---|
| 예측 대상 | 앵커 대비 오프셋 (tx, ty, tw, th) | 점에서 네 변 거리 (l, t, r, b) |
| 위치당 예측 수 | k개 (3~9) | 1개 |
| 사전 설정 | 앵커 크기·비율 (K-means) | 없음 |
| 매칭 | IoU(앵커, GT) | 점이 GT 안 + 정렬 점수 |
| 예 | YOLO v5, SSD, Faster R-CNN | YOLO v8·v10, FCOS |

## 수식·원리
```
Anchor-Based:  x = ax + tx·aw,  w = aw·e^tw      (앵커 a 기준)
Anchor-Free:   x1 = px − l·s,  y1 = py − t·s,  x2 = px + r·s,  y2 = py + b·s   (점 p, stride s)
예측 수 (640, 3스케일):  Anchor 3개 → 25,200   /   Anchor-Free → 8,400
```

## 코드 예시
```python
import torch

strides = (8, 16, 32)
n_free = sum((640 // s) ** 2 for s in strides)
print(n_free, n_free * 3)                                   # 8400 25200  Anchor-Free vs 위치당 앵커 3개

s = 8                                                       # Anchor-Free 디코딩 (stride 8 맵의 한 점)
gx, gy = 12, 7
px, py = (gx + 0.5) * s, (gy + 0.5) * s
ltrb = torch.tensor([3.0, 2.0, 4.0, 5.0])                   # stride 단위 거리
box = torch.tensor([px - ltrb[0] * s, py - ltrb[1] * s, px + ltrb[2] * s, py + ltrb[3] * s])
print(box.tolist())                                         # [76.0, 44.0, 132.0, 100.0]

aw, ah, ax, ay = 40., 30., 100., 60.                        # Anchor-Based 디코딩
t = torch.tensor([0.1, -0.2, 0.3, 0.0])
print([round(v, 1) for v in [ax + t[0].item() * aw, ay + t[1].item() * ah, aw * torch.exp(t[2]).item(), ah * torch.exp(t[3]).item()]])   # [104.0, 54.0, 54.0, 30.0]
```

## 관련 개념
[[Anchor Box(Default Box)]] · [[YOLO v8]] · [[Task-Aligned Assignment]] · [[DFL(Distribution Focal Loss)]] · [[YOLO v5]]
