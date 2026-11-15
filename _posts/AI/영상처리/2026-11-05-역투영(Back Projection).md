---
title: 역투영(Back Projection)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 히스토그램, 추적, OpenCV, AI응용]
---
# 역투영(Back Projection)

## 정의·핵심
- **정의**: 관심 물체(ROI)의 **색상 히스토그램을 모델로 만들고**, 전체 영상의 각 픽셀에 대해 **"그 색이 모델에 얼마나 많이 있었는가"** 를 값으로 바꿔 **확률 맵**을 만드는 기법 (응용 4차시)
  - 결과: 물체와 색이 비슷한 픽셀은 **밝게**, 다른 픽셀은 **어둡게** 표시된 흑백 영상
- **MeanShift·CamShift 추적의 1·2단계 (강의)**: ROI 색상 히스토그램 → **역투영으로 확률 맵** → 그 맵에서 창 이동 → [[MeanShift 추적]]
- **절차**
  1. ROI를 **HSV**로 변환 — 밝기와 분리된 **Hue(색상)** 만 쓰면 조명 변화에 강함 → [[HSV]]
  2. 채도·밝기가 너무 낮은 픽셀(회색·검정)은 Hue가 불안정 → `inRange`로 마스크
  3. `roi_hist = cv2.calcHist([hsv_roi], [0], mask, [180], [0, 180])` → `cv2.normalize(..., 0, 255, NORM_MINMAX)`
  4. 매 프레임: `dst = cv2.calcBackProject([hsv], [0], roi_hist, [0, 180], 1)`
- **[[색상 검출]]과 비교**: `inRange`는 **고정된 범위**를 사람이 정함 ↔ 역투영은 **ROI의 실제 색 분포**로부터 자동으로 확률을 매김 (여러 색이 섞인 물체도 가능)
- 2D 히스토그램(H, S)을 쓰면 더 구별력 ↑, 결과에 블러·[[이진화]]·[[모폴로지]]를 붙여 객체 마스크로 사용
- **한계**: 배경에 물체와 **비슷한 색**이 있으면 같이 밝아짐

## 수식·원리
```
H_roi = 정규화된 ROI 색상 히스토그램 (0~255)
B(x, y) = H_roi[ bin( Hue(x, y) ) ]
→ 픽셀 색이 ROI에 흔할수록 큰 값 (확률 맵)
```

## 코드 예시
```python
import numpy as np
import cv2

img = np.zeros((100, 100, 3), np.uint8)
img[:] = (255, 0, 0)                                         # 파란 배경 (BGR)
cv2.circle(img, (60, 50), 15, (0, 0, 255), -1)               # 빨간 물체
cv2.circle(img, (20, 80), 8, (0, 255, 0), -1)                # 초록 방해물
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

roi = hsv[45:55, 55:65]                                      # 물체 일부를 ROI로
mask = cv2.inRange(roi, (0, 60, 32), (180, 255, 255))        # 저채도·저명도 제외
roi_hist = cv2.calcHist([roi], [0], mask, [180], [0, 180])
cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
dst = cv2.calcBackProject([hsv], [0], roi_hist, [0, 180], 1)
print(dst[50, 60], dst[5, 5], dst[80, 20])                   # 255 0 0  물체 색만 밝게
ys, xs = np.nonzero(dst)
print(round(xs.mean()), round(ys.mean()))                    # 60 50  확률 맵의 중심 = 물체 위치
```

## 관련 개념
[[히스토그램]] · [[HSV]] · [[색상 검출]] · [[MeanShift 추적]] · [[CamShift 추적]]
