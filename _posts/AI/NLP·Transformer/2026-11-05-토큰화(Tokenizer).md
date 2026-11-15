---
title: 토큰화(Tokenizer)
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, 전처리, 토큰화, AI응용]
---
# 토큰화(Tokenizer)

## 정의·핵심
- **정의**: 원시 텍스트를 모델이 다룰 수 있는 최소 단위인 **토큰(Token)** 으로 나누는 과정. NLP 전처리 파이프라인의 첫 단계 (개론 17차시 "텍스트 전처리: 토큰화 → 패딩 → 임베딩")
  - 파이프라인: 원시 텍스트 → **정제**(특수문자·대소문자) → **토큰화** → 어휘집 인덱스 → 패딩 → 임베딩 → [[어휘집(Vocabulary)·패딩]], [[임베딩]]
  - 강의: "데이터 정제 품질이 모델 성능에 직접적인 영향을 미친다"
- **단위별 종류**
  - **단어(공백) 토큰화**: `split()` — 영어엔 간단하지만 구두점·축약어(don't) 처리 필요
  - **문자(Character) 토큰화**: 어휘가 작고 OOV 없음, 대신 시퀀스가 길어짐 → [[Text CNN]] character-level
  - **형태소(Morpheme) 토큰화**: 한국어는 **교착어**("강아지가", "강아지를", "강아지에게") → 어절을 그대로 쓰면 어휘가 폭발 → 형태소 분석기(KoNLPy: Okt, Mecab, Komoran)로 `강아지 / 가` 분리
  - **soynlp**: 사전 없이 **통계(응집 확률·branching entropy)** 로 단어를 추출하는 비지도 한국어 토크나이저 — 신조어·도메인 텍스트에 유리
  - **서브워드(Subword)**: 자주 나오는 문자 조합을 단위로 — **BPE**(GPT), **WordPiece**(BERT, `##` 접두), **SentencePiece/Unigram**(T5) → 희귀 단어도 조각으로 표현, **OOV 문제 해결**
- **OOV (Out-Of-Vocabulary)**: 어휘집에 없는 단어 → `<unk>`로 대체되어 정보 손실 → 서브워드가 해결책
- **Hugging Face `AutoTokenizer` (17차시 과제 문항 4)**: 모델과 짝이 맞는 토크나이저를 로드 → `tokenizer(text, truncation=True, max_length=256)` → `input_ids`, `attention_mask` 반환, 특수 토큰(`[CLS]`, `[SEP]`) 자동 추가 → [[Hugging Face pipeline·Trainer]]
- 사전학습 모델을 쓸 땐 **반드시 그 모델의 토크나이저**를 써야 함 (어휘·인덱스가 모델 임베딩과 1:1 대응)

## 수식·원리
```
BPE 학습: 문자 단위로 시작 → 가장 자주 붙어 나오는 쌍을 하나로 병합 → 목표 어휘 크기까지 반복
예) l o w, l o w e r, n e w e s t  →  (e,s)→es → (es,t)→est → (l,o)→lo → (lo,w)→low ...
WordPiece: "playing" → ["play", "##ing"]
```

## 코드 예시
```python
import re
from collections import Counter

text = "I don't like rainy days. Rainy days are long!"
print(text.lower().split()[:4])                                 # ['i', "don't", 'like', 'rainy']  공백 기준
print(re.findall(r"[a-z]+|'[a-z]+|[.!?]", text.lower())[:6])    # ['i', 'don', "'t", 'like', 'rainy', 'days']  구두점 분리
print(list("강아지가")[:4])                                     # ['강', '아', '지', '가']  문자 단위

def bpe(words, merges):                                         # 간단한 BPE 학습
    corpus = Counter(tuple(w) + ("</w>",) for w in words)
    for _ in range(merges):
        pairs = Counter()
        for sym, f in corpus.items():
            for a, b in zip(sym, sym[1:]): pairs[a, b] += f
        best = max(pairs, key=pairs.get)
        new = {}
        for sym, f in corpus.items():
            out, i = [], 0
            while i < len(sym):
                if i < len(sym) - 1 and (sym[i], sym[i + 1]) == best: out.append(sym[i] + sym[i + 1]); i += 2
                else: out.append(sym[i]); i += 1
            new[tuple(out)] = f
        corpus = new
        print(best)
    return corpus

result = bpe(["low"] * 5 + ["lower"] * 2 + ["newest"] * 6 + ["widest"] * 3, 4)
print(sorted(result, key=len)[0])                               # ('lo', 'w', '</w>')  자주 나온 조합이 하나의 토큰으로
```

## 관련 개념
[[어휘집(Vocabulary)·패딩]] · [[임베딩]] · [[원-핫 인코딩(텍스트)]] · [[BERT]] · [[Hugging Face pipeline·Trainer]]
