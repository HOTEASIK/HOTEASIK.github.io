---
title: MeanShift 추적
date: 2026-11-05 12:00:00 +0900
categories: [AI, 영상처리]
tags: [영상처리, 추적, OpenCV, AI응용]
---
# MeanShift 추적

## 정의·핵심
- **정의**: Mean Shift. 확률 분포(역투영 맵)에서 **탐색 창을 데이터가 가장 밀집한 곳(질량 중심)으로 반복 이동**시켜 물체를 따라가는 추적 알고리즘 (응용 4차시)
- **동작 4단계 (강의)**
  1. **모델 생성**: 추적할 ROI의 **색상 히스토그램** 계산
  2. **역투영**: 새 프레임에서 히스토그램과 비슷한 색일수록 밝은 **확률 맵** 생성 → [[역투영(Back Projection)]]
  3. **창 이동**: 현재 창 안 확률 값의 **질량 중심(mass center)** 을 구해 창 중심을 그쪽으로 이동
  4. **반복**: 이동량이 작아지거나(ε) 최대 반복 횟수에 도달할 때까지 → **수렴**
- **OpenCV**
  ```
  term = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)   # 최대 10회 또는 1픽셀 이하
  ret, track_window = cv2.meanShift(dst, track_window, term)        # track_window = (x, y, w, h)
  ```
  - 초기 창은 첫 프레임에서 직접 지정(`selectROI`, 마우스 드래그) → [[마우스·트랙바]]
  - 반환 `ret` = 수렴까지 반복 횟수
- **특징**
  - 단순·빠름, 모델 학습 불필요, 색이 뚜렷한 물체에 효과적
  - **창 크기가 고정** → 물체가 다가오거나 멀어져 크기가 바뀌면 대응 못 함, 회전도 반영 안 됨 → [[CamShift 추적]]
  - 한 프레임에 물체가 **창 밖으로 크게 이동**하면 놓침 (지역 탐색)
  - 배경에 비슷한 색이 있으면 끌려감
- 질량 중심 계산 = 영상 모멘트 `cx = m10/m00`, `cy = m01/m00` (응용 3차시 색상 tracking과 같은 원리)

## 수식·원리
```
창 W 안에서
m00 = Σ B(x,y),  m10 = Σ x·B(x,y),  m01 = Σ y·B(x,y)
새 중심 (cx, cy) = (m10/m00, m01/m00)
|이동량| < ε 이 될 때까지 반복 → 밀도 최댓값(mode)으로 수렴
```

## 코드 예시
```python
import numpy as np
import cv2

def frame_at(cx):                                              # 빨간 원이 오른쪽으로 이동하는 프레임
    f = np.full((120, 200, 3), (255, 0, 0), np.uint8)
    cv2.circle(f, (cx, 60), 15, (0, 0, 255), -1)
    return cv2.cvtColor(f, cv2.COLOR_BGR2HSV)

hsv0 = frame_at(50)
x, y, w, h = 35, 45, 30, 30                                    # 초기 창 (selectROI 대신)
roi = hsv0[y:y + h, x:x + w]
roi_hist = cv2.calcHist([roi], [0], cv2.inRange(roi, (0, 60, 32), (180, 255, 255)), [180], [0, 180])
cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
term = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)
win = (x, y, w, h)
for cx in (58, 66, 74, 82):                                    # 프레임마다 8픽셀 이동
    dst = cv2.calcBackProject([frame_at(cx)], [0], roi_hist, [0, 180], 1)
    it, win = cv2.meanShift(dst, win, term)
    print(cx, win[0] + win[2] // 2, it)                        # 58 57 4 / 66 65 4 / 74 73 4 / 82 81 4  실제 중심 ≈ 창 중심
print(win[2:])                                                 # (30, 30)  창 크기는 고정
```

## 관련 개념
[[역투영(Back Projection)]] · [[CamShift 추적]] · [[히스토그램]] · [[HSV]] · [[동영상 처리]]
