---
title: 인셉션 모듈
date: 2026-09-04 10:02:00 +0900
categories: [부품, 은닉층]
tags: [CNN]
aliases: ["inception module", "인셉션"]
layer: hidden
kind: conv
icon: /assets/parts/conv.svg
combinable: true
weight: 1
---

1×1, 3×3, 5×5 합성곱과 풀링을 **병렬**로 동시에 통과시킨 뒤 결과를 이어 붙이는 모듈. 여러 크기의 특징을 한 층에서 같이 뽑는다.

## 동작 원리

갈래마다 다른 크기의 필터가 같은 입력을 본다. 출력의 가로세로를 맞춰 채널 방향으로 이어 붙이면 다음 층이 어떤 크기의 특징을 쓸지 학습으로 고를 수 있다.

## 1×1 합성곱의 역할

3×3, 5×5 앞에 1×1 합성곱을 두면 채널 수가 줄어 계산량을 크게 아낄 수 있다.

## 관련 글

- [[conv]]
- [[googlenet]]: 이 모듈이 핵심 부품이다.
