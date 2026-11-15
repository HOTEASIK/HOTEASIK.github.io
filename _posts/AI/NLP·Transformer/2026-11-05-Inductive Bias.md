---
title: Inductive Bias
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [Transformer, ViT, CNN, 비교, AI응용]
---
# Inductive Bias

## 정의·핵심
- **정의**: 모델이 처음 보는 데이터에 대해 일반화하기 위해 **구조 자체에 미리 넣어 둔 가정** (귀납적 편향). 가정이 데이터와 맞으면 **적은 데이터로도** 잘 학습, 틀리거나 제약이 되면 성능 상한을 막음
- **CNN의 Inductive Bias (응용 14차시)**
  - **Locality(지역성)**: 작은 커널로 **가까운 픽셀끼리** 먼저 봄 — "의미 있는 패턴은 국소적"
  - **Translation Equivariance(이동 등변성)**: 같은 필터를 모든 위치에 공유 → 물체가 이동하면 특징 맵도 그만큼 이동 (풀링과 함께 이동 불변성)
  - 계층 구조: 층이 깊어질수록 수용 영역이 서서히 커짐
- **ViT (강의)**: 이런 가정을 **제거**하고 "데이터 간의 관계를 **스스로** 학습" — 패치 분할과 위치 임베딩 정도만 남음 → 처음부터 전역 attention 가능 → [[ViT]]
- **CNN vs ViT 핵심 비교 (강의 표)**

| Feature | CNN (ResNet) | ViT (Transformer) |
|---|---|---|
| Inductive Bias | **강함** (Locality & Invariance) | **약함** (데이터에서 관계 학습) |
| 데이터 요구량 | 적음 (ImageNet-1K 충분) | 매우 많음 (ImageNet-21K / JFT 권장) |
| 학습 효율성 | 빠름 (하드웨어 최적화 우수) | 느림 (많은 연산량 O(N²)) |
| 해석 가능성 | 어려움 (Feature Map 추상적) | 쉬움 (Attention Map 시각화) |
| 전이 학습 | 준수함 | **매우 우수** (대규모 사전학습 시 강력) |

- **언제 무엇을 쓸까 (강의)**
  - **CNN**: 데이터가 적을 때(< 1M 이미지), 빠른 학습/추론, **모바일/엣지 배포**, 사전학습 없이 처음부터 학습
  - **ViT**: 초대규모 데이터 확보 가능, 최고 수준(SOTA) 성능, **대규모 사전학습 모델 파인튜닝**, 판단 근거(Attention)가 중요할 때
- **데이터 규모와 성능 (강의)**: 데이터셋이 커질수록 ViT 성능이 급격히 향상 — 작은 데이터에선 강한 가정을 가진 CNN이, 큰 데이터에선 제약이 적은 ViT가 이김
- **절충형**: DeiT(증류·강한 증강으로 ImageNet-1K만으로 학습), **Swin**(윈도우 attention으로 지역성 재도입), ConvNeXt(CNN을 Transformer식으로 현대화), CNN stem + Transformer
- NLP 대응: RNN의 "순차성" 가정 vs Transformer의 위치 임베딩 → [[Transformer vs RNN·LSTM]]

## 수식·원리
```
Conv: y[i] = Σ_{|k|≤r} w[k] · x[i+k]     → 지역(r) + 가중치 공유
      shift(x, t) → y도 shift(y, t)       (이동 등변성)
Attention: y[i] = Σ_j α_ij(x) · v[j]       → 모든 j (거리 제한 없음), 가중치가 입력에 따라 변함
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
conv = nn.Conv2d(1, 1, 3, padding=1, bias=False)
x = torch.zeros(1, 1, 16, 16); x[0, 0, 4, 4] = 1          # 점 하나
x_shift = torch.roll(x, shifts=(5, 5), dims=(2, 3))       # 5칸 이동
with torch.no_grad():
    y, y_shift = conv(x), conv(x_shift)
print(torch.allclose(torch.roll(y, (5, 5), (2, 3)), y_shift))   # True  이동 등변성 (CNN 구조에 내장)
print(int((y != 0).sum()))                                # 9  3×3 주변만 영향 → Locality

D = 8
attn = nn.MultiheadAttention(D, 1, batch_first=True)
seq = torch.randn(1, 16, D)
seq2 = seq.clone(); seq2[0, 15] += 5                      # 가장 먼 토큰 하나 변경
with torch.no_grad():
    d = (attn(seq, seq, seq)[0][0, 0] - attn(seq2, seq2, seq2)[0][0, 0]).abs().sum().item()
print(d > 0)                                              # True  Attention은 첫 층부터 먼 위치도 참조 (지역성 가정 없음)

conv_p = sum(p.numel() for p in nn.Conv2d(64, 64, 3).parameters())
print(conv_p, 64 * 64 * 9 + 64)                           # 36928 36928  가중치 공유로 파라미터가 위치 수와 무관
```

## 관련 개념
[[ViT]] · [[ViT Attention Map]] · [[합성곱(Convolution)]] · [[Transformer vs RNN·LSTM]] · [[전이학습(Transfer Learning)]]
