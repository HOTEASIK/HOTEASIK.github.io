---
title: Style Loss
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 스타일전이, 손실함수, AI응용]
---
# Style Loss

## 정의·핵심
- **정의**: 생성 이미지가 **스타일 이미지의 질감(Texture)·색상(Color)·패턴(Pattern)** 을 따르도록, 여러 층에서 두 이미지의 **Gram Matrix 차이(MSE)** 를 벌점으로 주는 손실 (응용 6차시 "스타일 손실")
- **계산 원리 (강의)**: CNN의 **여러 계층**에서 얻은 **특징 맵 간의 상관관계(Correlation)** 를 비교 → 특징 간의 상호작용을 수치화 → 스타일 이미지의 패턴이 생성 이미지에 반영되도록 유도
  - **G^l_ij, A^l_ij (강의)**: 각각 **생성 이미지와 스타일 이미지의 Gram Matrix** (l층, i·j번째 특징의 상호작용) → [[Gram Matrix]]
- **왜 Gram Matrix인가**: 특징 맵을 **위치에 대해 합산**하므로 "어디에 있는지"(공간 배치) 정보가 사라지고 **"어떤 특징들이 함께 나타나는지"** 만 남음 → 배치와 무관한 **질감·스타일** 표현
- **여러 층 사용**: conv1_1, conv2_1, conv3_1, conv4_1, conv5_1 — 얕은 층은 **작은 붓터치·색**, 깊은 층은 **큰 패턴** → 층별 가중치 w_l(보통 균등)로 합산
- **과제 문항 5 — GramMSELoss**: `forward(input, target) = MSE(GramMatrix(input), target)` — target은 **스타일 이미지의 Gram Matrix**(미리 계산해 고정)
- **과제 문항 6 — 총 손실**: `total = content_weight·content_loss + style_weight·style_loss` → `total.backward()` → `optimizer.step()`
- style_weight를 키우면 스타일이 강해지고 콘텐츠 형태가 약해짐 → 트레이드오프

## 수식·원리
```
G^l_ij = Σ_k F^l_ik F^l_jk        (생성 이미지),   A^l = 스타일 이미지의 Gram
E_l = 1 / (4 N_l² M_l²) · Σ_{i,j} (G^l_ij − A^l_ij)²
L_style(a, x) = Σ_l w_l · E_l
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GramMatrix(nn.Module):
    def forward(self, x):
        b, c, h, w = x.size()
        f = x.view(b, c, h * w)                          # (batch, channel, h*w)
        return torch.bmm(f, f.transpose(1, 2))           # (batch, channel, channel)

class GramMSELoss(nn.Module):                            # 과제 문항 5
    def forward(self, input, target):
        return F.mse_loss(GramMatrix()(input), target)

torch.manual_seed(0)
style_feat = torch.rand(1, 4, 8, 8)
target = GramMatrix()(style_feat).detach()
shuffled = style_feat.flatten(2)[:, :, torch.randperm(64)].view(1, 4, 8, 8)   # 위치만 섞음
other = torch.rand(1, 4, 8, 8)
print(round(GramMSELoss()(shuffled, target).item(), 6))  # 0.0  위치가 바뀌어도 스타일 손실은 0
print(GramMSELoss()(other, target).item() > 0)           # True  다른 질감은 손실 발생

content_loss, style_loss = torch.tensor(0.5), torch.tensor(2e-3)   # 과제 문항 6
content_weight, style_weight = 1.0, 1e3
total = content_weight * content_loss + style_weight * style_loss
print(round(total.item(), 2))                            # 2.5
```

## 관련 개념
[[Gram Matrix]] · [[Content Loss]] · [[신경망 스타일 전이(NST)]] · [[Feature Map]]
