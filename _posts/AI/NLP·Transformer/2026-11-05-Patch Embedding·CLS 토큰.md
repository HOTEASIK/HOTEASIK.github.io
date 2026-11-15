---
title: Patch Embedding·CLS 토큰
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [Transformer, ViT, 임베딩, AI응용]
---
# Patch Embedding·CLS 토큰

## 정의·핵심
- **Patch(패치)**: 이미지를 **고정 크기의 작은 조각**(16×16)으로 자른 것 — CNN이 2D 픽셀 그리드를 그대로 처리하는 것과 달리, ViT는 Transformer를 쓰기 위해 이미지를 **1차원 시퀀스**로 바꿔야 함 (응용 14차시 과제 문제 1)
- **Patch Embedding**: 패치를 **Flatten + Linear Projection** 해 D차원 벡터(토큰)로 변환하는 과정 전체 (과제 문제 1의 답: 패치 / 패치 임베딩)
  - 224×224×3 → 14×14 = **196 패치**, 각 16×16×3 = **768** 차원 → Linear(768 → 768) → `[196, 768]`
  - 구현상 **Conv2d(3, 768, kernel=16, stride=16)** 와 동일 — 겹치지 않게 16칸씩 이동하는 합성곱 = 패치별 같은 선형 변환
  - 패치 크기 P가 작을수록 토큰 수 N = HW/P² 가 늘어 정밀하지만 attention 비용 O(N²) 증가
- **Position Embedding (강의 4단계)**: 패치의 **원래 위치 정보**를 더해줌 (순서 정보 제공) — ViT는 **학습형** 1D 위치 임베딩 `[197, 768]` → [[Positional Encoding]]
  - 입력 해상도를 바꿔 파인튜닝할 땐 위치 임베딩을 2D 보간해 사용
- **[CLS] Token (과제 문제 2)**: 입력 시퀀스 **맨 앞에 추가되는 학습 가능한 특수 토큰** — Transformer 인코더를 통과한 후 이 토큰의 출력 벡터가 **이미지 전체 정보를 요약**한다고 보고 **최종 분류**에 사용 (BERT의 [CLS]와 같은 아이디어 → [[BERT]])
  - 총 토큰: 196 + 1 = **197**
  - 처음엔 이미지와 무관한 파라미터 → Self-Attention으로 모든 패치를 참조하며 정보를 모음
  - 대안: 모든 패치 출력의 **평균(Global Average Pooling)** 으로 분류 (DeiT, 일부 변형)
- **HF 전처리 (과제 문제 3·4)**: `AutoImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")` → `processor(images=..., return_tensors="pt")["pixel_values"]` — resize(224), 정규화, 텐서 변환을 자동으로 → [[ViT 파인튜닝 실습]]

## 수식·원리
```
N = (H/P)·(W/P) = (224/16)² = 196,   patch_dim = P²·C = 16·16·3 = 768
z_0 = [x_cls ; x_p¹E ; ... ; x_p¹⁹⁶E] + E_pos      ∈ ℝ^{197×768}
Conv2d(C, D, kernel=P, stride=P) ≡ 패치별 Linear(P²C → D)
분류: y = Head(z_L[0])      ([CLS] 출력)
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
img = torch.rand(1, 3, 224, 224)
P, D = 16, 768

patches = img.unfold(2, P, P).unfold(3, P, P)                       # (1, 3, 14, 14, 16, 16)
patches = patches.permute(0, 2, 3, 1, 4, 5).reshape(1, -1, 3 * P * P)
print(tuple(patches.shape))                                         # (1, 196, 768)  Flatten

proj = nn.Linear(3 * P * P, D)
conv = nn.Conv2d(3, D, kernel_size=P, stride=P)
with torch.no_grad():
    conv.weight.copy_(proj.weight.view(D, 3, P, P)); conv.bias.copy_(proj.bias)
    a = proj(patches)
    b = conv(img).flatten(2).transpose(1, 2)
print(torch.allclose(a, b, atol=1e-4))                              # True  Linear Projection = stride 16 합성곱

cls_token = nn.Parameter(torch.zeros(1, 1, D))
pos_embed = nn.Parameter(torch.randn(1, 197, D) * 0.02)
z0 = torch.cat([cls_token.expand(1, -1, -1), a], 1) + pos_embed
print(tuple(z0.shape))                                              # (1, 197, 768)  CLS + 196 패치

enc = nn.TransformerEncoder(nn.TransformerEncoderLayer(D, 12, 3072, batch_first=True), 1)
head = nn.Linear(D, 3)                                              # Beans 3클래스
print(tuple(head(enc(z0)[:, 0]).shape))                             # (1, 3)  [CLS] 출력으로 분류
```

## 관련 개념
[[ViT]] · [[Positional Encoding]] · [[BERT]] · [[ViT 파인튜닝 실습]] · [[임베딩]] · [[합성곱(Convolution)]]
