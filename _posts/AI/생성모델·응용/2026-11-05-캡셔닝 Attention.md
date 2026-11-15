---
title: 캡셔닝 Attention
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 이미지캡셔닝, Attention, AI응용]
---
# 캡셔닝 Attention

## 정의·핵심
- **정의 (응용 8차시 "Attention: 어디를 보고 말하나?")**: 디코더가 단어를 **생성할 때마다 이미지의 관련 영역에 집중(Attend)** 하는 메커니즘 (Show, Attend and Tell, Xu et al. 2015)
- **인간의 시각 인식 모방 (강의)**: "강아지가 공을 문다"라고 말할 때 '공'을 말하는 순간 시선이 공을 향하는 것과 같은 원리 (예: "Frisbee"를 생성할 때 프리스비 영역이 밝아지는 Attention Map)
- **동적 가중치 (강의)**: LSTM의 **매 시점(Time Step)** 마다 이미지의 각 영역(**feature map grid**)에 대해 중요도를 다르게 계산
  - 인코더 출력을 벡터 하나로 줄이지 않고 **공간 격자 그대로** 사용 (예: ResNet 마지막 conv → 7×7 = 49개 영역 × 2048차원)
  - 디코더 hidden state h_{t−1}과 각 영역 특징 a_i의 **점수 → softmax → 가중치 α_t,i**
  - **Context Vector** `c_t = Σ_i α_t,i·a_i` 를 그 시점 LSTM 입력에 함께 넣음
- **효과 (강의)**
  - **성능·정확도 향상**: 모든 정보를 하나의 벡터에 압축하던 기존 방식의 **정보 손실 문제** 해결 → 긴 문장 생성에 유리
  - **설명 가능성(Interpretability)**: 캡션 생성 시 이미지의 어느 부분을 보고 판단했는지 **히트맵으로 시각화** 가능
- **Soft vs Hard Attention (강의)**
  - **Soft**: 모든 영역을 확률(가중 평균)로 봄 → **미분 가능** → 역전파로 학습, **더 널리 사용**
  - **Hard**: 특정 영역 하나만 선택(샘플링) → 미분 불가, 강화학습(REINFORCE) 필요
- 이후 Transformer의 **Self/Cross-Attention**으로 발전 → 멀티모달 모델의 표준 → [[Attention 개념]]

## 수식·원리
```
a_i ∈ ℝ^D  (i = 1..L, 이미지 영역 특징)
e_t,i = w^T tanh(W_a a_i + W_h h_{t−1})          (Bahdanau / additive)
α_t = softmax(e_t),   Σ_i α_t,i = 1
c_t = Σ_i α_t,i a_i
h_t = LSTM([E w_{t−1} ; c_t], h_{t−1})
```

## 코드 예시
```python
import torch
import torch.nn as nn

class SoftAttention(nn.Module):
    def __init__(self, feat_dim, hid_dim, att_dim):
        super().__init__()
        self.Wa, self.Wh, self.w = nn.Linear(feat_dim, att_dim), nn.Linear(hid_dim, att_dim), nn.Linear(att_dim, 1)
    def forward(self, feats, h):                         # feats (B, L, D), h (B, H)
        e = self.w(torch.tanh(self.Wa(feats) + self.Wh(h).unsqueeze(1))).squeeze(-1)   # (B, L)
        alpha = e.softmax(1)
        return (alpha.unsqueeze(-1) * feats).sum(1), alpha    # context (B, D), 가중치 (B, L)

torch.manual_seed(0)
fmap = torch.rand(2, 2048, 7, 7)                         # CNN 마지막 특징 맵
feats = fmap.flatten(2).transpose(1, 2)                  # (2, 49, 2048)  영역 49개
att = SoftAttention(2048, 512, 256)
ctx, alpha = att(feats, torch.rand(2, 512))
print(tuple(feats.shape), tuple(ctx.shape), tuple(alpha.shape))   # (2, 49, 2048) (2, 2048) (2, 49)
print(torch.allclose(alpha.sum(1), torch.ones(2)))       # True  영역 가중치 합 = 1
print(tuple(alpha[0].view(7, 7).shape))                  # (7, 7)  히트맵으로 시각화
```

## 관련 개념
[[CNN Encoder + LSTM Decoder]] · [[Attention 개념]] · [[이미지 캡셔닝 개요]] · [[Feature Map]]
