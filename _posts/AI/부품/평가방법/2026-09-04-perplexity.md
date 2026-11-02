---
title: 펄플렉서티 (Perplexity)
date: 2026-09-04 10:30:00 +0900
categories: [부품, 평가방법]
tags: [평가지표, 자연어, LLM]
aliases: ["perplexity", "퍼플렉서티", "퍼플렉시티"]
layer: eval
kind: generation
icon: /assets/parts/text-metric.svg
combinable: true
weight: 1
---

언어 모델이 다음 단어를 얼마나 "헷갈려 하는지". 낮을수록 좋다 — 펄플렉서티 10이면 매 단어마다 평균 10개 중에 고민한다는 뜻이다.

## 계산법

[[cross-entropy|교차 엔트로피]] 손실의 지수다. 손실 `L`이 자연로그 기준이면 `펄플렉서티 = e^L`이다.

## 예시

손실이 `2.3`이면 펄플렉서티는 약 10이다. 그래서 [[llm]] 학습 로그에서 손실과 나란히 본다.

## 관련 글

- [[cross-entropy]]
- [[bleu]]: 정답 문장과의 겹침을 재는 지표다.
