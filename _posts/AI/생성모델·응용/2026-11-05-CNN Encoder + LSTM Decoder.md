---
title: CNN Encoder + LSTM Decoder
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 이미지캡셔닝, CNN, LSTM, AI응용]
---
# CNN Encoder + LSTM Decoder

## 정의·핵심
- **정의**: 이미지 캡셔닝의 기본 **인코더-디코더 구조** — **CNN(인코더)** 이 이미지를 고정 길이 **특징 벡터**로 압축하고, **LSTM(디코더)** 이 그 벡터를 받아 단어 시퀀스를 생성 (응용 8차시, 과제 문항 1: A = CNN, B = LSTM)
- **CNN Encoder (강의)**
  - **사전학습 모델** 사용 (예: ResNet-101, VGG-16) — ImageNet 가중치를 가져오는 **전이 학습**이 성능이 훨씬 좋음
  - 원리: 입력 이미지 **압축**(중요 정보 보존) → **합성곱**으로 에지·텍스처·형태를 단계적으로 검출 → **벡터화**: 마지막 **FC 층 직전 출력**을 고정 길이 특징 벡터로 사용
  - 깊이별로 보는 것: 초기 층 **선·경계** → 중간 층 **질감·패턴** → 깊은 층 **사물 부분·전체 형태** (추상화 수준 ↑)
  - **과제 문항 3**: ResNet-50에서 **마지막 FC 제거** → `Linear(2048, embed_size)` 추가 (+ BatchNorm) → LSTM 입력 차원과 맞춤. 백본은 보통 고정(`no_grad`)
- **LSTM Decoder (강의)**
  - **CNN 특징 벡터 입력**: 인코더 출력이 LSTM의 **초기 입력(첫 타임스텝)** 으로 전달 → 이미지 전체 내용을 모델에 주입
  - **순차적 단어 예측**: 이전 상태(Hidden State)와 현재 단어로 **다음 단어 확률** 계산
  - **Start/End 토큰**: `<start>` 로 시작, `<end>` 를 예측하면 종료
  - 핵심 메커니즘: **장기 기억**(긴 문맥 유지), **순차 처리**, **언어 모델링** → [[LSTM]]
  - **과제 문항 4**: `__init__` 에 `Embedding(vocab, embed)`, `LSTM(embed, hidden, layers, batch_first=True)`, `Linear(hidden, vocab)`
  - **과제 문항 5 forward**: `emb = embed(captions[:, :-1])` → `cat(features.unsqueeze(1), emb)` → LSTM → Linear → 각 시점 단어 점수
- **손실**: 각 시점 출력과 정답 단어의 **CrossEntropyLoss** (pad는 `ignore_index`) → [[CrossEntropyLoss]]
- **한계**: 이미지를 **벡터 하나**로 압축 → 긴 문장·세부 묘사에서 정보 손실 → [[캡셔닝 Attention]]

## 수식·원리
```
x_{-1} = W_e·CNN(I)                        이미지 특징 = 첫 입력
x_t = E·w_t   (t = 0..N−1, w_0 = <start>)
h_t = LSTM(x_t, h_{t−1}),  p_{t+1} = softmax(W_o h_t)
L = −Σ_t log p_t(w_t)
```

## 코드 예시
```python
import torch
import torch.nn as nn
from torchvision.models import resnet50

class EncoderCNN(nn.Module):                                 # 과제 문항 3
    def __init__(self, embed_size):
        super().__init__()
        resnet = resnet50(weights=None)                      # 실사용: weights="DEFAULT"
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])   # FC 제거
        self.linear = nn.Linear(resnet.fc.in_features, embed_size)
        self.bn = nn.BatchNorm1d(embed_size)
    def forward(self, images):
        with torch.no_grad():
            f = self.backbone(images).flatten(1)            # (B, 2048)
        return self.bn(self.linear(f))

class DecoderLSTM(nn.Module):                                # 과제 문항 4, 5
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(embed_size, hidden_size, num_layers, batch_first=True)
        self.linear = nn.Linear(hidden_size, vocab_size)
    def forward(self, features, captions):
        emb = self.embed(captions[:, :-1])
        x = torch.cat([features.unsqueeze(1), emb], 1)       # 이미지 특징 = 시퀀스 첫 입력
        out, _ = self.lstm(x)
        return self.linear(out)

torch.manual_seed(0)
enc, dec = EncoderCNN(256).eval(), DecoderLSTM(256, 512, vocab_size=1000)
images = torch.rand(2, 3, 224, 224)
captions = torch.randint(0, 1000, (2, 12))
feat = enc(images)
logits = dec(feat, captions)
print(tuple(feat.shape), tuple(logits.shape))               # (2, 256) (2, 12, 1000)
loss = nn.CrossEntropyLoss(ignore_index=0)(logits.reshape(-1, 1000), captions.reshape(-1))
print(round(loss.item(), 1))                                 # 학습 전 ≈ ln(1000) = 6.9 근처
```

## 관련 개념
[[이미지 캡셔닝 개요]] · [[LSTM]] · [[ResNet]] · [[Teacher Forcing]] · [[캡셔닝 Attention]] · [[전이학습(Transfer Learning)]] · [[임베딩]]
