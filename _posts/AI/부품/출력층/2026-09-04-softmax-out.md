---
title: 출력층 (소프트맥스)
date: 2026-09-04 10:13:00 +0900
categories: [부품, 출력층]
tags: [output, softmax]
layer: output
icon: /assets/parts/output.svg
combinable: true
weight: 1
---

신경망의 마지막 층. 분류 문제라면 점수 벡터를 **소프트맥스**로 확률 분포(합 1)로 바꿔
"어느 클래스일 확률"을 낸다. 회귀라면 선형 출력 하나를 그대로 낸다.

조합 벨트에서는 항상 맨 뒤에 온다. 뒤이어 [[cross-entropy]] 같은 손실로 정답과 비교한다.
