---
title: Feature Extraction vs Fine-tuning
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 전이학습, AI개론]
---
# Feature Extraction vs Fine-tuning

## 정의·핵심
- **두 가지 전이 방식**
  - **Feature Extraction (특징 추출)**: 사전학습 백본을 **완전히 동결**하고 고정된 특징 추출기로만 사용. **새 분류부(head)만 학습**
  - **Fine-tuning (미세 조정)**: 사전학습 가중치에서 출발해 백본의 **일부 또는 전부를 함께 학습** (작은 학습률)
- **층별 동결 전략 3가지 (개론 14차시 실험: ResNet-50, 5클래스 × 500장)**
  1. **Full Freeze**: head만 학습 — 가장 빠르고 과적합이 적지만 성능 한계
  2. **Partial Fine-tuning**: 마지막 1~2 블록(layer4 등) + head 학습
  3. **Full Fine-tune**: 전체 학습 — 데이터가 많을 때 최고 성능, 과적합 위험
  - 측정: 검증 정확도, 에폭당 학습 시간, **과적합 갭(train acc − val acc)**
  - 제어는 모두 `requires_grad` 하나로: "이 간단한 메커니즘이 모델의 학습 방식을 근본적으로 바꾼다"
- **선택 플로차트 (개론 14차시)**

| 목표 데이터 크기 | 전략 |
|---|---|
| 매우 작음 (< 1,000) | **Full Freeze** |
| 중간 (1K~10K) | **Partial Fine-tuning** — 도메인이 비슷하면 마지막 1~2 블록 |
| 큼 (> 10K) | **Full Fine-tune** (강한 정규화 필요) |

- 도메인이 많이 다르면(의료·위성) 데이터가 적어도 더 깊이 풀어야 할 수 있다
- **차등 학습률 (Discriminative LR)**: 파라미터 그룹마다 lr을 다르게 — 백본은 작게(1e-4), head는 크게(1e-2). 강의 실험: 단일 lr 대비 **7에폭 빨리 수렴, 최종 정확도 4.9%↑**, 사전학습 특징을 잘 보존
- **Gradual Unfreezing (점진적 해제)**: 에폭 1~5 head만 → 6~10 + layer4 → 11~15 + layer3 → 16~ 전체
- **작은 데이터셋 권장 프로토콜 (강의)**: 클래스당 < 100장이면 **2단계 학습** — ① 동결 상태로 head 학습 → ② 일부 해제 후 작은 lr로 미세 조정 + 강한 증강·정규화

## 수식·원리
```
Feature Extraction:  θ_backbone 고정,  min_{θ_head} L
Fine-tuning:         min_{θ_backbone, θ_head} L,  lr_backbone ≪ lr_head
```

## 코드 예시
```python
import torch
import torch.nn as nn
from torchvision import models

def build(strategy):
    net = models.resnet18(weights=None)
    net.fc = nn.Linear(512, 5)
    for name, p in net.named_parameters():
        if strategy == "full_freeze":
            p.requires_grad = name.startswith("fc")
        elif strategy == "partial":
            p.requires_grad = name.startswith(("layer4", "fc"))
        else:
            p.requires_grad = True
    return net

for s in ("full_freeze", "partial", "full"):
    net = build(s)
    print(s, sum(p.numel() for p in net.parameters() if p.requires_grad))
# full_freeze 2565
# partial 8396293
# full 11179077

net = build("full")
opt = torch.optim.SGD([                                   # 차등 학습률
    {"params": [p for n, p in net.named_parameters() if not n.startswith("fc")], "lr": 1e-4},
    {"params": net.fc.parameters(), "lr": 1e-2}], momentum=0.9)
print([g["lr"] for g in opt.param_groups])                # [0.0001, 0.01]
```

## 관련 개념
[[전이학습(Transfer Learning)]] · [[레이어 동결]] · [[출력층 교체]] · [[학습률]] · [[과적합(Overfitting)]] · [[데이터 증강]]
