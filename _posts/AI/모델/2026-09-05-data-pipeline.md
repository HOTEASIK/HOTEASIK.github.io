---
title: 데이터 전처리 파이프라인
date: 2026-09-05 09:20:00 +0900
categories: [모델]
tags: [전처리]
aliases: ["data pipeline", "파이프라인", "데이터 파이프라인"]
layer: model
weight: 1
---

원본 데이터를 신경망에 넣기 직전까지 다듬는 전체 과정. 결측치 처리부터 분할까지를 한 줄로 잇는다.

## 순서

**[[missing-value]] → [[feature-scaling]] → [[augmentation]] → [[split]]**

이 라인을 통과한 데이터가 [[input]] 층으로 들어가면서 본격적인 조립이 시작된다.

## 주의할 점

실무에서는 평가 데이터의 정보가 학습에 새지 않도록 [[split]]을 먼저 하는 경우가 많다. 그래서 스케일링 기준은 학습 데이터에서만 계산하고, 증강도 학습 데이터에만 적용한다.

## 관련 글

- [[missing-value]]
- [[feature-scaling]]
- [[augmentation]]
- [[split]]
