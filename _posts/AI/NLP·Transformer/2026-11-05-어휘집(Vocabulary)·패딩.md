---
title: 어휘집(Vocabulary)·패딩
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, 전처리, 패딩, AI응용]
---
# 어휘집(Vocabulary)·패딩

## 정의·핵심
- **어휘집(Vocabulary, 단어 사전)**: 토큰 ↔ **정수 인덱스** 매핑표. 모델은 문자열이 아니라 인덱스(→ 임베딩 벡터)를 입력으로 받음
  - 구축: 학습 데이터의 토큰 빈도를 세고 → 빈도 상위 N개 또는 최소 빈도 이상만 남김 → 나머지는 `<unk>`
  - **특수 토큰** (응용 8차시 예시): `0 <pad>` 길이 맞춤 / `1 <start>`(sos) 문장 시작 / `2 <end>`(eos) 문장 종료 / `3 <unk>` 모르는 단어
  - BERT 계열: `[PAD]`, `[CLS]`, `[SEP]`, `[MASK]`, `[UNK]`
  - 반드시 **학습 데이터로만** 구축 (검증·테스트 단어를 미리 보면 데이터 누수)
- **패딩(Padding) (개론 17차시 과제 문제 1)**
  - **왜**: 문장마다 단어 수가 다른데, 미니배치는 **같은 길이의 텐서**여야 함 → 짧은 문장 뒤(또는 앞)에 `<pad>`(보통 0)를 채워 길이를 맞춤
  - **max_len**: 너무 긴 문장은 **잘라냄(Truncation)** — 문장 길이 분포(히스토그램)를 보고 대부분을 덮는 값으로 정함 (강의 실습: NSMC 문장 길이 최대·평균 확인)
  - **pre vs post 패딩**: RNN에서 마지막 hidden state를 쓰면 앞쪽 패딩(pre)이 유리, 또는 `pack_padded_sequence`로 패딩을 건너뜀
  - **패딩 무시**: `nn.Embedding(padding_idx=0)`(패딩 벡터는 0·학습 안 함), `CrossEntropyLoss(ignore_index=0)`, Transformer는 **attention_mask**
- **동적 패딩(Dynamic Padding) (과제 문제 4)**: 전체를 고정 max_len으로 채우지 않고 **배치마다 그 배치의 최대 길이**까지만 패딩 → 연산 낭비 감소. HF `DataCollatorWithPadding(tokenizer)` 이 담당

## 수식·원리
```
vocab: {"<pad>":0, "<sos>":1, "<eos>":2, "<unk>":3, w1:4, ...}
encode(s) = [vocab.get(t, 3) for t in tokens(s)]
pad(ids, L) = ids[:L] + [0] * (L − len(ids))
mask_i = 1 (실제 토큰), 0 (패딩)
```

## 코드 예시
```python
import torch
import torch.nn as nn
from collections import Counter
from torch.nn.utils.rnn import pad_sequence

train = ["the movie was great", "the plot was boring", "great acting"]
cnt = Counter(w for s in train for w in s.split())
vocab = {"<pad>": 0, "<sos>": 1, "<eos>": 2, "<unk>": 3}
for w, _ in cnt.most_common():
    vocab[w] = len(vocab)
print(len(vocab), vocab["the"])                         # 11 4

def encode(s): return torch.tensor([1] + [vocab.get(w, 3) for w in s.split()] + [2])
batch = [encode("the movie was great"), encode("great fun")]   # fun → <unk>
padded = pad_sequence(batch, batch_first=True, padding_value=0)
print(padded.tolist())                                  # [[1, 4, 7, 5, 6, 2], [1, 6, 3, 2, 0, 0]]
mask = (padded != 0).long()
print(mask.sum(1).tolist())                             # [6, 4]  실제 길이

emb = nn.Embedding(len(vocab), 4, padding_idx=0)
print(emb(padded)[1, -1].tolist())                      # [0.0, 0.0, 0.0, 0.0]  패딩 벡터는 0
```

## 관련 개념
[[토큰화(Tokenizer)]] · [[임베딩]] · [[원-핫 인코딩(텍스트)]] · [[RNN]] · [[Hugging Face pipeline·Trainer]]
