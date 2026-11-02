---
title: 교차 엔트로피 손실
date: 2026-09-04 10:17:00 +0900
categories: [부품, 학습방법]
tags: [손실, 분류]
aliases: ["cross entropy", "크로스 엔트로피", "log loss", "로그 손실"]
layer: training
kind: loss
icon: /assets/parts/loss.svg
combinable: true
weight: 1
---

분류의 표준 손실. 모델이 정답 클래스에 준 확률이 낮을수록 큰 벌점을 준다(`-log p_정답`). [[softmax-out]] 출력과 짝을 이뤄, 확신에 찬 오답을 강하게 교정한다.

## 예시

```python
import math

def cross_entropy(prob_of_answer):
    return -math.log(prob_of_answer)

for p in [0.9, 0.5, 0.1]:
    print(p, round(cross_entropy(p), 3))
```

정답 확률이 0.9이면 손실은 약 `0.105`지만, 0.1이면 약 `2.303`으로 뛴다.

## 관련 글

- [[softmax-out]]
- [[mse]]: 연속값 예측에 대신 쓴다.
- [[perplexity]]: 이 손실의 지수다.
