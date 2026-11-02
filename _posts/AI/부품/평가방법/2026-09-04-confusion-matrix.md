---
title: 혼동 행렬
date: 2026-09-04 10:25:00 +0900
categories: [부품, 평가방법]
tags: [평가지표, 분류]
aliases: ["confusion matrix", "오차 행렬", "오분류표"]
layer: eval
kind: classification
icon: /assets/parts/matrix.svg
combinable: true
weight: 1
---

행은 실제 클래스, 열은 예측 클래스로 놓고 각 칸에 개수를 채운 표. 대각선이 맞힌 것, 나머지가 틀린 것. **어떤 클래스를 어떤 클래스로 헷갈리는지**가 한눈에 보인다.

## 읽는 법

| | 예측 양성 | 예측 음성 |
|---|---|---|
| **실제 양성** | TP | FN |
| **실제 음성** | FP | TN |

## 예시

고양이·개 분류기에서 "개 → 고양이" 칸만 크다면, 모델이 개를 고양이로 몰아가는 경향이 있다는 뜻이다. 그쪽 데이터를 보강하는 식으로 개선 방향을 잡을 수 있다.

## 관련 글

[[accuracy]] · [[precision]] · [[recall]] 은 모두 이 표에서 계산된다.
