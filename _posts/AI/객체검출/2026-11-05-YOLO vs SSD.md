---
title: YOLO vs SSD
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, YOLO, SSD, AI응용]
---
# YOLO vs SSD

## 정의·핵심
- 둘 다 **One-Stage 검출기**지만, 핵심 차이는 **단일 스케일(Single Scale) vs 멀티 스케일(Multi-scale)** 아키텍처 (응용 13차시 "YOLO vs SSD: 핵심 비교")
- **비교 (강의, YOLO v1 기준)**

| 항목 | YOLO v1 | SSD |
|---|---|---|
| Feature Map | **마지막 단일 레이어 (7×7)** 만 사용 | **Pyramid 구조 Multi-scale (6개)** |
| 작은 객체 | 저해상도로 **취약** | 고해상도 맵(38×38) 활용으로 **우수** |
| Anchor | **사용 안 함** (Grid Cell 직접 예측) | **다양한 비율의 Default Box** |
| 박스 수 | 98개 (7×7×2) | **8,732개** (SSD300) |
| 분류 | 셀당 클래스 확률 1세트 | 박스마다 C+1 softmax |
| 속도 | **매우 빠름** (45 FPS, Real-time 최적화) | 빠름 (SSD300 59 FPS, 정확도·속도 균형) |
| 정확도 (VOC07) | 63.4 mAP | 74.3 mAP (SSD300) |

- **대학원교안 비교**: YOLO v1은 "빠른 검출 시간, 그러나 낮은 정확도 (**SSD가 더 좋은 성능과 속도**)" → v2는 "SSD보다 빠르지만 성능은 조금 개선" → v3는 "다소 느려졌으나 성능 대폭 개선"
- **이후의 수렴**: YOLO v2부터 앵커, v3부터 **3스케일(FPN)** 을 도입하며 SSD의 장점을 흡수 → 현재 YOLO(v8 이후)는 **Anchor-Free + PAN-FPN**으로 SSD보다 빠르고 정확
- **언제 SSD?**: torchvision에 바로 있는 **SSDLite + MobileNet**은 모바일·임베디드에서 여전히 쓰임, 구조가 단순해 학습·교육용으로 좋음
- **언제 YOLO?**: 실시간·고정밀·쉬운 학습 파이프라인(ultralytics)이 필요한 대부분의 실무 → [[YOLO 버전 비교·선택 가이드]]

## 수식·원리
```
YOLO v1 출력: 7×7×(2·5 + 20)        → 98 박스
SSD300 출력:  Σ f_k² · k_k · (C+1+4) → 8,732 박스
```

## 코드 예시
```python
yolo_v1 = 7 * 7 * 2
ssd = sum(f * f * k for f, k in zip([38, 19, 10, 5, 3, 1], [4, 6, 6, 6, 4, 4]))
print(yolo_v1, ssd, round(ssd / yolo_v1))         # 98 8732 89  SSD가 훨씬 조밀한 예측

for name, grid in (("YOLO v1", [7]), ("SSD300", [38, 19, 10, 5, 3, 1])):
    finest = 448 / grid[0] if name == "YOLO v1" else 300 / grid[0]
    print(name, f"가장 촘촘한 셀 = {finest:.1f}px")   # 64.0px vs 7.9px  작은 객체 대응력 차이
```

## 관련 개념
[[YOLO v1]] · [[SSD]] · [[Multi-scale Feature Map]] · [[YOLO 버전 비교·선택 가이드]] · [[Two-Stage vs One-Stage]]
