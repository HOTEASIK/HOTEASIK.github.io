---
title: 인셉션 모듈
date: 2026-09-04 10:02:00 +0900
categories: [부품, 은닉층]
tags: [conv, inception, googlenet]
layer: hidden
kind: conv
icon: /assets/parts/conv.svg
combinable: true
weight: 1
---

1×1, 3×3, 5×5 합성곱과 풀링을 **병렬**로 동시에 통과시킨 뒤 결과를 이어 붙이는 모듈.
여러 크기의 특징을 한 층에서 같이 뽑고, 1×1 합성곱으로 채널 수를 줄여 계산량을 아낀다.

[[googlenet]]의 핵심 부품이다.
