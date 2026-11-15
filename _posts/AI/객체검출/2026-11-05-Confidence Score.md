---
title: Confidence Score
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 평가, AI응용]
---
# Confidence Score

## 정의·핵심
- **정의 (강의)**: Bounding box 안에 **객체가 있을 확률이 얼마나 되는지**, 그리고 그 객체의 **클래스를 정확하게 예측했는지**를 나타내는 지표 (응용 11차시 mAP)
- **모델별 계산**
  - **YOLO v1**: `Confidence = Pr(Object) × IoU(pred, truth)` (박스 신뢰도) → 최종 클래스별 점수 = `Pr(Class | Object) × Confidence` → [[YOLO v1]]
  - **Faster R-CNN·SSD**: 클래스별 **softmax 확률**(배경 포함)
  - **YOLO v8**: 클래스별 **sigmoid** 점수 (objectness 브랜치 제거)
- **Confidence Threshold와 Precision·Recall의 Trade-off (강의)**
  - **threshold 낮게** → 더 많은 박스 → **Recall ↑, Precision ↓** (오검출 증가)
  - **threshold 높게** → 신중하게 예측 → **Precision ↑, Recall ↓** (놓침 증가)
  - 이 변화를 그린 것이 **PR 곡선** → [[Precision-Recall 곡선(검출)]] · [[AP·mAP]]
- **후처리에서의 역할**
  1. NMS 1단계: **confidence threshold(예: 0.5) 이하 박스 먼저 제거**
  2. 점수 **내림차순**으로 NMS → [[NMS(Non-Maximum Suppression)]]
  - ultralytics 기본: 예측 `conf=0.25`, 검증(mAP 계산) `conf=0.001`
- **주의**: 점수가 **잘 보정된(calibrated) 확률은 아님** → 0.9가 "90% 맞음"을 보장하지 않음 → [[Calibration]]
- 적용 환경에 맞게 threshold 정하기 → [[Confidence Threshold 정하기]]

## 수식·원리
```
YOLO v1:  conf = Pr(Object) · IoU_pred^truth
클래스 점수 = Pr(Class_i | Object) · Pr(Object) · IoU = Pr(Class_i) · IoU
threshold ↓ → TP·FP ↑ → Recall ↑, Precision ↓
```

## 코드 예시
```python
import torch

obj = torch.tensor([0.9, 0.8, 0.3, 0.6])                   # 박스별 Pr(Object)
cls = torch.tensor([[0.7, 0.3], [0.2, 0.8], [0.5, 0.5], [0.9, 0.1]])   # Pr(Class | Object)
score = obj[:, None] * cls                                 # 클래스별 confidence
conf, label = score.max(1)
print([round(v, 2) for v in conf.tolist()], label.tolist())   # [0.63, 0.64, 0.15, 0.54] [0, 1, 0, 0]

is_tp = torch.tensor([1, 1, 0, 1])                         # 정답 여부 (GT 4개)
for th in (0.1, 0.5, 0.6):
    keep = conf >= th
    tp = int(is_tp[keep].sum()); n = int(keep.sum())
    print(th, f"P={tp / max(n, 1):.2f} R={tp / 4:.2f}")     # 0.1 P=0.75 R=0.75 / 0.5 P=1.00 R=0.75 / 0.6 P=1.00 R=0.50
```

## 관련 개념
[[Confidence Threshold 정하기]] · [[NMS(Non-Maximum Suppression)]] · [[Precision-Recall 곡선(검출)]] · [[AP·mAP]] · [[YOLO v1]]
