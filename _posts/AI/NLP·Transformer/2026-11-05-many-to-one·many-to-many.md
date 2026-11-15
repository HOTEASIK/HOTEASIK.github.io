---
title: many-to-one·many-to-many
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, RNN, 시퀀스, AI응용]
---
# many-to-one·many-to-many

## 정의·핵심
- **정의 (응용 8차시 "Types of Recurrent Neural Network")**: RNN은 설계하기 나름이며, 입력·출력 시퀀스 길이에 따라 대표적으로 아래 유형이 있음. 자연어 처리에서 각 시점 입력은 주로 **단어 벡터**(한국어는 형태소 벡터)
- **one-to-many**: 입력 1개 → 시퀀스 출력 — 예: **이미지 캡셔닝** (이미지 벡터 → 단어들) → [[CNN Encoder + LSTM Decoder]]
- **many-to-one**: 시퀀스 입력 → 출력 1개 — 예: **텍스트 분류**, 스팸 탐지, 감성 분석
  - 문서의 단어들을 순차적으로 입력받아 **최종 시점의 hidden state로** 문서 유형 판단 (강의 spam detector)
  - 구현: `out[:, -1, :]` 또는 `h_n[-1]` → Linear (패딩이 뒤에 있으면 실제 마지막 위치를 써야 함)
- **many-to-many (동기)**: 각 입력 시점마다 출력 — 예: **개체명 인식(NER)** 같은 **시퀀스 레이블링** (각 단어에 레이블)
  - 구현: `out` 전체(B, L, H) → Linear → (B, L, num_tags)
- **many-to-many (비동기, Seq2Seq)**: 입력을 다 읽은 뒤 다른 길이의 시퀀스 출력 — 예: **번역**, 요약, 챗봇 → 인코더-디코더 → [[Transformer Decoder]]
- **언어 모델**도 many-to-many: 각 시점에서 다음 단어 예측 (입력 `what will the fat` → 출력 `will the fat cat`) → [[Teacher Forcing]]

## 수식·원리
```
many-to-one:   ŷ = softmax(W h_L)                  (B, C)
many-to-many:  ŷ_t = softmax(W h_t), t = 1..L      (B, L, C)
seq2seq:       c = Enc(x_1..x_L),  y_t = Dec(y_{<t}, c),  t = 1..T  (T ≠ L 가능)
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
B, L, E, H = 2, 7, 16, 32
emb, lstm = nn.Embedding(50, E), nn.LSTM(E, H, batch_first=True)
x = torch.randint(1, 50, (B, L))
out, (h_n, _) = lstm(emb(x))

cls_head = nn.Linear(H, 3)                          # many-to-one: 문서 분류 3클래스
print(tuple(cls_head(out[:, -1]).shape))            # (2, 3)

ner_head = nn.Linear(H, 5)                          # many-to-many: 단어마다 태그 5종
print(tuple(ner_head(out).shape))                   # (2, 7, 5)

img_vec = torch.randn(B, 1, E)                      # one-to-many: 벡터 1개로 시작해 단어 생성
h, state, words = img_vec, None, []
dec_head = nn.Linear(H, 50)
for _ in range(4):
    o, state = lstm(h, state)
    w = dec_head(o).argmax(-1); words.append(w)
    h = emb(w)
print(tuple(torch.cat(words, 1).shape))             # (2, 4)  출력 시퀀스
```

## 관련 개념
[[RNN]] · [[LSTM]] · [[BiLSTM]] · [[텍스트 분류 실습]] · [[CNN Encoder + LSTM Decoder]] · [[Transformer Decoder]]
