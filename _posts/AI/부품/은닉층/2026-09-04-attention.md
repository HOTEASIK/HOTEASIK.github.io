---
title: 어텐션
date: 2026-09-04 10:11:00 +0900
categories: [부품, 은닉층]
tags: [트랜스포머, LLM]
aliases: ["attention", "transformer", "self-attention", "셀프 어텐션", "주의 메커니즘"]
layer: hidden
kind: attention
icon: /assets/parts/attention.svg
combinable: true
weight: 2
---

한 위치의 표현을 만들 때, 나머지 모든 위치를 훑어 **관련 있는 것에 가중치를 크게** 주고 합치는 층. [[rnn]]처럼 순서대로 기어가지 않고 문장 전체를 한 번에 본다.

## 동작 원리

단어마다 질문(Query), 이름표(Key), 내용(Value) 벡터를 만든다.

1. 내 Query와 모든 단어의 Key를 곱해 관련도를 잰다.
2. 벡터 크기로 나눈 뒤 소프트맥스로 가중치를 만든다.
3. 가중치대로 Value를 더해 새 표현을 얻는다.

## 예시

스케일드 닷 프로덕트 어텐션을 NumPy로 쓰면 다음과 같다.

```python
import numpy as np

def scaled_dot_product_attention(Q, K, V):
    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    scores -= scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores)
    weights /= weights.sum(axis=-1, keepdims=True)
    return weights @ V, weights

x = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]])
output, weights = scaled_dot_product_attention(x, x, x)
print(weights.round(2))
```
{: data-lines="5-8" }

첫 두 단어는 벡터가 비슷해서 서로에게 큰 가중치를 준다.

## 관련 글

- [[rnn]]: 순서대로 처리하는 이전 방식이다.
- [[gelu]]: 트랜스포머에서 널리 쓰는 활성화다.
- [[llm]]: 어텐션을 겹겹이 쌓은 트랜스포머 위에서 학습한다.
