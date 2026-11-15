---
title: OneCycleLR
date: 2026-11-05 12:00:00 +0900
categories: [AI, 학습·최적화]
tags: [학습최적화, 스케줄러]
---
# OneCycleLR

## 정의·핵심
- **정의**: 학습 전체를 **한 번의 사이클**로 보고, 학습률을 **낮은 값 → 최대값(max_lr)까지 올렸다가 → 아주 낮은 값까지 내리는** 스케줄러 (Leslie Smith의 1cycle 정책)
- **구간**
  1. **상승(Warm-up)**: 전체의 약 30%(`pct_start=0.3`) 동안 `max_lr/div_factor`(기본 /25)에서 `max_lr`까지 증가
  2. **하강(Annealing)**: 나머지 동안 코사인으로 `초기값/final_div_factor`(아주 작게)까지 감소
  - SGD와 쓰면 모멘텀은 반대로 움직인다 (lr이 클 때 momentum 작게, 기본 0.85~0.95)
- **장점**: 큰 학습률 구간이 잡음처럼 작용해 넓은 최솟값을 찾고(규제 효과), **짧은 에폭으로 빠르게 좋은 성능** (super-convergence)
- **주의**
  - **배치(스텝)마다** `scheduler.step()` 호출
  - `total_steps` 또는 `epochs`와 `steps_per_epoch=len(train_loader)`를 정확히 줘야 한다 (넘어가면 오류)
  - max_lr은 LR Range Test로 찾거나 평소 lr의 3~10배

## 수식·원리
```
초기 lr = max_lr / div_factor(25)
0 ~ pct_start·T:    초기 lr → max_lr   (증가)
pct_start·T ~ T:    max_lr → 초기 lr / final_div_factor(1e4)   (코사인 감소)
```

## 코드 예시
```python
import torch

w = torch.zeros(1, requires_grad=True)
opt = torch.optim.SGD([w], lr=0.1, momentum=0.9)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=0.1, epochs=2, steps_per_epoch=5)
lrs = []
for epoch in range(2):
    for step in range(5):                # 배치마다
        lrs.append(opt.param_groups[0]["lr"])
        opt.step(); sched.step()
print([round(v, 3) for v in lrs])   # [0.004, 0.052, 0.1, 0.095, 0.081, 0.061, 0.039, 0.019, 0.005, 0.0]
print(lrs.index(max(lrs)))          # 2  ← 약 30% 지점에서 최대, 끝은 거의 0
```

## 관련 개념
[[학습률 스케줄러 개념]] · [[Warm-up]] · [[Momentum]] · [[학습률]]
