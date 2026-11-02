---
title: 출력층 (소프트맥스)
date: 2026-09-04 10:13:00 +0900
categories: [부품, 출력층]
tags: [입출력, 분류]
aliases: ["softmax", "소프트맥스", "output layer", "출력층", "로짓"]
layer: output
icon: /assets/parts/output.svg
combinable: true
weight: 1
---

신경망의 마지막 층. 분류 문제라면 점수 벡터를 **소프트맥스**로 확률 분포(합 1)로 바꿔 "어느 클래스일 확률"을 낸다. 회귀라면 선형 출력 하나를 그대로 낸다.

## 동작 원리

각 점수의 지수를 구한 뒤 전체 합으로 나눈다. 큰 점수는 더 크게 벌어지고, 모든 값은 양수가 되며 합은 1이 된다.

## 예시

```python
import math

def softmax(scores):
    exps = [math.exp(s) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

print([round(p, 3) for p in softmax([2.0, 1.0, 0.1])])
```

세 값은 약 `0.659`, `0.242`, `0.099`가 된다.

## 관련 글

- [[cross-entropy]]: 이 출력을 정답과 비교하는 손실이다.
- [[fc]]: 보통 바로 앞에 놓인다.
