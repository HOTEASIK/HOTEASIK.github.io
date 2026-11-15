---
title: OpenCV BGR
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 비전·3D]
tags: [비전·3D, OpenCV, 실습]
---
# OpenCV BGR

## 정의·핵심
- **정의**: OpenCV는 컬러 픽셀을 **파랑-초록-빨강(BGR)** 순서로 다룬다 — 사람이 흔히 말하는 RGB와 순서가 뒤집혀 있다 (실습 6차시).
- **까닭 — 역사적 관습**: OpenCV가 처음 만들어지던 무렵의 하드웨어·파일 포맷이 파랑을 앞에 두었고 그 관습이 이어졌다.
- **OpenCV 안에서는 문제가 없다**: 읽고 처리하고 저장하는 한 BGR로 일관된다. 실습은 입력부터 출력까지 BGR 세계 안에 머문다 → 모든 곳을 `'bgr8'`로.
- **경계에서 뒤집는다**: RGB로 생각하는 일부 GUI·딥러닝 프레임워크와 주고받을 때 `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)` 한 번. **색이 뒤바뀐 영상을 만나면 가장 먼저 의심할 곳**.
- **색 튜플도 BGR**: `cv2.line(frame, …, (0, 255, 255), 6)`은 노랑(파랑 0·초록 255·빨강 255), `(0, 0, 255)`는 빨강.
- **흑백 변환**: `COLOR_BGR2GRAY`는 사람 눈 민감도를 반영한 가중 평균(0.114·B + 0.587·G + 0.299·R) — 노랑 (0,255,255)은 밝기 200을 넘어(초록·빨강 가중치가 크다) 검은 바탕과의 차이가 크다 → 색을 버려도 흰 선과 똑같이 경계로 잡힌다.
- **HSV**: 색조 H·채도 S·명도 V — `COLOR_BGR2HSV`, OpenCV에서 H는 0~180. 흰색 `(0,0,200)~(180,30,255)`, 노란색 `(15,80,120)~(35,255,255)`를 `cv2.inRange`로 골라낸다 — 조명에 강해지려는 첫 보강.

## 원리·구조
```
픽셀 [B, G, R]   노랑 = [0, 255, 255]   빨강 = [0, 0, 255]   흰색 = [255, 255, 255]
BGR2GRAY: Y = 0.114·B + 0.587·G + 0.299·R
BGR2RGB : [B, G, R] → [R, G, B]
```

## 코드 예시
```python
import cv2
import numpy as np
px = np.array([[[0, 255, 255], [0, 0, 255], [255, 255, 255]]], dtype=np.uint8)   # 노랑·빨강·흰색 (BGR)
print(cv2.cvtColor(px, cv2.COLOR_BGR2GRAY).tolist())     # [[226, 76, 255]]  ← 노랑도 밝다
print(cv2.cvtColor(px, cv2.COLOR_BGR2RGB)[0, 0].tolist()) # [255, 255, 0]
hsv = cv2.cvtColor(px, cv2.COLOR_BGR2HSV)
print(hsv[0].tolist())                                   # [[30, 255, 255], [0, 255, 255], [0, 0, 255]]
yellow = cv2.inRange(hsv, (15, 80, 120), (35, 255, 255))
white = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))
print(yellow.tolist(), white.tolist())                   # [[255, 0, 0]] [[0, 0, 255]]
```

## 관련 개념
[[영상 인코딩]] · [[cv_bridge]] · [[차선 검출 파이프라인]] · [[Canny 엣지]]
