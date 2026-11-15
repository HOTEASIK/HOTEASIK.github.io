---
title: item·numpy 변환
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, PyTorch, AI개론]
---
# item·numpy 변환

## 정의·핵심
- **`t.item()`**: 원소가 **1개인 텐서**에서 파이썬 숫자(float·int)를 꺼낸다.
  - 손실 기록: `history.append(loss.item())` — 텐서째 저장하면 계산 그래프까지 붙잡아 **메모리가 계속 늘어난다.**
  - 맞힌 개수: `(pred == labels).sum().item()`
  - 원소가 2개 이상이면 오류 → `tolist()` 사용
- **`t.numpy()`**: 텐서를 NumPy 배열로 바꾼다. 조건 두 가지
  1. **CPU에 있어야 한다** → GPU 텐서는 `.cpu()` 먼저
  2. **기울기 추적 중이면 안 된다** → `.detach()` 먼저 (`requires_grad=True`인 파라미터·출력)
  - 그래서 관용구가 `t.detach().cpu().numpy()`
  - 12차시: `probs.data.to('cpu').numpy()[0]` (`.data`는 옛 방식의 detach)
- **언제 numpy로 바꾸나**: Matplotlib으로 그리기, sklearn 지표 계산(`confusion_matrix`, `f1_score`), 가중치 값 출력
- **메모리 공유**: CPU 텐서의 `.numpy()` 결과는 텐서와 메모리를 공유한다. 독립 복사본이 필요하면 `.copy()`.
- `t.tolist()`: 파이썬 리스트로 (JSON 저장 등)

## 수식·원리
```
GPU + grad 텐서 ─detach()─▶ grad 없음 ─cpu()─▶ CPU ─numpy()─▶ ndarray
1원소 텐서 ─item()─▶ float/int
```

## 코드 예시
```python
import torch

loss = torch.tensor(0.1767, requires_grad=True) * 1
print(type(loss.item()), round(loss.item(), 4))    # <class 'float'> 0.1767

pred = torch.tensor([0, 2, 1]); labels = torch.tensor([0, 1, 1])
print((pred == labels).sum().item())                # 2

w = torch.nn.Linear(2, 1).weight
try:
    w.numpy()
except RuntimeError:
    print("detach 필요")                             # detach 필요
print(w.detach().cpu().numpy().shape)               # (1, 2)
print(torch.tensor([[1, 2]]).tolist())              # [[1, 2]]
```

## 관련 개념
[[Tensor 생성]] · [[device와 GPU]] · [[requires_grad]] · [[학습 곡선 그리기]] · [[argmax와 max]]
