---
title: Task-Aligned Assignment
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 라벨할당, YOLO, AI응용]
---
# Task-Aligned Assignment

## 정의·핵심
- **라벨 할당(Label Assignment)이란**: 학습 시 **어떤 예측(앵커·점)을 어떤 GT의 양성으로 볼지** 정하는 규칙. 검출 성능에 큰 영향 (예: Faster R-CNN·SSD는 IoU 임계값 고정 규칙)
- **Task-Aligned Assigner (TAL, TOOD 2021 → YOLO v8 채택)**: **분류 점수와 위치 정확도(IoU)를 곱한 정렬 점수**로 **가장 좋은 후보를 동적으로** 선택 (응용 12차시)
- **정렬 점수 (Alignment Metric, 강의)**: `t = s^α × u^β`
  - **s**: 그 예측의 GT 클래스 **분류 점수**
  - **u**: 예측 박스와 GT의 **IoU** (위치 정확도)
  - **α, β**: 가중치 — **보통 α = 0.5, β = 6.0** (위치 정확도를 강하게 반영)
- **할당 절차**
  1. 후보: 앵커 점이 **GT 박스 안에** 있는 것만
  2. 각 후보의 정렬 점수 t 계산
  3. GT마다 **t 상위 k개(top-k, v8 기본 10)** 를 양성으로
  4. 한 예측이 여러 GT에 걸리면 **IoU가 가장 큰 GT**에 배정
  5. 분류 타깃을 1이 아니라 **정규화된 t**(최대 IoU로 스케일)로 사용 → "분류 점수가 높은 박스는 위치도 정확해야" 학습됨
- **왜 필요한가 (강의 "무엇(Class)과 어디(Box)의 정합성")**: 분류 점수는 높은데 박스가 부정확하거나 그 반대인 **불일치(misalignment)** 가 있으면 NMS가 **위치가 나쁜 박스를 남김** → 두 과제가 같은 예측을 좋게 보도록 정렬
- **고정 규칙과 비교**: IoU 임계값 규칙은 학습 전에 정해지고 모델 예측과 무관 / TAL은 **학습 중 모델의 현재 예측을 반영**해 매 반복 바뀜 (동적 할당)
- 관련: YOLO v10의 Dual Assignment도 같은 형태의 매칭 점수 사용 → [[YOLO v10]]

## 수식·원리
```
t = s^α · u^β      (α = 0.5, β = 6.0)
양성 = GT마다 top-k(t) ∩ {점이 GT 내부}
분류 타깃 = t / max(t) · max(IoU)   (GT별 정규화)
```

## 코드 예시
```python
import torch

s = torch.tensor([0.9, 0.8, 0.3, 0.7, 0.2])            # 후보 5개의 GT 클래스 점수
u = torch.tensor([0.5, 0.85, 0.9, 0.8, 0.95])          # 후보 박스와 GT의 IoU
inside = torch.tensor([True, True, True, True, False]) # 앵커 점이 GT 안에 있는가
t = s ** 0.5 * u ** 6.0
t = t * inside
print([round(v, 3) for v in t.tolist()])               # [0.015, 0.337, 0.291, 0.219, 0.0]  정렬 점수
topk = t.topk(2).indices
print(sorted(topk.tolist()))                           # [1, 2]  IoU가 높은 후보가 우선 (β=6)
print(s.argmax().item(), u.argmax().item())            # 0 4  점수만/IoU만 보면 다른 후보를 고름
target = t / t.max() * u[topk].max()
print([round(v, 3) for v in target[topk].tolist()])    # [0.9, 0.777]  분류 타깃 (정규화된 t)
```

## 관련 개념
[[YOLO v8]] · [[Anchor-Based vs Anchor-Free]] · [[YOLO v10]] · [[IoU]] · [[Default Box Matching]]
