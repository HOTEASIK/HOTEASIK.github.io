---
title: Confidence Threshold 정하기
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, 평가, AI응용]
---
# Confidence Threshold 정하기

## 정의·핵심
- **문제**: 검출 결과는 confidence가 붙은 박스 목록 → **몇 점 이상을 "검출"로 인정할지** 정해야 실제 서비스에 쓸 수 있다. mAP는 모든 threshold를 평균한 값이라 **운영 threshold는 따로 결정**해야 함
- **원칙 (강의)**: Precision과 Recall의 **상대적 중요도**는 **오류의 비용**이 결정 (응용 11차시)
  - **의료 영상 판별 → Recall이 더 중요**: 실제 양성(병변)을 음성으로 놓치면(FN) 위험이 큼 → **threshold를 낮게** (오경보는 의사가 재확인)
  - **스팸 메일 판별 → Precision이 더 중요**: 정상 메일을 스팸으로 처리(FP)하면 손해가 큼 → **threshold를 높게**
- **Confidence Threshold 가이드 (응용 12차시)**

| 분야 | 우선 | 권장 Conf |
|---|---|---|
| **의료 영상 (암 진단)** | **Recall** — 놓치면 생명 위험, 의심 부위 모두 검출 | **0.1 ~ 0.3** (낮게) |
| **보안 CCTV (침입)** | **Precision** — 오알람(고양이·바람) 시 경찰 출동 비용 | **0.6 ~ 0.8** (보수적) |
| 일반 (검색·분류) | Balanced — F1 최대 지점 | 0.4 ~ 0.5 (기본) |

  - Precision이 낮으면 → **허위 경보**가 많아져 사용자가 피로해짐 / Recall이 낮으면 → 중요 객체를 놓치는 **미검 사고**
  - 강의: "지표는 절대적 점수가 아닌 **운영 의사결정 도구** — 리스크(오탐 vs 미탐)에 맞춰 임계값을 조정"
- **정하는 방법**
  1. **검증 세트**에서 threshold별 P·R·F1 계산 (PR 곡선) → [[Precision-Recall 곡선(검출)]]
  2. 요구 조건으로 선택
     - **F1 최대** 지점 (균형) — ultralytics `F1_curve.png`
     - "**Recall ≥ 0.95를 만족하는 것 중 Precision 최대**" (의료)
     - "**Precision ≥ 0.99** 중 Recall 최대" (자동 처리, 스팸)
  3. **클래스별로 다르게** 설정 가능 (위험 클래스는 낮게)
  4. 운영 데이터 분포가 바뀌면 재조정
- **ultralytics 기본값**: `predict(conf=0.25)`, `val`은 `conf=0.001`(mAP 계산용으로 거의 전부 포함) → 데모 기본값을 그대로 운영에 쓰지 말 것
- NMS의 IoU threshold(기본 0.7)와는 **별개** 파라미터 → [[NMS(Non-Maximum Suppression)]]

## 수식·원리
```
F1 = 2·P·R / (P + R)                → 균형점
의료:  th* = argmax_th P(th)  s.t. R(th) ≥ 0.95
스팸:  th* = argmax_th R(th)  s.t. P(th) ≥ 0.99
기대 비용 = c_FN · FN(th) + c_FP · FP(th)  → 최소화
```

## 코드 예시
```python
import numpy as np

rng = np.random.default_rng(0)
n_gt = 200
conf = np.concatenate([rng.beta(5, 2, 190), rng.beta(2, 5, 300)])   # 190 TP 후보 + 300 FP 후보
is_tp = np.concatenate([np.ones(190), np.zeros(300)])
ths = np.round(np.arange(0.05, 0.96, 0.05), 2)
P = np.array([is_tp[conf >= t].mean() if (conf >= t).any() else 1 for t in ths])
R = np.array([is_tp[conf >= t].sum() / n_gt for t in ths])
F1 = 2 * P * R / (P + R)
print("F1 최대:", ths[F1.argmax()])                                # 0.5
ok = R >= 0.90                                                      # 의료: Recall 우선
print("Recall≥0.90 중 Precision 최대:", ths[ok][P[ok].argmax()])   # 0.4
ok = P >= 0.95                                                      # 자동 처리: Precision 우선
print("Precision≥0.95 중 Recall 최대:", ths[ok][R[ok].argmax()])   # 0.65
cost = 10 * (n_gt - R * n_gt) + 1 * (np.array([(conf >= t).sum() for t in ths]) - R * n_gt)
print("FN 비용 10배일 때:", ths[cost.argmin()])                        # 0.3  놓침이 비쌀수록 낮은 threshold
```

## 관련 개념
[[Confidence Score]] · [[Precision-Recall 곡선(검출)]] · [[AP·mAP]] · [[F1 Score]] · [[Precision–Recall 트레이드오프]]
