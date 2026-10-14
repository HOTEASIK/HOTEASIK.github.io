---
title: 배치 정규화
date: 2026-09-04 10:12:00 +0900
categories: [부품, 은닉층]
tags: [norm, batchnorm]
layer: hidden
kind: norm
icon: /assets/parts/norm.svg
combinable: true
weight: 1
---

미니배치 단위로 각 특징을 평균 0·분산 1로 맞춘 뒤 학습 가능한 스케일·이동을 적용하는 층.
층마다 입력 분포가 출렁이는 것을 줄여 학습을 빠르고 안정적으로 만든다.
문장 길이가 제각각인 순환·트랜스포머 계열에서는 대신 레이어 정규화를 쓴다.
