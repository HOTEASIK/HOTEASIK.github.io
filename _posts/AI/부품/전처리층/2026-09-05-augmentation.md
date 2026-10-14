---
title: 데이터 증강
date: 2026-09-05 09:10:00 +0900
categories: [부품, 전처리층]
tags: [preprocessing, augmentation]
layer: preprocess
kind: augmentation
combinable: true
weight: 1
---

가진 데이터를 회전·자르기·뒤집기·노이즈 추가 등으로 살짝 변형해 양을 늘리는 단계.
데이터가 적을 때 [[dropout]]과 비슷하게 과적합을 줄이는 데 도움이 된다.

{% include data-demo.html type="augmentation" %}

이미지뿐 아니라 문장(동의어 치환)·신호(시간축 늘리기)에도 같은 원리로 쓴다.
