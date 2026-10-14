---
title: 데이터 전처리 파이프라인
date: 2026-09-05 09:20:00 +0900
categories: [모델]
tags: [preprocessing, pipeline]
layer: model
weight: 1
---

[[missing-value]] → [[feature-scaling]] → [[augmentation]] → [[split]] 순서로
벨트에 올리면 완성되는 라인. 원본 데이터를 신경망에 넣기 직전까지 다듬는 전체
과정이다.

이 라인을 통과한 데이터가 [[input]] 층으로 들어가면서 본격적인 조립이 시작된다.
