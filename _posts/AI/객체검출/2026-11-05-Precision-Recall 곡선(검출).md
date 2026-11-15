---
title: Precision-Recall 곡선(검출)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 평가, AI응용]
---
# Precision-Recall 곡선(검출)

## 정의·핵심
- **정의 (강의)**: **Confidence 값에 따른 Recall 값에 대한 Precision 값**을 나타낸 곡선 (응용 11차시) — x축 Recall, y축 Precision
- **Confidence에 따른 Trade-off (강의)**
  - confidence 기준이 **낮을수록** 더 많은 박스 → **Precision ↓, Recall ↑**
  - confidence 기준이 **높을수록** 신중하게 예측 → **Precision ↑, Recall ↓**
  - 극단: Precision 100% = 확실한 것만 Positive (예: 확실한 징후 환자만) / Recall 100% = 모든 후보를 Positive (모든 환자를 양성으로)
- **그리는 법**
  1. 한 클래스의 **모든 예측**을 confidence 내림차순 정렬
  2. 위에서부터 하나씩 포함하며 누적 TP·FP로 (Recall, Precision) 점 계산 — **TP 판정은 IoU ≥ 임계값**
  3. 점을 이으면 **지그재그** 곡선 (FP가 나오면 P가 떨어지고, TP가 나오면 R이 오르며 P가 회복)
  4. **보간**: 오른쪽 최대 Precision으로 덮어 단조 감소 곡선 → **아래 면적 = AP** → [[AP·mAP]]
- **분류의 PR 곡선과 차이**
  - 분류: 샘플 수 고정, threshold만 바꿈 → [[Precision–Recall 트레이드오프]]
  - 검출: **FN에 "아예 예측조차 없는 GT"** 가 포함 → Recall이 **1에 못 미칠 수 있음** (곡선이 중간에서 끝남), TP 판정에 IoU가 개입
- **읽는 법**: 곡선이 **오른쪽 위**로 붙을수록 좋은 모델 / Recall이 낮은 곳에서 Precision이 무너지면 높은 점수의 오검출이 있음
- 클래스별 PR 곡선을 비교하면 **어떤 클래스가 약한지** 진단 가능 (ultralytics `PR_curve.png`)
- **운영 지점 선택**: 곡선 위의 한 점 = 하나의 confidence threshold → [[Confidence Threshold 정하기]]

## 수식·원리
```
k번째 예측까지:  P_k = TP_k / k,   R_k = TP_k / N_gt
FP → P↓, R 그대로   /   TP → R↑, P↑
AP = Σ (R_{k} − R_{k−1}) · P_interp(R_k)
```

## 코드 예시
```python
import numpy as np

conf = np.array([0.95, 0.92, 0.85, 0.8, 0.7, 0.6, 0.4, 0.3])
is_tp = np.array([1, 1, 0, 1, 1, 0, 0, 1])
n_gt = 6                                                     # GT 6개 중 하나는 예측조차 없음
o = np.argsort(-conf)
tp = np.cumsum(is_tp[o]); k = np.arange(1, len(o) + 1)
P, R = tp / k, tp / n_gt
for c, p, r in zip(conf[o], P, R):
    print(f"conf≥{c:.2f}  P={p:.2f}  R={r:.2f}")             # 0.95 P=1.00 R=0.17 → 0.85 P=0.67 → 0.70 P=0.80 R=0.67 … 지그재그
print(round(R.max(), 2))                                     # 0.83  Recall이 1에 도달 못 함
P_interp = np.maximum.accumulate(P[::-1])[::-1]
print(np.round(P_interp, 2).tolist())                        # [1.0, 1.0, 0.8, 0.8, 0.8, 0.67, 0.62, 0.62]  단조 감소로 보간
```

## 관련 개념
[[AP·mAP]] · [[Confidence Score]] · [[Confidence Threshold 정하기]] · [[Precision–Recall 트레이드오프]] · [[IoU]]
