---
title: Two-Stage vs One-Stage
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, TwoStage, OneStage, AI응용]
---
# Two-Stage vs One-Stage

## 정의·핵심
- 객체 검출의 두 가지 접근: **정확도 중심의 2단계 vs 속도 중심의 1단계** (응용 11·12차시)
- **Two-Stage Detector (정확도 우선)**
  - **Region Proposal과 Classification이 순차적으로** 이루어짐
    1. **영역 제안**: 객체가 있을 만한 후보 영역 생성 (Selective Search → RPN)
    2. **분류 및 회귀**: 각 후보를 분류하고 박스 위치를 정제
  - 대표: **R-CNN → Fast R-CNN → Faster R-CNN**, Mask R-CNN
  - 장점: **높은 정확도 (특히 소형 객체)** / 단점: **느린 속도 (실시간 어려움)**
  - 사용처: 의료 영상, 정밀 검사, 서버 분석
  - 강의 비유: **드라이브스루** — 주문 창구와 수령 창구가 분리 (정확하지만 이동 시간 소요)
- **One-Stage Detector (속도 우선)**
  - **단일 신경망이 이미지 전체를 한 번만(Once) 보며** 위치(Box)와 클래스(Class)를 **한 번의 Forward Pass**로 동시 예측
  - 대표: **YOLO 시리즈, SSD**, RetinaNet
  - 장점: **매우 빠른 속도 (실시간 처리 가능)** / 단점: 정확도 트레이드오프 (**과거 이슈** — 지금은 YOLO v8 등이 Two-Stage 수준)
  - 사용처: 자율주행, CCTV, 모바일 앱, 로봇
  - 강의 비유: **편의점 계산대** — 물건을 올리는 즉시 바코드를 찍어 결제 (한 번에 처리)
- **One-Stage가 정확도에서 불리했던 이유**: 후보 필터링 단계가 없어 **배경 박스가 압도적**(클래스 불균형) → RetinaNet의 **Focal Loss**, SSD의 **Hard Negative Mining**으로 해결 → [[RetinaNet(언급)]], [[Hard Negative Mining]]

| | Two-Stage | One-Stage |
|---|---|---|
| 구조 | 제안 → 분류·회귀 | 밀집 예측 한 번 |
| 속도 | 느림 (수 FPS) | 빠름 (수십~수백 FPS) |
| 정확도 | 높음 | 과거 낮음 → 현재 비슷 |
| 예 | Faster R-CNN | YOLO, SSD |

## 수식·원리
```
Two-Stage:  이미지 → Backbone → RPN(후보 ~300) → RoI Pooling → 분류·회귀
One-Stage:  이미지 → Backbone(+Neck) → Head(모든 위치에서 cls+box) → NMS
```

## 코드 예시
```python
import time
import torch
from torchvision.models.detection import fasterrcnn_mobilenet_v3_large_fpn, ssdlite320_mobilenet_v3_large

torch.manual_seed(0)
two = fasterrcnn_mobilenet_v3_large_fpn(weights=None, weights_backbone=None, num_classes=91).eval()
one = ssdlite320_mobilenet_v3_large(weights=None, weights_backbone=None, num_classes=91).eval()
x = [torch.rand(3, 320, 320)]
for name, m in (("Two-Stage(Faster R-CNN)", two), ("One-Stage(SSDLite)", one)):
    with torch.no_grad():
        m(x)                                                       # 워밍업
        t = time.perf_counter(); out = m(x); dt = time.perf_counter() - t
    print(name, sorted(out[0].keys()), dt > 0)                     # ['boxes', 'labels', 'scores'] True  둘 다 같은 형식
print(hasattr(two, "rpn"), hasattr(one, "rpn"))                    # True False  One-Stage는 RPN 없음
```

## 관련 개념
[[R-CNN]] · [[Faster R-CNN]] · [[YOLO v1]] · [[SSD]] · [[YOLO vs SSD]]
