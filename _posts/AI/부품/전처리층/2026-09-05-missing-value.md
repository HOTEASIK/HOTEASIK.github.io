---
title: 결측치 처리
date: 2026-09-05 09:00:00 +0900
categories: [부품, 전처리층]
tags: [전처리]
aliases: ["missing value", "결측값", "NaN", "빈 값", "imputation"]
layer: preprocess
kind: cleaning
combinable: true
weight: 1
---

데이터에 값이 비어 있는 칸(결측치)을 채우거나 지우는 단계. 평균·중앙값으로 채우기, 앞뒤 값으로 채우기, 아예 그 행을 삭제하기 등의 방법이 있다.

## 처리 전후 비교

{% include data-demo.html type="missing-value" %}

## 방법 고르기

- **평균·중앙값 채우기**: 간단하다. 이상치가 많으면 중앙값이 낫다.
- **앞뒤 값 채우기**: 센서처럼 시간 순서가 있는 데이터에 어울린다.
- **행 삭제**: 결측이 아주 적을 때 쓴다. 많이 지우면 데이터가 편향될 수 있다.

전처리 파이프라인의 첫 단계로 두는 게 보통이다 — 여기서 값을 잘못 채우면 [[feature-scaling]] 이후 단계까지 왜곡이 그대로 번진다.

## 관련 글

- [[feature-scaling]]
- [[data-pipeline]]
