---
title: 특성 스케일링
date: 2026-09-05 09:05:00 +0900
categories: [부품, 전처리층]
tags: [preprocessing, scaling]
layer: preprocess
kind: scaling
combinable: true
weight: 1
---

특성(컬럼)마다 값의 범위가 다르면 학습이 큰 값 쪽으로 쏠리므로, 모든 특성을
비슷한 범위로 맞추는 단계. 정규화(0~1로 압축)와 표준화(평균 0·분산 1)가 대표적이다.

{% include data-demo.html type="feature-scaling" %}

신경망 안에서 하는 [[batchnorm]]과 목적은 같지만, 이건 데이터가 [[input]] 층으로
들어가기 *전에* 한 번만 하는 전처리라는 점이 다르다.
