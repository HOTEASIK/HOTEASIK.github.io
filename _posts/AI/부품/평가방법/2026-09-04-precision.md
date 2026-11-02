---
title: 정밀도 (Precision)
date: 2026-09-04 10:21:00 +0900
categories: [부품, 평가방법]
tags: [평가지표, 분류]
aliases: ["precision", "정밀도", "PPV"]
layer: eval
kind: classification
icon: /assets/parts/metric.svg
combinable: true
synthesizable: true
weight: 1
---

**양성이라 예측한 것 중 실제로 양성인 비율** (`TP / (TP + FP)`). 높을수록 "양성이라 하면 믿을 만하다".

## 언제 중요한가

오탐이 비쌀 때 중요하다. 스팸 필터가 중요한 메일을 스팸함으로 보내면 손해가 크다.

## 예시

스팸이라고 표시한 메일 10통 중 8통이 진짜 스팸이면 정밀도는 `8 / 10 = 0.8`이다.

## 관련 글

- [[recall]]: 놓친 양성까지 보려면 함께 봐야 한다.
- [[f1]]: 둘을 합친 지표다.
