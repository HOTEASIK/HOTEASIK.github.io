---
title: Selective Search·Region Proposal
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, TwoStage, AI응용]
---
# Selective Search·Region Proposal

## 정의·핵심
- **Region Proposal (영역 제안)**: 이미지에서 **객체가 있을 만한 후보 영역(bounding box)** 을 먼저 추출하는 알고리즘 → 그 후보만 분류하면 Sliding Window보다 훨씬 효율적 (응용 11차시)
  - 대표: **Selective Search**, Edge Boxes / 딥러닝: **RPN**(Faster R-CNN) → [[Faster R-CNN]]
  - 흐름: 원본 이미지 → **후보 bounding box 선택** → 객체 검출(분류) → 최종 후보 도출
- **Selective Search (강의)**: **빠른 검출과 높은 Recall**을 동시에 만족하도록 설계 — **컬러, 무늬(texture), 크기, 형태**에 따라 **유사한 region을 grouping**
  - 시작: 픽셀 밝기 기반 **graph-based segmentation**으로 **over-segmentation**(각 객체가 개별 영역에 담기도록 아주 잘게 많이 나눔)
  1. 개별 segment된 모든 부분을 bounding box로 만들어 **region proposal 리스트에 추가**
  2. 컬러·무늬·크기·형태 **유사도가 높은 segment끼리 grouping**(병합)
  3. 다시 1번 — 병합된 영역도 리스트에 추가
  4. 하나가 될 때까지 반복 → **계층적(hierarchical) 그룹핑**으로 다양한 크기의 후보 생성
  - **R-CNN은 이미지당 약 2000개** 후보 사용 → [[R-CNN]]
- **특징**
  - 학습이 필요 없는 **고전 알고리즘**, Recall 높음(객체를 놓치지 않음)
  - 하지만 **CPU에서 이미지당 약 2초**로 느림 → Faster R-CNN이 **RPN(학습 가능한 신경망)** 으로 대체해 end-to-end화
- OpenCV: `cv2.ximgproc.segmentation.createSelectiveSearchSegmentation()` (**opencv-contrib** 필요)

## 수식·원리
```
유사도 s(ri, rj) = a1·s_color + a2·s_texture + a3·s_size + a4·s_fill
s_size = 1 − (size(ri) + size(rj)) / size(image)   → 작은 영역부터 먼저 병합
s_fill = 1 − (size(BBij) − size(ri) − size(rj)) / size(image)  → 서로 잘 맞물리는 영역 우선
가장 유사한 쌍 병합 → 반복
```

## 코드 예시
```python
import numpy as np

# 간단한 계층적 그룹핑: 영역 = (박스, 평균색), 색이 비슷하고 인접한 영역부터 병합
regions = [((0, 0, 10, 10), 200), ((10, 0, 20, 10), 205), ((0, 10, 10, 20), 50), ((10, 10, 20, 20), 55)]
proposals = [r[0] for r in regions]
def merge(a, b):
    (ax1, ay1, ax2, ay2), (bx1, by1, bx2, by2) = a[0], b[0]
    return (min(ax1, bx1), min(ay1, by1), max(ax2, bx2), max(ay2, by2)), (a[1] + b[1]) / 2
while len(regions) > 1:
    i, j = min(((i, j) for i in range(len(regions)) for j in range(i + 1, len(regions))),
               key=lambda p: abs(regions[p[0]][1] - regions[p[1]][1]))      # 색 유사도
    m = merge(regions[i], regions[j])
    regions = [r for k, r in enumerate(regions) if k not in (i, j)] + [m]
    proposals.append(m[0])
print(len(proposals), proposals[4:])                                         # 7 [(0, 0, 20, 10), (0, 10, 20, 20), (0, 0, 20, 20)]
```

## 관련 개념
[[Sliding Window]] · [[R-CNN]] · [[Fast R-CNN]] · [[Faster R-CNN]] · [[Two-Stage vs One-Stage]]
