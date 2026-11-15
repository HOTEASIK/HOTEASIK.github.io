---
title: Gradient Accumulation
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [GradientAccumulation, 배치, 메모리, 학습효율, 보충]
---
# Gradient Accumulation

## 정의·핵심
- **정의 (보충 2_6 STEP 4)**: "**물리 배치는 작게, 유효 배치는 크게**" — 메모리가 부족해 큰 배치를 못 쓸 때, **여러 미니배치의 기울기를 모아 한 번에 업데이트**해 큰 배치 효과
  - **유효 배치 = 실제 배치 × 누적 횟수** (예: 64 × 4 = 256)
  - 메모리는 작은 배치 수준인데, 갱신은 큰 배치처럼 → 작은 GPU(Colab T4)에서 큰 배치의 안정성을 흉내 내는 표준 기법 → [[미니배치·배치 크기]]
- **코드 포인트 3가지 (보충 02)**
  1. **손실 ÷ accum**: N번 backward하면 기울기가 N번 **더해짐** → 미리 나눠 **평균** 유지 (2_6 연습 문제 4: 큰 배치 한 번의 평균 기울기와 같아지게)
  2. **N번마다 step**: `if (i + 1) % accum == 0:` 일 때만 갱신
  3. **step 후 zero_grad**: 안 하면 계속 쌓임
  - AMP와 자연스럽게 결합 (`scaler.scale(loss / accum).backward()`) → [[AMP(혼합 정밀도)]]
- **유효 배치 계산 (강의 표)**: 256 × 1 = 256 (메모리 큼, OOM 위험) / 64 × 4 = 256 (작음, 안전) / 32 × 8 = 256 (가장 작음)
- **주의점 (강의)**
  - **BatchNorm**: 통계는 '**실제 배치**' 기준 → 유효 배치가 커도 BN은 작은 배치처럼 동작 → [[Batch Normalization]]
  - **lr 재조정**: 유효 배치를 키우면 학습률도 함께 키우는 게 보통 (선형/√ 스케일링)
  - **속도는 그대로**: 메모리만 아낄 뿐 계산량 동일 → 시간 단축 효과 없음
  - 사용처: '큰 배치가 좋은데 **메모리가 부족할 때**' — 메모리가 충분하면 그냥 배치를 키우는 게 빠름. AMP로도 모자랄 때 다음 카드 → [[GPU 메모리 부족(OOM) 대응]]

## 수식·원리
```
큰 배치 B = N·b 의 기울기:  g = (1/B) Σ_{i=1}^{B} ∇ℓ_i = (1/N) Σ_{k=1}^{N} [ (1/b) Σ_{i∈k} ∇ℓ_i ]
→ 각 미니배치 손실을 N으로 나눠 backward를 N번 누적 = 큰 배치 1번
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
X = torch.randn(256, 8); y = torch.randn(256, 1)
base = nn.Linear(8, 1)

big = nn.Linear(8, 1); big.load_state_dict(base.state_dict())      # 방법 A: 배치 256 한 번
nn.functional.mse_loss(big(X), y).backward()

acc = nn.Linear(8, 1); acc.load_state_dict(base.state_dict())      # 방법 B: 배치 64 × 4번 누적
accum = 4
opt = torch.optim.SGD(acc.parameters(), lr=0.1); opt.zero_grad()
for i, (xb, yb) in enumerate(zip(X.split(64), y.split(64))):
    loss = nn.functional.mse_loss(acc(xb), yb) / accum             # ① 손실 나누기
    loss.backward()                                                 # 기울기 누적
    if (i + 1) % accum == 0:                                        # ② N번마다
        grad_acc = acc.weight.grad.clone()
        opt.step(); opt.zero_grad()                                 # ③ 갱신 후 초기화
print(torch.allclose(big.weight.grad, grad_acc, atol=1e-6))        # True  유효 배치 256과 같은 기울기

wrong = nn.Linear(8, 1); wrong.load_state_dict(base.state_dict())  # 나누지 않으면 4배
for xb, yb in zip(X.split(64), y.split(64)):
    nn.functional.mse_loss(wrong(xb), yb).backward()
print(round((wrong.weight.grad / big.weight.grad).mean().item(), 2))   # 4.0
print(64 * 4, 32 * 8)                                               # 256 256  유효 배치
```

## 관련 개념
[[AMP(혼합 정밀도)]] · [[GPU 메모리 부족(OOM) 대응]] · [[미니배치·배치 크기]] · [[Batch Normalization]] · [[학습률]]
