---
title: Hyperband·BOHB
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [하이퍼파라미터, Hyperband, BOHB, 조기종료, 보충]
---
# Hyperband·BOHB

## 정의·핵심
- **공통 문제 (보충 02)**: Grid·Random·Bayesian은 각 시도를 **끝까지** 학습 → 몇 에폭만 봐도 '가망 없음'이 보이는 조합까지 완주 (낭비)
- **Successive Halving (연속 절반, 강의)** — "**토너먼트**"
  1. 많은 후보(예: 16개)를 아주 적은 예산(1에폭)으로 학습
  2. 성능 **상위 절반만** 남기고 나머지 중단
  3. 남은 후보에 예산을 **2배**로 늘려 다시 학습
  4. 1개가 남을 때까지 반복
  - 강의 예: 후보 8개 → R0(1ep) 4개 통과 → R1(2ep) 2개 → R2(4ep) 1개 → R3(8ep) 승자 A 0.945
  - 예산: 8×1 + 4×2 + 2×4 + 1×8 = **32 에폭** vs 전부 8에폭 완주 **64 에폭** → **절반 예산으로 같은 승자**
- **Hyperband (강의)** — 연속 절반을 더 똑똑하게
  - 딜레마: '많이·짧게' vs '적게·길게' 중 무엇이 나은지 미리 모름 — **늦게 피는 꽃**(초반엔 별로다 나중에 좋아지는 조합)을 너무 일찍 자를 위험
  - 해법: '많이·짧게'(공격적)부터 '적게·길게'(≈ 랜덤)까지 **여러 브래킷**의 연속 절반을 병행 → 위험 **헤지**
  - 강의 예: 후보 L은 1에폭 0.60(나빠 보임) → 4에폭 0.93(사실 최고) — 브래킷 0(8개×1ep)은 L을 놓치지만 브래킷 2(2개×4ep)가 살림
  - 랜덤 탐색 대비 **이론적으로 더 효율적**임이 증명됨 / 도구: Ray Tune·Optuna·Keras Tuner·W&B Sweeps(`early_terminate: hyperband`)
- **BOHB = Bayesian Optimization + HyperBand (강의)**
  - Hyperband: 조기 종료로 예산은 아끼지만 후보 선택은 여전히 **무작위**
  - BOHB: Hyperband의 예산 스케줄 + **베이지안(TPE)의 똑똑한 후보 선택** → 초반엔 빠르게 거르고, 관측이 쌓일수록 유망 구간 집중
  - 예: 앞에서 lr 0.02~0.05가 좋았다면 다음 8개 중 6개를 그 근처에서 뽑음 (Hyperband는 0.3·0.001·0.08처럼 우연에 의존)
  - 도구: Ray Tune·HpBandSter → [[Bayesian Optimization]]

## 수식·원리
```
Successive Halving (n개, 최소 예산 r, 감소율 η=2):
  라운드 i:  n/η^i 개를 r·η^i 에폭씩 → 상위 1/η만 통과
  총 예산 ≈ n·r·log_η(n)  (각 라운드 비용이 거의 같음)
Hyperband: 브래킷 s = s_max..0 마다 (n_s, r_s)를 바꿔 SH 실행
```

## 코드 예시
```python
import numpy as np

def curve(lr, late, epochs):                        # 가짜 학습 곡선: late=True면 늦게 피는 후보
    best = 0.95 - 8 * (np.log10(lr) + 1.5) ** 2 * 0.01
    speed = 0.5 if late else 1.5
    return best * (1 - np.exp(-speed * epochs))

def successive_halving(cands, r=1, eta=2):
    budget = 0
    while len(cands) > 1:
        scores = [curve(lr, late, r) for lr, late in cands]
        budget += len(cands) * r
        keep = np.argsort(scores)[::-1][: max(1, len(cands) // eta)]
        cands, r = [cands[i] for i in keep], r * eta
    budget += r                                      # 승자 완주
    return cands[0], budget

cands = [(0.03, False), (0.02, False), (0.05, False), (0.01, False), (0.1, False), (0.005, False), (0.3, False), (0.001, False)]
winner, budget = successive_halving(cands)
print(winner, budget, 8 * 8)                        # (0.03, False) 32 64  절반 예산으로 승자

cands2 = [(0.1, False), (0.2, False), (0.0316, True), (0.005, False)]   # 0.0316(늦게 핌)이 사실 최고
print(round(curve(0.0316, True, 1), 2), round(curve(0.0316, True, 16), 2), round(curve(0.1, False, 16), 2))   # 0.37 0.95 0.93
aggressive, _ = successive_halving(cands2, r=1)      # 1에폭 보고 바로 자르는 브래킷
patient = max(cands2, key=lambda c: curve(*c, 16))   # 적게·길게(16에폭) 브래킷
print(aggressive[0], patient[0])                    # 0.1 0.0316  공격적 브래킷은 놓치고 긴 브래킷이 살림 → 여러 브래킷 병행
```

## 관련 개념
[[Bayesian Optimization]] · [[Random Search]] · [[PBT]] · [[Early Stopping]] · [[WandB 실험 기록·Sweeps]]
