---
title: 혼동 행렬
date: 2026-09-04 10:25:00 +0900
categories: [부품, 평가방법]
tags: [metric, classification, confusion-matrix]
layer: eval
kind: classification
icon: /assets/parts/matrix.svg
combinable: true
weight: 1
---

행은 실제 클래스, 열은 예측 클래스로 놓고 각 칸에 개수를 채운 표.
대각선이 맞힌 것, 나머지가 틀린 것. **어떤 클래스를 어떤 클래스로 헷갈리는지**가 한눈에 보인다.

[[accuracy]] · [[precision]] · [[recall]] 은 모두 이 표에서 계산된다.
