---
title: Teacher Forcing
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 이미지캡셔닝, RNN, 학습, AI응용]
---
# Teacher Forcing

## 정의·핵심
- **정의 (응용 8차시, 과제 문항 2)**: RNN 계열 디코더를 학습할 때, 이전 시점에서 모델이 **예측한 단어 대신 실제 정답(Ground Truth) 단어**를 다음 시점의 입력으로 넣어 주는 기법 (교사 강요)
- **왜 쓰나 (강의)**: 학습 초기에는 예측 단어가 틀릴 확률이 높음 → 틀린 단어를 다음 입력으로 쓰면 오류가 **눈덩이처럼 누적**되어 뒤쪽 단어는 엉뚱한 문맥에서 학습 → 정답을 넣어 **학습 속도와 안정성**을 높임
- **학습 흐름 (강의)**
  1. **입력(t−1)**: 이미지 + **정답 단어**(이전 t−1)
  2. **모델 예측(t)**: 다음 단어 확률 분포 생성
  3. **비교**: 예측 vs 정답(t)
  4. **Loss 계산**: Cross-Entropy — 예측 분포와 정답 one-hot의 차이 → [[CrossEntropyLoss]]
  5. **업데이트**: 역전파로 가중치 수정
- **구현 포인트**
  - 입력 = 정답 캡션 `[:-1]` (`<start> w1 … wn`), 목표 = 정답 캡션 `[1:]` (`w1 … wn <end>`) — **한 칸 밀기(shift)**
  - 모든 시점의 입력을 이미 알기 때문에 시퀀스 전체를 **한 번에(병렬로)** 넣어 학습 가능 (Transformer의 causal mask도 같은 원리)
- **단점 — Exposure Bias**: 학습 때는 항상 정답만 보다가, **추론 때는 자기 예측**을 입력으로 받음 → 한 번 틀리면 처음 보는 상황 → 오류 누적
- **완화**: **Scheduled Sampling**(학습이 진행될수록 일정 확률로 자기 예측을 입력), 추론 시 Beam Search → [[Greedy Search·Beam Search]]

## 수식·원리
```
학습 (Teacher Forcing):  h_t = f(h_{t−1}, y*_{t−1})     ← 정답
추론 (Free running):     h_t = f(h_{t−1}, ŷ_{t−1})      ← 자기 예측
입력 = y*[:-1],  목표 = y*[1:]
L = −Σ_t log p(y*_t | y*_{<t}, image)
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
V, E, H = 6, 8, 16                                   # 0=<pad> 1=<start> 2=<end> 3=강아지 4=공 5=문다
emb, lstm, out = nn.Embedding(V, E), nn.LSTM(E, H, batch_first=True), nn.Linear(H, V)
params = list(emb.parameters()) + list(lstm.parameters()) + list(out.parameters())
opt = torch.optim.Adam(params, lr=0.05)
caption = torch.tensor([[1, 3, 4, 5, 2]])            # <start> 강아지 공 문다 <end>
inp, tgt = caption[:, :-1], caption[:, 1:]           # 한 칸 밀기
print(inp.tolist(), tgt.tolist())                    # [[1, 3, 4, 5]] [[3, 4, 5, 2]]

for step in range(100):                              # Teacher Forcing: 정답 시퀀스를 한 번에 입력
    logits = out(lstm(emb(inp))[0])
    loss = nn.functional.cross_entropy(logits.reshape(-1, V), tgt.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()
print(logits.argmax(-1).tolist())                    # [[3, 4, 5, 2]]  정답 문맥에서 다음 단어 예측

with torch.no_grad():                                # 추론: 자기 예측을 다시 입력 (free running)
    w, state, gen = torch.tensor([[1]]), None, []
    for _ in range(4):
        o, state = lstm(emb(w), state)
        w = out(o).argmax(-1); gen.append(w.item())
print(gen)                                           # [3, 4, 5, 2]
```

## 관련 개념
[[CNN Encoder + LSTM Decoder]] · [[Greedy Search·Beam Search]] · [[CrossEntropyLoss]] · [[Autoregressive 모델(언급)]] · [[LSTM]]
