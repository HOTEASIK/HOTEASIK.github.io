---
title: 데이터 증강
date: 2026-09-05 09:10:00 +0900
categories: [부품, 전처리층]
tags: [전처리, 규제]
aliases: ["data augmentation", "증강", "어그멘테이션"]
layer: preprocess
kind: augmentation
combinable: true
weight: 1
---

가진 데이터를 회전·자르기·뒤집기·노이즈 추가 등으로 살짝 변형해 양을 늘리는 단계. 데이터가 적을 때 [[dropout]]과 비슷하게 과적합을 줄이는 데 도움이 된다.

## 처리 전후 비교

{% include data-demo.html type="augmentation" %}

## 동작 원리

모델이 같은 대상을 여러 모습으로 보게 해서, 위치나 방향 같은 사소한 차이에 덜 민감해지도록 만든다. 뜻이 바뀌지 않는 변형만 골라야 한다. 숫자 `6`을 180도 돌리면 `9`가 되는 것이 대표적인 함정이다.

## 다른 데이터에 적용

이미지뿐 아니라 문장(동의어 치환)·신호(시간축 늘리기)에도 같은 원리로 쓴다.

## 관련 글

- [[dropout]]
- [[data-pipeline]]
