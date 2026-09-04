---
title: 교차 엔트로피 손실
date: 2026-09-04 10:17:00 +0900
categories: [부품, 학습방법]
tags: [loss, cross-entropy, classification]
layer: training
kind: loss
icon: /assets/parts/loss.svg
combinable: true
weight: 1
---

분류의 표준 손실. 모델이 정답 클래스에 준 확률이 낮을수록 큰 벌점을 준다
(`-log p_정답`). [[softmax-out]] 출력과 짝을 이뤄, 확신에 찬 오답을 강하게 교정한다.

연속값 예측에는 대신 [[mse]]를 쓴다.
