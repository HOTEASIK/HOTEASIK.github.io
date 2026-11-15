---
title: RetinaNet(언급)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, OneStage, FocalLoss, AI응용]
---
# RetinaNet(언급)

## 정의·핵심
- **정의**: RetinaNet (2017, Lin et al., FAIR). **Focal Loss**를 제안해 One-Stage 검출기의 고질적인 **전경·배경 극심한 불균형** 문제를 해결하고, **처음으로 Two-Stage 수준의 정확도**를 낸 One-Stage 검출기 (대학원교안 YOLO v3 성능 비교에서 언급: YOLOv3-608 33.0% mAP·51ms vs RetinaNet 32.5%·73ms)
- **문제의식**: One-Stage는 위치마다 앵커를 깔아 **수만~십만 개 후보 중 객체는 극소수** → 쉬운 배경 샘플의 작은 손실이 **수없이 더해져** 학습을 지배 (Two-Stage는 RPN이 후보를 걸러줘 덜함)
- **Focal Loss**: `FL(p_t) = −α_t (1 − p_t)^γ log(p_t)`
  - `(1 − p_t)^γ` (modulating factor): **이미 잘 맞춘 샘플(p_t 큼)의 손실을 0에 가깝게** → 어려운 샘플에 집중
  - γ = 2, α = 0.25가 기본 / γ = 0이면 일반 CE
  - 강의(응용 12차시) 비유: "**쉬운 문제는 배점 낮게, 어려운 문제에 배점 집중**" — YOLO v8 분류 손실 설명에서 사용
  - SSD의 Hard Negative Mining(샘플 선택)과 달리 **모든 샘플을 쓰되 가중치를 자동 조절** → [[Hard Negative Mining]]
- **구조**: ResNet + **FPN**(P3~P7) + 두 개의 서브넷(분류·박스, 각 4층 conv, 레벨 간 가중치 공유) / 위치당 앵커 9개 (3 스케일 × 3 비율)
- **분류 헤드 초기화**: 마지막 bias를 `−log((1 − π)/π)` (π = 0.01)로 → 학습 초기 배경 확률이 높게 시작해 손실 폭주 방지
- **영향**: Focal Loss는 이후 YOLO·FCOS·의료 영상(불균형 분류) 등에 널리 쓰임
- torchvision: `retinanet_resnet50_fpn`, `torchvision.ops.sigmoid_focal_loss`

## 수식·원리
```
CE(p_t) = −log(p_t),   p_t = p (y=1), 1−p (y=0)
FL(p_t) = −α_t (1 − p_t)^γ log(p_t)
p_t = 0.9, γ = 2 → (0.1)² = 0.01배 → 손실 100배 감소
```

## 코드 예시
```python
import torch
from torchvision.ops import sigmoid_focal_loss
import torch.nn.functional as F

logits = torch.tensor([3.0, 0.0, -2.0])               # 배경(타깃 0)에 대한 예측 — 쉬움·보통·어려움(반대로)
target = torch.zeros(3)
ce = F.binary_cross_entropy_with_logits(-logits, target, reduction="none")
fl = sigmoid_focal_loss(-logits, target, alpha=-1, gamma=2.0, reduction="none")
print([round(v, 4) for v in ce.tolist()])            # [0.0486, 0.6931, 2.1269]  CE
print([round(v, 4) for v in fl.tolist()])              # [0.0001, 0.1733, 1.6501]  쉬운 샘플일수록 크게 감소
print([round(v, 3) for v in (fl / ce).tolist()])       # [0.002, 0.25, 0.776]  감소 비율 = (1 − p_t)^γ

pi = 0.01
b = -torch.log(torch.tensor((1 - pi) / pi))
print(round(b.item(), 3), round(torch.sigmoid(b).item(), 3))   # -4.595 0.01  초기 객체 확률 1%
```

## 관련 개념
[[Hard Negative Mining]] · [[FPN·PANet]] · [[Two-Stage vs One-Stage]] · [[YOLO v8]] · [[클래스 불균형 문제]]
