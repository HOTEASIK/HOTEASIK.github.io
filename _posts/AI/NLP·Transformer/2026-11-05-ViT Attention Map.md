---
title: ViT Attention Map
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [Transformer, ViT, 시각화, 설명가능성, AI응용]
---
# ViT Attention Map

## 정의·핵심
- **정의**: ViT 내부 Self-Attention 가중치(특히 **[CLS] 토큰이 각 패치에 주는 가중치**)를 이미지 격자(14×14)로 되돌려 **모델이 어디를 보고 판단했는지** 시각화한 것 (응용 14차시 "ViT Attention Map")
- **층별로 보는 것 (강의)** — 층이 깊어질수록 **지역 정보 → 전역 문맥**으로 시야 확장
  - **Layer 3 (Low Level)**: 지역적 패턴 — 텍스처, 엣지 등 **인접 패치**에 집중
  - **Layer 7 (Mid Level)**: 객체 부위(Parts) — 귀, 눈, 코 등 의미 있는 부분
  - **Layer 12 (High Level)**: 전체 객체(Global) — 고양이 형체 전체와 분류 정보
- **[CLS] Token의 역할 (강의)**: 최종 분류를 담당하는 [CLS]는 마지막 레이어에서 이미지의 **가장 특징적인 부분(Discriminative Region)** 에 강하게 Attention 집중
  - **CNN은 고정된 필터로 주변만** 보지만, **ViT는 필요한 곳을 스스로 선택**해서 봄
- **Attention Distance vs Network Depth (강의)**: 층이 깊어질수록 **평균 Attention 거리(참조 범위)가 증가** — 얕은 층에서도 일부 head는 처음부터 멀리 봄 (CNN의 수용 영역은 층마다 조금씩만 커짐)
- **Attention Rollout**: 한 층만 보면 잡음이 많음 → 층별 attention 행렬에 잔차(단위 행렬)를 더해 정규화한 뒤 **누적 곱** → 입력 패치까지의 정보 흐름 추정
- **해석 가능성 비교 (강의)**: CNN은 Feature Map이 추상적이라 **어려움**(Grad-CAM 등 별도 기법 필요) / ViT는 Attention Map 시각화로 **쉬움** — 의료 등 "판단 근거가 중요할 때" ViT 선택 이유 중 하나 → [[Inductive Bias]]
- NLP에서도 같은 방식으로 "it → animal" 같은 단어 관계를 시각화 → [[Self-Attention]]

## 수식·원리
```
A^l ∈ ℝ^{h×197×197}  (l층, head h개)
CLS 맵: a = mean_h A^l[h, 0, 1:]  → reshape(14, 14) → 224×224로 업샘플 → 이미지 위에 히트맵
Rollout: R = Π_l norm(mean_h A^l + I)
평균 거리: d^l = Σ_{i,j} A^l_ij · ‖pos_i − pos_j‖
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(0)
D, H = 64, 4
tokens = torch.randn(1, 197, D)                        # [CLS] + 196 패치 (가상)
tokens[0, 1 + 14 * 7 + 7] += 3                         # 중앙 패치(7, 7)가 특징적이라고 가정
attn = nn.MultiheadAttention(D, H, batch_first=True)
with torch.no_grad():
    attn.in_proj_weight.copy_(torch.cat([torch.eye(D)] * 3))   # 설명용: Q=K=V=입력
    _, w = attn(tokens, tokens, tokens, average_attn_weights=True)   # (1, 197, 197)
cls_map = w[0, 0, 1:].view(14, 14)                     # [CLS]가 각 패치에 준 가중치
print(tuple(cls_map.shape), divmod(cls_map.argmax().item(), 14))   # (14, 14) (7, 7)  가장 특징적인 영역에 집중
heat = F.interpolate(cls_map[None, None], size=(224, 224), mode="bilinear")
print(tuple(heat.shape))                               # (1, 1, 224, 224)  이미지 위에 겹쳐 그림

layers = [w[0]] * 3                                    # Attention Rollout
R = torch.eye(197)
for A in layers:
    A = A + torch.eye(197); A = A / A.sum(-1, keepdim=True)
    R = A @ R
print(round(R[0].sum().item(), 3))                     # 1.0  행 합 유지
```

## 관련 개념
[[ViT]] · [[Self-Attention]] · [[Patch Embedding·CLS 토큰]] · [[Inductive Bias]] · [[캡셔닝 Attention]]
