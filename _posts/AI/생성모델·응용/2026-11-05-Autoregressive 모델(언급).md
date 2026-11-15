---
title: Autoregressive 모델(언급)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 자기회귀, 언어모델, AI응용]
---
# Autoregressive 모델(언급)

## 정의·핵심
- **정의**: 데이터를 순서 있는 원소 `x_1, x_2, …, x_n` 으로 보고, **이전 원소들로 다음 원소의 확률**을 예측하는 생성 모델. 보충 생성형 AI 2주차 분류에서 **잠재변수를 쓰지 않는** 생성 모델로 언급
- **핵심 원리 — 확률의 체인룰(Chain Rule)**
  - `p(x) = p(x_1)·p(x_2|x_1)·p(x_3|x_1, x_2)·…` — 근사 없이 **정확히 분해**
  - 각 조건부 확률을 신경망 하나가 담당 → **p(x)를 정확히 계산** 가능 → MLE를 그대로 적용 → [[MLE(최대우도추정)]]
- **대표 예**
  - **LLM(GPT 계열)**: 다음 토큰 예측 — 강의: "LLM이 학습하는 방식"
  - **PixelRNN / PixelCNN**: 픽셀을 하나씩 순서대로 생성
  - **WaveNet**: 오디오 샘플 단위 생성
  - 이미지 캡셔닝의 LSTM 디코더도 단어를 하나씩 생성하는 자기회귀 구조 → [[CNN Encoder + LSTM Decoder]]
- **장점**: 가능도를 정확히 계산, 학습이 안정적(분류 문제처럼 Cross Entropy) / **단점**: 생성이 **순차적이라 느림**, 오류 누적, 순서를 정해야 함(이미지에는 부자연스러움)
- 학습 시엔 정답 이전 토큰을 넣어 **병렬 학습**(Teacher Forcing / causal mask) → [[Teacher Forcing]]

## 수식·원리
```
p(x) = Π_{t=1..n} p(x_t | x_{<t})
log p(x) = Σ_t log p(x_t | x_{<t})      → 정확한 MLE, 손실 = 토큰별 Cross Entropy
생성: x_1 ~ p(x_1), x_2 ~ p(x_2 | x_1), ...   (한 번에 하나씩)
```

## 코드 예시
```python
import numpy as np

text = "abababababcabab"
vocab = sorted(set(text)); idx = {c: i for i, c in enumerate(vocab)}
counts = np.ones((len(vocab), len(vocab)))                  # bigram: p(x_t | x_{t-1}), 라플라스 스무딩
for a, b in zip(text, text[1:]): counts[idx[a], idx[b]] += 1
P = counts / counts.sum(1, keepdims=True)

def log_p(s):                                               # 체인룰로 정확한 로그 가능도
    return np.log(1 / len(vocab)) + sum(np.log(P[idx[a], idx[b]]) for a, b in zip(s, s[1:]))
print(log_p("abab") > log_p("acca"))                        # True  학습 데이터와 비슷한 문자열이 확률 높음

rng = np.random.default_rng(0)
s = "a"
for _ in range(9): s += vocab[rng.choice(len(vocab), p=P[idx[s[-1]]])]   # 하나씩 순차 생성
print(s)
```

## 관련 개념
[[생성 모델 vs 판별 모델]] · [[MLE(최대우도추정)]] · [[CNN Encoder + LSTM Decoder]] · [[Teacher Forcing]] · [[Diffusion 모델(언급)]]
