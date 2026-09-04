---
title: GoogLeNet
date: 2026-09-04 11:03:00 +0900
categories: [모델]
tags: [cnn, googlenet, inception, history]
layer: model
---

2014년, [[inception]] 모듈을 쌓아 만든 22층 CNN. 한 층에서 여러 크기의 [[conv]]과
풀링을 병렬로 돌리고 1×1 합성곱으로 채널을 줄여, 깊으면서도 계산량이 가볍다.

끝에서는 [[fc]] 대신 [[gap]]을 써서 파라미터를 크게 줄이고 [[softmax-out]]으로 분류한다.
