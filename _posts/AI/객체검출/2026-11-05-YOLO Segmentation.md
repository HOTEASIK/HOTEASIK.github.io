---
title: YOLO Segmentation
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 세그멘테이션, YOLO, ultralytics, AI응용]
---
# YOLO Segmentation

## 정의·핵심
- **정의**: YOLO 검출기에 **마스크 브랜치**를 추가해 **One-Stage로 Instance Segmentation**을 수행하는 모델 (`yolov8n-seg.pt`, `yolo11n-seg.pt`) (응용 12차시 실습 "YOLO_segmentation")
- **Detection vs Segmentation 출력 (강의, YOLO v11n-seg)**
  1. **바운딩 박스**: `(x1, y1, x2, y2, conf, class)` — 검출과 동일
  2. **마스크**: 객체마다 **(0, 1) 픽셀 단위** 이진 마스크
- **구조 (YOLACT 방식)**
  - **Proto 브랜치**: P3 특징에서 **프로토타입 마스크 32장** (`32 × 160 × 160`, 입력 640의 1/4)
  - **검출 헤드**: 박스·클래스와 함께 객체마다 **마스크 계수 32개** 예측
  - **객체 마스크 = sigmoid(계수 · 프로토타입)** → 박스 영역으로 crop → 원본 크기로 업샘플 → 0.5 기준 이진화
  - 객체 수와 무관하게 프로토타입을 공유 → **빠름** (Mask R-CNN처럼 RoI마다 FCN을 돌리지 않음)
- **ultralytics 사용**
  ```
  model = YOLO("yolo11n-seg.pt")
  r = model.predict("img.jpg", conf=0.4)[0]
  r.boxes.xyxy      # (N, 4) 박스
  r.masks.data      # (N, H', W') 0/1 마스크 (모델 입력 해상도)
  r.masks.xy        # 객체별 폴리곤 (원본 픽셀 좌표)
  ```
  - 학습 라벨: YOLO-seg txt `class x1 y1 x2 y2 … xn yn` (정규화 폴리곤)
  - 손실: box(CIoU) + cls + dfl + **seg**(마스크 BCE)
  - 평가: `metrics.box.map`, **`metrics.seg.map`**(mask mAP)
- **활용**: 실시간 분할(로봇, 드론, 영상 편집), 객체 넓이·윤곽 측정 / 정확도가 더 중요하면 Mask R-CNN·SAM → [[Mask R-CNN(언급)]]

## 수식·원리
```
P ∈ R^{k×h×w} (k = 32 프로토타입),  c_i ∈ R^k (객체 i의 계수)
M_i = σ(c_i^T · P) → crop(box_i) → upsample → (M_i > 0.5)
L = L_box + L_cls + L_dfl + L_seg(BCE)
```

## 코드 예시
```python
import torch
import torch.nn.functional as F

torch.manual_seed(0)
k, h, w = 32, 160, 160
proto = torch.randn(k, h, w)                              # Proto 브랜치 출력
coef = torch.randn(3, k)                                  # 객체 3개의 마스크 계수
boxes = torch.tensor([[40., 40., 200., 300.], [300., 100., 500., 400.], [0., 0., 640., 640.]])   # 640 기준 xyxy

masks = torch.sigmoid(coef @ proto.view(k, -1)).view(-1, h, w)   # 선형 결합
ys = torch.arange(h)[None, :, None] * 4; xs = torch.arange(w)[None, None, :] * 4
inside = (xs >= boxes[:, 0, None, None]) & (xs < boxes[:, 2, None, None]) & \
         (ys >= boxes[:, 1, None, None]) & (ys < boxes[:, 3, None, None])
masks = masks * inside                                    # 박스 밖 제거 (crop)
masks = F.interpolate(masks[None], size=(640, 640), mode="bilinear")[0] > 0.5
print(tuple(masks.shape), masks.dtype)                    # (3, 640, 640) torch.bool  객체별 0/1 마스크
print(bool(masks[0, :, 210:].any()))                      # False  박스 밖은 항상 0
print(k * h * w + 3 * k)                                  # 819296  프로토타입 공유 → 객체당 추가 비용은 계수 32개
```

## 관련 개념
[[Instance Segmentation]] · [[Mask R-CNN(언급)]] · [[YOLO v11(실습)]] · [[YOLO v8]] · [[Dice 계수(의료영상)]]
