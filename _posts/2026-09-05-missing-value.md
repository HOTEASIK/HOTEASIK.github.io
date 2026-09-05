---
title: 결측치 처리
date: 2026-09-05 09:00:00 +0900
categories: [부품, 전처리층]
tags: [preprocessing, missing-value]
layer: preprocess
kind: cleaning
combinable: true
weight: 1
---

데이터에 값이 비어 있는 칸(결측치)을 채우거나 지우는 단계. 평균·중앙값으로 채우기,
앞뒤 값으로 채우기, 아예 그 행을 삭제하기 등의 방법이 있다.

{% include data-demo.html type="missing-value" %}

전처리 파이프라인의 첫 단계로 두는 게 보통이다 — 여기서 값을 잘못 채우면
[[feature-scaling]] 이후 단계까지 왜곡이 그대로 번진다.
