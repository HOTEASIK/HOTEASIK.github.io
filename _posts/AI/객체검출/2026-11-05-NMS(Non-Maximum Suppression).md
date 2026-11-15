---
title: NMS(Non-Maximum Suppression)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 후처리, NMS, AI응용]
---
# NMS(Non-Maximum Suppression)

## 정의·핵심
- **정의**: 검출 모델은 객체가 있을 만한 위치에 **많은 박스를 겹쳐서** 내놓는 경향이 강함 → **비슷한 위치의 중복 박스를 제거하고 가장 확실한 박스 하나만** 남기는 **후처리** 기법 (응용 11차시 "중복 검출 제거")
- **알고리즘 (강의)**
  1. **confidence threshold 이하** 박스를 먼저 제거 (예: confidence < 0.5)
  2. 남은 박스를 **confidence 내림차순** 정렬
  3. 가장 높은 박스(**best box**)를 선택하고, 그것과 **IoU가 threshold 이상**(예: > 0.4)인 다른 박스를 **모두 제거**
  4. 남은 박스 중 다음 최고 점수로 3을 반복 → **남아 있는 박스만 선택**
- **클래스별 수행 (강의 코드)**: 클래스가 다른 박스끼리는 지우면 안 됨 → class별로 박스를 모아(`cls_bboxes`) 각각 NMS (`batched_nms`)
- **파라미터 효과 (강의)**: **confidence threshold가 높을수록, IoU threshold가 낮을수록 많은 박스가 제거**됨
  - IoU threshold 너무 낮음 → 붙어 있는 **다른 객체까지 삭제**(군중)
  - 너무 높음 → 중복 박스가 남음
- **변형**
  - **Soft-NMS**: 지우는 대신 IoU에 따라 **점수를 감소** → 밀집 객체에 유리 (강의 코드의 "weight=0 부여"가 hard, 0~1 가중치면 soft)
  - **DIoU-NMS**: IoU 대신 DIoU로 판단 → [[DIoU·CIoU]]
- **한계**: 순차 처리라 **추론 지연(latency)** 의 원인, 하이퍼파라미터에 민감, end-to-end 학습 불가 → **YOLO v10의 NMS-Free** (Dual Label Assignment로 1객체 1박스 학습) → [[YOLO v10]]
- torchvision: `torchvision.ops.nms(boxes, scores, iou_threshold)`, `batched_nms(boxes, scores, idxs, iou_threshold)` → 남길 인덱스 반환

## 수식·원리
```
D = {score ≥ conf_th},  keep = []
while D:
    M = argmax score(D);  keep.append(M);  D −= {M}
    D = {b ∈ D : IoU(M, b) < iou_th}          (hard NMS)
Soft-NMS:  s_b ← s_b · exp(−IoU(M, b)² / σ)
```

## 코드 예시
```python
import torch
from torchvision.ops import box_iou, nms, batched_nms

def my_nms(boxes, scores, conf_th=0.5, iou_th=0.4):
    idx = (scores >= conf_th).nonzero().flatten()                 # 1. confidence 필터
    idx = idx[scores[idx].argsort(descending=True)]               # 2. 내림차순
    keep = []
    while len(idx):
        best = idx[0]; keep.append(int(best))                     # 3. best box
        iou = box_iou(boxes[best][None], boxes[idx[1:]])[0]
        idx = idx[1:][iou <= iou_th]                              #    겹치는 박스 제거
    return keep

boxes = torch.tensor([[10., 10., 50., 50.], [12., 12., 52., 52.], [100., 100., 140., 140.],
                      [11., 9., 49., 51.], [102., 98., 141., 139.]])
scores = torch.tensor([0.9, 0.8, 0.7, 0.3, 0.6])
print(my_nms(boxes, scores))                                      # [0, 2]  객체당 1개씩
print(nms(boxes[scores >= 0.5], scores[scores >= 0.5], 0.4).tolist())   # [0, 2]  torchvision과 같음
labels = torch.tensor([0, 1, 0, 0, 0])                            # 박스 1은 다른 클래스
print(batched_nms(boxes, scores, labels, 0.4).tolist())           # [0, 1, 2]  클래스가 다르면 남김
```

## 관련 개념
[[IoU]] · [[Confidence Score]] · [[DIoU·CIoU]] · [[YOLO v10]] · [[AP·mAP]]
