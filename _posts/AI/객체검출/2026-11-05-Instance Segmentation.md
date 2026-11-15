---
title: Instance Segmentation
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 세그멘테이션, AI응용]
---
# Instance Segmentation

## 정의·핵심
- **정의 (응용 11차시)**: 객체 검출로 찾아낸 **객체의 형상에 따라 각각의 객체 영역을 픽셀 단위로 표시** — **검출 + 객체별 마스크**. "pixel에 대한 classification"
- **분할(Segmentation)의 종류**

| 종류 | 출력 | 같은 클래스의 두 객체 |
|---|---|---|
| **Semantic** | 픽셀마다 클래스 (H×W 맵) | **구분 안 함** (모두 "person") |
| **Instance** | 객체마다 (클래스, 박스, 마스크) | **구분함** (person 1, person 2) |
| **Panoptic** | Semantic + Instance (배경 stuff + 객체 things) | 구분함 |

- **대표 모델**
  - **Two-Stage**: **Mask R-CNN** — Faster R-CNN + RoI Align + 마스크 브랜치 → [[Mask R-CNN(언급)]]
  - **One-Stage**: **YOLO-seg**(v5·v8·v11), YOLACT(프로토타입 마스크 + 계수), SOLO → [[YOLO Segmentation]]
  - Transformer: Mask2Former, SAM(프롬프트 기반 범용 분할)
- **라벨**: 객체마다 **폴리곤**(꼭짓점 목록) 또는 **RLE**(Run-Length Encoding) 마스크 — COCO JSON의 `segmentation` 필드, YOLO-seg txt는 `class x1 y1 x2 y2 …`(정규화 폴리곤)
- **평가**: **mask AP** — IoU를 박스가 아니라 **마스크 IoU**(픽셀 교집합/합집합)로 계산 → COCO `segm` / 의료 분할은 **Dice 계수**도 많이 씀 → [[Dice 계수(의료영상)]]
- **활용**: 로봇 파지(물체 윤곽), 자율주행(차·보행자 영역), 의료(병변·장기 분할), 이미지 편집(배경 제거), 농업(과일 개수·크기)
- **박스와 비교**: 박스는 배경 픽셀이 섞임 → 넓이·모양·정확한 경계가 필요하면 마스크

## 수식·원리
```
Mask IoU = |M_pred ∩ M_gt| / |M_pred ∪ M_gt|   (픽셀 단위)
Semantic:  (H, W) ∈ {0..C}
Instance:  N × (class, box, mask ∈ {0,1}^{H×W})
```

## 코드 예시
```python
import numpy as np
import cv2

H, W = 60, 80
m1 = np.zeros((H, W), np.uint8); cv2.circle(m1, (20, 30), 12, 1, -1)     # person 1
m2 = np.zeros((H, W), np.uint8); cv2.circle(m2, (35, 30), 12, 1, -1)     # person 2 (겹침)
instance = [("person", m1), ("person", m2)]

semantic = np.zeros((H, W), np.uint8)
for _, m in instance:
    semantic[m > 0] = 1                                          # Semantic: 클래스만 → 두 사람이 하나로 합쳐짐
n_sem, _ = cv2.connectedComponents(semantic)
print(len(instance), n_sem - 1)                                  # 2 1  Instance는 2명, Semantic은 덩어리 1개

def mask_iou(a, b):
    return (a & b).sum() / (a | b).sum()
pred = np.roll(m1, 3, axis=1)                                    # 3px 어긋난 예측 마스크
print(round(float(mask_iou(pred, m1)), 3))                       # 0.723  마스크 IoU

ys, xs = np.nonzero(m1)
print([int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])   # [8, 18, 32, 42]  마스크에서 박스
cnts, _ = cv2.findContours(m1, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
poly = (cnts[0].reshape(-1, 2) / [W, H]).round(3)
print(len(poly) > 4)                                             # True  YOLO-seg 폴리곤 라벨로 변환 가능
```

## 관련 개념
[[Mask R-CNN(언급)]] · [[YOLO Segmentation]] · [[Dice 계수(의료영상)]] · [[컴퓨터 비전 주요 Task]] · [[윤곽선]]
