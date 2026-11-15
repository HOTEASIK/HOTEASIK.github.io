---
title: manual_seed
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# manual_seed

## 정의·핵심
- **정의**: 난수 생성기의 시작값(시드)을 고정하는 함수. `torch.manual_seed(123)`
- **왜 필요한가 — 재현성**: 딥러닝에는 난수가 많다. 가중치 초기값, 데이터 섞기(shuffle), Dropout, 데이터 증강. 시드를 고정하면 **실행할 때마다 같은 결과**가 나와서
  - 실험끼리 공정하게 비교할 수 있고 (옵티마이저 A vs B)
  - 결과를 다른 사람이 재현할 수 있다.
- **강의 관례**: 모델 인스턴스를 만들기 직전에 `torch.manual_seed(123)` — 같은 초기 가중치에서 출발시키기 위해 (7차시 `nn.Linear(1, 1)` 초기값이 항상 `-0.4078`)
- **같이 고정할 것** (보충 2_6, 5차시 "재현성을 위한 시드 고정")
  - `random.seed(s)`, `np.random.seed(s)`, `torch.manual_seed(s)`, `torch.cuda.manual_seed_all(s)`
  - 데이터 분할: `train_test_split(..., random_state=42)`
  - GPU 연산까지 완전히 같게: `torch.backends.cudnn.deterministic = True`, `benchmark = False` (대신 느려질 수 있음)
- **주의**: 시드는 "그 시점부터의 난수 순서"를 고정한다. 코드 중간에 난수를 쓰는 줄이 추가되면 이후 값이 달라진다.

## 수식·원리
```
seed 고정 → 난수 순서 고정 → 초기 가중치·셔플·dropout 동일 → 같은 결과
```

## 코드 예시
```python
import random
import numpy as np
import torch
import torch.nn as nn

def set_seed(s=42):
    random.seed(s); np.random.seed(s)
    torch.manual_seed(s); torch.cuda.manual_seed_all(s)

torch.manual_seed(123)
l1 = nn.Linear(1, 1)
print(l1.weight)            # tensor([[-0.4078]], requires_grad=True) (7차시와 같은 값)

set_seed(42); a = torch.randn(3)
set_seed(42); b = torch.randn(3)
print(torch.equal(a, b))    # True
```

## 관련 개념
[[재현성]] · [[nn.init]] · [[train·val·test 분할]] · [[DataLoader]]
