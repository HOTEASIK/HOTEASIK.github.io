---
title: 배치 정규화
date: 2026-09-04 10:12:00 +0900
categories: [부품, 은닉층]
tags: [정규화]
aliases: ["batch normalization", "layer normalization", "레이어 정규화", "batch norm", "배치놈"]
layer: hidden
kind: norm
icon: /assets/parts/norm.svg
combinable: true
weight: 1
---

미니배치 단위로 각 특징을 평균 0·분산 1로 맞춘 뒤 학습 가능한 스케일·이동을 적용하는 층. 층마다 입력 분포가 출렁이는 것을 줄여 학습을 빠르고 안정적으로 만든다.

## 동작 원리

1. 미니배치에서 특징별 평균과 표준편차를 구한다.
2. 평균을 빼고 표준편차로 나눈다.
3. 학습되는 값 γ, β로 `γx + β`를 계산해 표현력을 되살린다.

추론 때는 학습 중 모아 둔 이동 평균 통계를 쓴다.

## 언제 쓰나

CNN에서는 보통 [[conv]] 뒤, [[relu]] 앞에 둔다. 문장 길이가 제각각인 순환·트랜스포머 계열에서는 대신 레이어 정규화를 쓴다.

## 관련 글

- [[feature-scaling]]: 같은 목적을 입력 전에 한 번 수행한다.
- [[dropout]]: 함께 쓰이는 다른 안정화 기법이다.
