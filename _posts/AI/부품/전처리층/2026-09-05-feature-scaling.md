---
title: 특성 스케일링
date: 2026-09-05 09:05:00 +0900
categories: [부품, 전처리층]
tags: [전처리, 정규화]
aliases: ["normalization", "standardization", "표준화", "스케일링", "min-max"]
layer: preprocess
kind: scaling
combinable: true
weight: 1
---

특성(컬럼)마다 값의 범위가 다르면 학습이 큰 값 쪽으로 쏠리므로, 모든 특성을 비슷한 범위로 맞추는 단계.

## 처리 전후 비교

{% include data-demo.html type="feature-scaling" %}

## 대표 방법

- **정규화**: 값을 0~1로 압축한다. `(x - 최솟값) / (최댓값 - 최솟값)`
- **표준화**: 평균 0·분산 1로 맞춘다. `(x - 평균) / 표준편차`

평가 데이터의 정보가 새지 않도록 기준값은 학습 데이터에서만 계산한다.

## 관련 글

- [[batchnorm]]: 목적은 같지만 신경망 안에서 수행한다. 스케일링은 데이터가 [[input]] 층으로 들어가기 *전에* 한 번만 한다.
- [[missing-value]]
