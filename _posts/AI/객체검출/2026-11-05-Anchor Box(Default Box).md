---
title: Anchor Box(Default Box)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, Anchor, AI응용]
---
# Anchor Box(Default Box)

## 정의·핵심
- **정의**: 검출 객체의 **너비·높이 초기값으로 미리 정해 둔 박스 형태** (응용 11차시 Faster R-CNN). 특징 맵의 **각 위치마다 여러 크기·비율의 앵커**를 깔아 두고, 모델은 앵커를 기준으로 **오프셋(회귀)** 과 **객체 여부/클래스(분류)** 를 예측
  - SSD에서는 같은 개념을 **Default Box**라 부름 → [[Default Box 스케일·종횡비]]
- **Faster R-CNN의 앵커 (강의)**: 특징 맵의 각 위치에 **3 스케일(128², 256², 512²) × 3 비율(1:1, 1:2, 2:1) = 9개** 앵커
  - RPN 출력: 위치마다 **2k 점수**(객체/배경) + **4k 좌표**(k = 9) → [[Faster R-CNN]]
  - "Feature map에 대한 Anchor box 매핑": 특징 맵 한 칸 = 원본의 stride(16)px 간격 → 그 중심에 앵커 배치
- **학습 시 매칭**: GT와 **IoU ≥ 0.7 → 양성**, **< 0.3 → 음성**, 사이는 무시 (각 GT에 IoU 최대 앵커도 양성) → [[IoU]], [[Default Box Matching]]
- **YOLO의 앵커**: v2부터 도입, **데이터셋 GT 박스를 K-means 클러스터링**해 앵커 크기 결정(거리 = 1 − IoU), v5는 **Auto Anchor**로 자동 산출 → [[YOLO v5]]
- **장점**: 다양한 형태의 객체를 위치마다 여러 후보로 커버, 회귀가 "작은 수정"이 되어 학습 안정
- **단점 (강의 v8)**: 앵커 크기·비율·개수 등 **하이퍼파라미터 튜닝 필요**, 데이터셋에 의존, 대부분이 배경 앵커(불균형), 매칭 연산 비용 → **Anchor-Free**(v8)로 전환 → [[Anchor-Based vs Anchor-Free]]

## 수식·원리
```
스케일 s, 비율 r(= h/w)일 때:  w = s/√r,  h = s·√r   (넓이 s² 유지)
앵커 수 = H_f × W_f × k
Faster R-CNN: k = 3 스케일 × 3 비율 = 9
K-means 거리: d(box, centroid) = 1 − IoU(box, centroid)
```

## 코드 예시
```python
import torch

def make_anchors(fh, fw, stride, scales=(128, 256, 512), ratios=(0.5, 1.0, 2.0)):
    base = torch.tensor([[-s / r ** 0.5 / 2, -s * r ** 0.5 / 2, s / r ** 0.5 / 2, s * r ** 0.5 / 2]
                         for s in scales for r in ratios])                       # (9, 4) 원점 기준 xyxy
    ys, xs = torch.meshgrid(torch.arange(fh), torch.arange(fw), indexing="ij")
    ctr = torch.stack([xs, ys, xs, ys], -1).reshape(-1, 1, 4).float() * stride + stride / 2
    return (ctr + base).reshape(-1, 4)

A = make_anchors(38, 50, 16)                                  # 600x800 이미지, stride 16
print(A.shape)                                                # torch.Size([17100, 4])  = 38·50·9
w, h = A[:9, 2] - A[:9, 0], A[:9, 3] - A[:9, 1]
print([round(v) for v in (w * h).sqrt().tolist()])            # [128, 128, 128, 256, 256, 256, 512, 512, 512]
print([round(v, 1) for v in (h / w).tolist()[:3]])            # [0.5, 1.0, 2.0]  비율
```

## 관련 개념
[[Bounding Box Regression]] · [[Faster R-CNN]] · [[Default Box 스케일·종횡비]] · [[Anchor-Based vs Anchor-Free]] · [[IoU]]
