---
title: Backbone·Neck·Head 구조
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 아키텍처, AI응용]
---
# Backbone·Neck·Head 구조

## 정의·핵심
- 현대 객체 검출기(특히 YOLO v4 이후)는 **Backbone → Neck → Head** 세 부분으로 나눠 설계한다 (응용 12차시)
- **Backbone (특징 추출)**
  - 이미지에서 **계층적 특징 맵**을 뽑는 CNN — 보통 ImageNet 사전학습
  - 예: VGG-16(SSD), ResNet(Faster R-CNN), **CSPDarknet53**(YOLO v4·v5), C2f 기반 CSPDarknet(v8)
  - 깊어질수록 해상도 ↓, **의미(Semantic) 정보 ↑**, 위치(Spatial) 정보 ↓ → 강의: stride 8·16·32의 **P3·P4·P5**
- **Neck (특징 융합)**
  - 여러 해상도의 특징을 **섞어** 크기가 다른 객체 모두에 좋은 특징을 만듦
  - **FPN**(Top-down: 의미를 아래로) + **PAN**(Bottom-up: 위치를 위로) = **PAN-FPN** → [[FPN·PANet]]
  - SPP/SPPF(다양한 크기 풀링으로 수용 영역 확대)
  - 강의 비유: "**의미는 내리고, 위치는 올린다**"
- **Head (예측)**
  - 각 스케일의 특징 맵에서 **클래스·박스(·객체성)** 를 예측
  - **Coupled Head**(v3~v5): 분류·회귀가 같은 conv 공유 / **Decoupled Head**(v8): 분류·회귀 브랜치 분리 → 과제 충돌 해소 → [[YOLO v8]]
  - Anchor-Based(앵커별 오프셋) vs Anchor-Free(중심점·거리) → [[Anchor-Based vs Anchor-Free]]
- **Two-Stage 대응**: Backbone(+FPN) → **RPN**(후보) → **RoI Head**(분류·정제)
- **장점**: 모듈별 교체가 쉬움(백본만 가볍게 → 모바일), 연구·비교가 체계적

## 수식·원리
```
입력 640×640
Backbone: C3 (80×80, stride 8) → C4 (40×40, 16) → C5 (20×20, 32)
Neck:     P5 → 업샘플 + C4 → P4 → 업샘플 + C3 → P3  (FPN)
          P3 → 다운샘플 + P4 → … (PAN)
Head:     각 Pi에서 (cls, box) 예측 → 80² + 40² + 20² = 8400 위치
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TinyDetector(nn.Module):
    def __init__(self, nc=3):
        super().__init__()
        c = lambda i, o: nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.ReLU())
        self.b1, self.b2, self.b3 = nn.Sequential(c(3, 16), c(16, 32), c(32, 32)), c(32, 64), c(64, 128)   # Backbone
        self.l3, self.l4, self.l5 = nn.Conv2d(32, 64, 1), nn.Conv2d(64, 64, 1), nn.Conv2d(128, 64, 1)       # Neck(FPN)
        self.cls = nn.Conv2d(64, nc, 1)                            # Head (Decoupled)
        self.box = nn.Conv2d(64, 4, 1)
    def forward(self, x):
        c3 = self.b1(x); c4 = self.b2(c3); c5 = self.b3(c4)
        p5 = self.l5(c5)
        p4 = self.l4(c4) + F.interpolate(p5, scale_factor=2)      # 의미를 아래로
        p3 = self.l3(c3) + F.interpolate(p4, scale_factor=2)
        return [(self.cls(p), self.box(p)) for p in (p3, p4, p5)]

out = TinyDetector()(torch.randn(1, 3, 640, 640))
print([tuple(cl.shape[2:]) for cl, _ in out])                    # [(80, 80), (40, 40), (20, 20)]  stride 8·16·32
print(sum(cl.shape[2] * cl.shape[3] for cl, _ in out))           # 8400  예측 위치 수
```

## 관련 개념
[[FPN·PANet]] · [[CSP 구조]] · [[YOLO v8]] · [[Anchor-Based vs Anchor-Free]] · [[Feature Extractor·Classifier 구조]]
