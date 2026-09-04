---
title: 어텐션
date: 2026-09-04 10:11:00 +0900
categories: [부품, 은닉층]
tags: [attention, transformer, llm]
layer: hidden
kind: attention
icon: /assets/parts/attention.svg
combinable: true
weight: 2
---

한 위치의 표현을 만들 때, 나머지 모든 위치를 훑어 **관련 있는 것에 가중치를 크게** 주고
합치는 층. [[rnn]]처럼 순서대로 기어가지 않고 문장 전체를 한 번에 본다.

이것만 겹겹이 쌓아 만든 것이 트랜스포머이고, 그 위에서 학습한 것이 [[llm]]이다.
