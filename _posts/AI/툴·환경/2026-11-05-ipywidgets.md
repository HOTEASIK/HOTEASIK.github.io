---
title: ipywidgets
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, Jupyter, AI응용]
---
# ipywidgets

## 정의·핵심
- **정의**: Jupyter·Colab 노트북 안에 **슬라이더, 버튼, 드롭다운** 같은 조작 위젯을 만드는 라이브러리. Colab에는 기본 설치되어 있다.
- **강의에서의 쓰임** (응용 OpenCV 차시): OpenCV의 **트랙바(`cv2.createTrackbar`)는 GUI 창이 필요해서 Colab에서 안 된다** → ipywidgets 슬라이더로 "값을 바꾸면 결과가 바로 다시 그려지는" 같은 개념을 재현한다.
  - 예: 이진화 임계값, Canny 엣지 임계값, 블러 커널 크기, HSV 색 범위를 슬라이더로 바꿔 보기
- **가장 쉬운 사용법 `interact`**: 함수를 넘기면 인자 타입에 맞는 위젯을 자동 생성
  - 정수 범위 `(0, 255, 1)` → 정수 슬라이더, 실수 `(0.0, 1.0)` → 실수 슬라이더, 리스트 → 드롭다운, `True` → 체크박스
- **직접 만들기**: `widgets.IntSlider(min, max, step, value)`, `widgets.Dropdown(options)`, `widgets.Button` + `.observe()` / `.on_click()`로 이벤트 연결
- 그래프를 다시 그릴 때 이전 출력이 쌓이면 `interact`를 쓰거나 `Output` 위젯 + `clear_output()`

## 수식·원리
```
슬라이더 값 변경 ─▶ 연결된 함수 재호출 f(thresh=새값) ─▶ 출력 다시 그림
(OpenCV 트랙바 콜백과 같은 구조)
```

## 코드 예시
```python
import numpy as np
import matplotlib.pyplot as plt
from ipywidgets import interact

img = (np.random.rand(64, 64) * 255).astype(np.uint8)

@interact(thresh=(0, 255, 1))
def show(thresh=127):
    plt.imshow(img > thresh, cmap="gray")   # 이진화 결과
    plt.title(f"thresh={thresh}")
    plt.show()
```

## 관련 개념
[[Jupyter Notebook]] · [[Google Colab]] · [[이진화(Threshold)]] · [[OpenCV 개요]]
