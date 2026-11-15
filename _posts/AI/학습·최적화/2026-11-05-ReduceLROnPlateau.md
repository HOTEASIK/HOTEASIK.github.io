---
title: ReduceLROnPlateau
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 스케줄러, AI개론]
---
# ReduceLROnPlateau

## 정의·핵심
- **정의**: 지켜보는 지표(보통 **검증 손실**)가 **일정 에폭 동안 좋아지지 않으면(plateau, 정체)** 학습률을 줄이는 스케줄러. 미리 정한 시간표가 아니라 **학습 상황을 보고 반응**한다
- **주요 인자**
  - `mode='min'`: 지표가 작을수록 좋음(손실). 정확도를 보면 `'max'`
  - `factor=0.1`: 줄일 때 곱할 값 (새 lr = lr × factor). 0.5도 자주 씀
  - `patience=10`: **개선 없이 참을 에폭 수**. 이 횟수를 넘기면 줄인다
  - `threshold=1e-4`: 이 정도 이하의 개선은 개선으로 치지 않음
  - `cooldown`: 줄인 뒤 다시 지켜보기 전 쉬는 에폭, `min_lr`: 하한
- **호출법이 다르다**: `scheduler.step(val_loss)` — **지표 값을 넘겨야** 한다 (에폭 끝, 검증 후)
- **장점**: 몇 에폭에 줄일지 미리 몰라도 된다 → 처음 보는 데이터·모델에 편리
- **Early Stopping과 함께**: 학습률을 몇 번 줄여도 개선이 없으면 학습 종료 → [[Early Stopping]] (patience는 Early Stopping보다 짧게)

## 수식·원리
```
if val_loss가 patience 에폭 연속 best보다 (threshold 이상) 개선되지 않음:
    lr ← max(lr × factor, min_lr)
```

## 코드 예시
```python
import torch

w = torch.zeros(1, requires_grad=True)
opt = torch.optim.SGD([w], lr=0.1)
sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode="min", factor=0.5, patience=2)
val_losses = [1.0, 0.8, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7]   # 3번째 에폭 이후 정체
lrs = []
for v in val_losses:
    opt.step()
    sched.step(v)                       # 지표 값을 넘긴다
    lrs.append(opt.param_groups[0]["lr"])
print(lrs)    # [0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.025]
```

## 관련 개념
[[학습률 스케줄러 개념]] · [[Early Stopping]] · [[학습 곡선]] · [[학습률]]
