---
title: Multi-scale Feature Map
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, SSD, 다중스케일, AI응용]
---
# Multi-scale Feature Map

## 정의·핵심
- **정의**: 네트워크의 **여러 깊이(해상도)의 특징 맵에서 각각 검출**을 수행해, 크기가 다양한 객체를 모두 커버하는 구조. SSD의 핵심 (응용 13차시 "왜 Multi-scale인가?")
- **해결하는 문제 — Scale-Variance (강의)**
  - **단일 해상도(특히 저해상도)만 사용하면 작은 객체 정보가 소실**됨 (YOLO v1은 마지막 7×7 하나만 사용 → 작은 물체에 취약)
  - SSD는 **다중 해상도 피라미드**로 **검출 누락과 오탐(FP)을 동시에** 줄임
- **해상도와 객체 크기의 관계 (강의)**
  - **작은 객체 → 고해상도 맵 (Conv4_3, 38×38)**: 초기 레이어라 **세밀한 위치 정보 보존**, 작은 Receptive Field로 좁은 영역의 디테일 포착
  - **중간 객체 → Conv7 (19×19)**
  - **큰 객체 → 저해상도 맵 (Conv10_2 3×3, Conv11_2 1×1)**: 풀링 등을 거쳐 추상화 수준 ↑, **넓은 Receptive Field**로 전역 컨텍스트 포착
  - 핵심 원리: "**각 해상도에 맞는 크기의 객체를 전담**하여 검출함으로써 정확도 극대화" → **Scale Invariance(크기 불변성)** 확보
- **박스 분포 (강의)**: 전체 8,732개 중 **약 66%(5,776개)가 Conv4_3**에서 생성 — 작은 객체를 놓치지 않으려고 **고해상도 맵에 앵커를 집중**시킨 설계 의도
- **SSD vs FPN**
  - SSD: 백본의 각 층 특징을 **그대로** 사용 → 얕은 층(Conv4_3)은 **의미 정보가 약함** → 작은 객체 성능 한계
  - FPN: 깊은 층의 의미를 **top-down으로 얕은 층에 더해** 보강 → YOLO v3+·RetinaNet → [[FPN·PANet]]
- 관련: 이미지 피라미드(입력을 여러 크기로) vs **특징 피라미드**(한 번의 forward로 여러 해상도) — 후자가 훨씬 빠름

## 수식·원리
```
SSD300 맵 해상도: 38 → 19 → 10 → 5 → 3 → 1
셀 하나가 덮는 원본 크기 ≈ 300 / 해상도:  7.9, 15.8, 30, 60, 100, 300 px
Conv4_3 박스 비율 = 5776 / 8732 ≈ 66%
```

## 코드 예시
```python
import torch
import torch.nn as nn

layers, x = [], torch.randn(1, 64, 38, 38)                # Conv4_3 위치부터
chs = [64, 128, 128, 128, 128, 128]
feats = [x]
for i in range(5):                                        # 해상도를 줄이며 맵 추가
    conv = nn.Conv2d(chs[i], chs[i + 1], 3, stride=2, padding=1 if x.shape[-1] > 3 else 0)
    x = conv(x); feats.append(x)
print([f.shape[-1] for f in feats])                       # [38, 19, 10, 5, 3, 1]

k = [4, 6, 6, 6, 4, 4]
counts = [f.shape[-1] ** 2 * kk for f, kk in zip(feats, k)]
print(counts, sum(counts))                                # [5776, 2166, 600, 150, 36, 4] 8732
print(round(counts[0] / sum(counts) * 100, 1))            # 66.1  % — 고해상도 맵에 집중
print([round(300 / f.shape[-1], 1) for f in feats])       # [7.9, 15.8, 30.0, 60.0, 100.0, 300.0]  셀 하나가 덮는 원본 px
```

## 관련 개념
[[SSD]] · [[FPN·PANet]] · [[Default Box 스케일·종횡비]] · [[수용 영역(Receptive Field)]] · [[YOLO vs SSD]]
