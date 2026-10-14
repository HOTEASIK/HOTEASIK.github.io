---
title: 펄플렉서티 (Perplexity)
date: 2026-09-04 10:30:00 +0900
categories: [부품, 평가방법]
tags: [metric, generation, perplexity, llm]
layer: eval
kind: generation
icon: /assets/parts/text-metric.svg
combinable: true
weight: 1
---

언어 모델이 다음 단어를 얼마나 "헷갈려 하는지". 낮을수록 좋다 —
펄플렉서티 10이면 매 단어마다 평균 10개 중에 고민한다는 뜻이다.

교차 엔트로피([[cross-entropy]]) 손실의 지수라서, [[llm]] 학습 로그에서 손실과 나란히 본다.
