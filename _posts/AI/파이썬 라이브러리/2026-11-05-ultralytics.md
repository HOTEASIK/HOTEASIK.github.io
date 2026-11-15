---
title: ultralytics
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, YOLO, AI응용]
---
# ultralytics

## 정의·핵심
- **정의**: YOLO(v5·v8·v10·v11) 객체 검출 모델을 학습·추론·내보내기 할 수 있는 라이브러리. `pip install ultralytics`, `from ultralytics import YOLO` (응용 12차시)
- **장점**: 복잡한 파이프라인 없이 **한 줄로 실험** — CLI와 Python 사용법이 같고, 결과가 `runs/` 폴더에 자동 저장되어 재현성이 높다.
- **모델 불러오기**: `YOLO('yolov8n.pt')`, `YOLO('yolov8s.pt')`, `YOLO('yolo11n.pt')`, `YOLO('yolov10n.pt')`
  - 크기: n(nano, 빠름) < s < m < l < x(정확, 느림) → [[YOLO 버전 비교·선택 가이드]]
  - `-seg.pt`는 세그멘테이션 모델 → [[YOLO Segmentation]]
- **4가지 동작**
  1. 학습: `model.train(data='data.yaml', epochs=100, imgsz=640, batch=16)` — 강의 노트북에서 가장 많이 나옴
  2. 검증: `model.val()` → mAP50, mAP50-95
  3. 추론: `results = model.predict('img.jpg', conf=0.25)` 또는 `model('img.jpg')`
  4. 내보내기: `model.export(format='onnx')` → [[모델 배포]]
- **결과 읽기**: `results[0].boxes` → `.xyxy`(좌표), `.conf`(신뢰도), `.cls`(클래스 번호), `results[0].names`(클래스 이름), `results[0].plot()`(박스 그린 이미지)
- **data.yaml**: 학습·검증 이미지 경로와 클래스 이름을 적은 설정 파일 (`train:`, `val:`, `names:`) → [[YOLO 학습 실습]]
- 학습 결과: `runs/detect/train/weights/best.pt`(검증 성능 최고), `last.pt`
- 증강(Mosaic 등)·하이퍼파라미터(`lr0`, `hsv_h` 등)를 train 인자로 조절한다. → [[검출용 데이터 증강]]

## 수식·원리
```
YOLO('yolov8n.pt') ─train(data.yaml)─▶ best.pt ─predict─▶ boxes(xyxy, conf, cls)
                                         └─export(onnx)─▶ 배포
```

## 코드 예시
```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")                      # 처음 실행 시 내려받음
results = model.predict("https://ultralytics.com/images/bus.jpg", conf=0.25)
r = results[0]
for xyxy, conf, cls in zip(r.boxes.xyxy, r.boxes.conf, r.boxes.cls):
    print(r.names[int(cls)], round(float(conf), 2), [int(v) for v in xyxy])
# bus 0.87 [...], person 0.86 [...] 처럼 출력

# 학습 (data.yaml 필요)
# model.train(data="mydet/data.yaml", epochs=50, imgsz=640)
# model.export(format="onnx")
```

## 관련 개념
[[YOLO v8]] · [[YOLO 학습 실습]] · [[YOLO 버전 비교·선택 가이드]] · [[AP·mAP]] · [[모델 배포]]
