---
title: 정밀도 (Precision)
date: 2026-09-04 10:21:00 +0900
categories: [부품, 평가방법]
tags: [metric, classification, precision]
layer: eval
kind: classification
icon: /assets/parts/metric.svg
combinable: true
synthesizable: true
weight: 1
---

**양성이라 예측한 것 중 실제로 양성인 비율** (`TP / (TP + FP)`).
높을수록 "양성이라 하면 믿을 만하다". 오탐이 비쌀 때(스팸함으로 보낸 중요 메일) 중요하다.

놓친 양성까지 보려면 [[recall]] 과 함께 봐야 하고, 둘을 합치면 [[f1]] 이 된다.
