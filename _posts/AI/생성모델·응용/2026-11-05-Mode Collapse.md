---
title: Mode Collapse
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, GAN, 학습, AI응용]
---
# Mode Collapse

## 정의·핵심
- **정의**: GAN의 생성자가 데이터 분포의 **일부 모드(봉우리)만** 생성하고, 노이즈 z가 달라도 **비슷한 출력만 반복**하는 현상 (응용 7차시 GAN의 문제점)
  - 예: MNIST 학습인데 "1"만 계속 생성, 얼굴 GAN이 비슷한 얼굴만 생성
- **원인**
  - G의 목표는 "D를 속이는 것"이지 "**다양하게** 만드는 것"이 아님 → D가 지금 약한 지점 하나로 몰리는 것이 G에게 가장 쉬운 해
  - D가 그 지점을 잡아내면 G는 **다른 한 지점으로 이동** → 모드 사이를 맴도는 진동
  - 교대 최적화가 min-max 해를 보장하지 못함 (max-min으로 풀리는 경향)
- **판별 방법**: 여러 z로 뽑은 샘플이 거의 같음, 생성 샘플의 **분산·클래스 분포**가 실제보다 작음, 다양성 지표(Recall, FID 상승)
- **완화 방법**
  - **Minibatch Discrimination / Minibatch std**: D가 배치 안 샘플들의 유사도를 보게 함 → 똑같은 샘플만 내면 가짜로 판별
  - **WGAN / WGAN-GP**: JS 발산 대신 **Wasserstein 거리** → 기울기가 안정적
  - **Unrolled GAN**: G 업데이트 때 D의 미래 업데이트 몇 단계를 고려
  - **Conditional GAN**: 클래스 조건을 주어 클래스별 생성 강제 → [[Conditional GAN]]
  - 학습률·D/G 비율 조정, 데이터 증강
- **VAE와 비교**: VAE는 재구성 손실로 **모든 데이터**를 설명해야 하므로 mode collapse가 적음 (대신 흐릿함) → [[GAN vs VAE]]

## 수식·원리
```
데이터: p_data = ½N(−4, 1) + ½N(4, 1)   (모드 2개)
붕괴:   p_g ≈ N(4, σ)  (한 모드만)
다양성 점검: 생성 샘플의 모드별 비율 / 분산 / 쌍별 거리
```

## 코드 예시
```python
import numpy as np

rng = np.random.default_rng(0)
real = np.concatenate([rng.normal(-4, 1, 500), rng.normal(4, 1, 500)])   # 모드 2개
healthy = np.concatenate([rng.normal(-4, 1, 500), rng.normal(4, 1, 500)])
collapsed = rng.normal(4, 0.3, 1000)                                     # 한 모드에만 몰린 G

def coverage(s): return round(float((s < 0).mean()), 2), round(float((s > 0).mean()), 2)
def pair_dist(s): return round(np.abs(s[:500] - s[500:]).mean(), 2)
print(coverage(real), coverage(healthy), coverage(collapsed))   # (0.5, 0.5) (0.5, 0.5) (0.0, 1.0)
print(pair_dist(healthy) > pair_dist(collapsed))                 # True  붕괴 시 샘플끼리 비슷함
print(round(real.std(), 1), round(collapsed.std(), 1))           # 실제 분산보다 훨씬 작음
```

## 관련 개념
[[GAN]] · [[GAN 학습]] · [[Conditional GAN]] · [[GAN vs VAE]]
