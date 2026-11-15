---
title: Bounding Box
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, BoundingBox, AI응용]
---
# Bounding Box

## 정의·핵심
- **정의**: 객체를 둘러싸는 **축 정렬 직사각형**. 객체 검출의 위치 출력 단위 — 숫자 **4개**로 표현 (응용 11차시)
- **좌표 형식 3가지**

| 형식 | 값 | 사용처 |
|---|---|---|
| **xyxy** | (x1, y1, x2, y2) 좌상단·우하단 | torchvision 검출 모델, Pascal VOC XML, IoU 계산 |
| **xywh** | (x, y, w, h) 좌상단 + 너비·높이 | **COCO JSON**, OpenCV `boundingRect`·`rectangle` |
| **cxcywh** | (cx, cy, w, h) 중심 + 너비·높이 | **YOLO**(txt, 0~1 정규화), DETR, 박스 회귀 |

- **강의 IoU 코드의 변환**: `(x, y, w, h)` = 중심 형식 → 좌상단 `(x − 0.5w, y − 0.5h)`, 우하단 `(x + 0.5w, y + 0.5h)`
- **정규화 좌표**: YOLO 라벨은 이미지 너비·높이로 나눈 **0~1** 값 → 해상도와 무관 / 픽셀 좌표로 쓸 때 다시 곱함
- **주의**
  - 형식을 섞으면 박스가 엉뚱한 곳에 그려짐 → **데이터셋·모델의 형식을 항상 확인**
  - 이미지를 리사이즈·뒤집기·자르기하면 **박스도 같이 변환** (letterbox면 패딩 오프셋도) → [[검출용 데이터 증강]]
  - 이미지 밖으로 나간 좌표는 clip, 넓이 0인 박스 제거
  - 픽셀 경계 규약(x2 포함 여부, +1)은 데이터셋마다 다름 (VOC는 1부터 시작)
- **변환 도구**: `torchvision.ops.box_convert(boxes, in_fmt="xywh", out_fmt="xyxy")`, `box_area`, `clip_boxes_to_image`
- 회전 박스(OBB, 항공 영상), 3D 박스(자율주행 LiDAR)도 있음

## 수식·원리
```
xywh → xyxy:    x2 = x + w,       y2 = y + h
cxcywh → xyxy:  x1 = cx − w/2,    x2 = cx + w/2  (y도 동일)
xyxy → cxcywh:  cx = (x1 + x2)/2, w = x2 − x1
YOLO 정규화:    cx/W, cy/H, w/W, h/H
```

## 코드 예시
```python
import torch
from torchvision.ops import box_convert, box_area, clip_boxes_to_image

b = torch.tensor([[50., 40., 100., 80.]])                               # xywh (COCO)
xyxy = box_convert(b, "xywh", "xyxy")
cxcy = box_convert(b, "xywh", "cxcywh")
print(xyxy.tolist(), cxcy.tolist())                                     # [[50.0, 40.0, 150.0, 120.0]] [[100.0, 80.0, 100.0, 80.0]]
print(box_area(xyxy).tolist())                                          # [8000.0]

W, H = 200, 100                                                         # YOLO 정규화 라벨
yolo = cxcy / torch.tensor([W, H, W, H])
print([round(v, 2) for v in yolo[0].tolist()])                          # [0.5, 0.8, 0.5, 0.8]
print(clip_boxes_to_image(xyxy, (H, W)).tolist())                       # [[50.0, 40.0, 150.0, 100.0]]  이미지 밖은 잘라냄
flip = xyxy.clone(); flip[:, [0, 2]] = W - xyxy[:, [2, 0]]              # 좌우 반전 시 박스 변환
print(flip.tolist())                                                    # [[50.0, 40.0, 150.0, 120.0]]
```

## 관련 개념
[[IoU]] · [[Bounding Box Regression]] · [[라벨 형식]] · [[검출용 데이터 증강]] · [[컴퓨터 비전 주요 Task]]
