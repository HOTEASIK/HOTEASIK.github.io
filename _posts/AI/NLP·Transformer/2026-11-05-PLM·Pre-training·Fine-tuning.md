---
title: PLM·Pre-training·Fine-tuning
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, 사전학습, 파인튜닝, 전이학습, AI응용]
---
# PLM·Pre-training·Fine-tuning

## 정의·핵심
- **PLM (Pre-trained Language Model)**: 대용량 텍스트로 **미리 학습된 언어 모델** — ELMo, GPT, BERT, RoBERTa, BART, T5 등 (응용 14차시 GPT 슬라이드)
- **Pre-training in NLP (강의 흐름)**
  - 워드 임베딩은 딥러닝 NLP의 기본 — 사전 훈련된 임베딩(Word2Vec, GloVe)은 단어 **동시 등장 통계**로 학습 → [[Word2Vec]]
  - 문제: 단어 뜻이 **문맥에 따라 달라짐**(동음이의어) → 해결: **언어 모델 자체를 사전 훈련**해 문맥 표현(Contextual Representation)을 얻음 → [[ELMo]]
  - 레이블 없는 텍스트만으로 학습(**자기지도 학습**): 다음 단어 예측(GPT), 빈칸 맞추기(BERT MLM), 노이즈 복원(BART)
- **Fine-tuning (강의 "BERT의 적용")**
  1. 방대한 데이터로 사전 훈련된 언어 모델(BERT)
  2. 풀고자 하는 태스크에 맞는 **추가 신경망**(분류 헤드 등)을 얹음
  3. 태스크의 오차에 맞춰 **전체(또는 일부)를 학습** = 파인 튜닝
  - 이미지의 **전이학습**과 같은 원리 (ImageNet 사전학습 → 내 데이터로 미세 조정) → [[전이학습(Transfer Learning)]]
  - 강의 실습: DistilBERT + SST-2/IMDb, ViT + Beans — `learning_rate=2e-5`처럼 **작은 학습률**, 2~3 epoch → [[DistilBERT]], [[ViT 파인튜닝 실습]]
- **Downstream Task**: 사전학습 후 실제로 풀려는 과제 — 텍스트 분류, NER, 질의응답(MRC), 요약, 번역
- **파인튜닝의 한계 (강의 "Fine-tuning의 필요성?")**: 수천~수만 개 데이터 필요, **오버피팅** 쉬움, **태스크마다 모델을 각각** 만들어야 함 (사람은 예제 몇 개로 바로 이해)
  - → **In-context Learning**(예시만으로 해결) → [[In-context Learning]]
  - → 거대 모델은 전체 파인튜닝이 어려움 → **LoRA**(일부 파라미터만) → [[LoRA]]
- **Feature-based vs Fine-tuning**: 사전학습 모델을 고정하고 출력 특징만 쓰기(ELMo식) vs 전체를 함께 학습(BERT·GPT식)

## 수식·원리
```
Pre-training:  θ_0 = argmin_θ  L_LM(θ; 대용량 무라벨 텍스트)
Fine-tuning:   θ*, φ* = argmin_{θ,φ} L_task(head_φ(PLM_θ(x)), y),   θ 초기값 = θ_0
학습률: 사전학습 1e-4 수준  ≫  파인튜닝 2e-5 수준
```

## 코드 예시
```python
import torch
import torch.nn as nn

torch.manual_seed(0)
V, D = 30, 32
encoder = nn.Sequential(nn.Embedding(V, D), nn.TransformerEncoder(
    nn.TransformerEncoderLayer(D, 4, 64, batch_first=True), 1))
lm_head = nn.Linear(D, V)

# 1) Pre-training: 레이블 없는 텍스트로 빈칸(마스크) 맞추기
text = torch.randint(2, V, (64, 8)); MASK = 1
inp = text.clone(); inp[:, 3] = MASK
opt = torch.optim.Adam(list(encoder.parameters()) + list(lm_head.parameters()), lr=1e-3)
for _ in range(50):
    loss = nn.functional.cross_entropy(lm_head(encoder(inp)[:, 3]), text[:, 3])
    opt.zero_grad(); loss.backward(); opt.step()
pre_state = {k: v.clone() for k, v in encoder.state_dict().items()}

# 2) Fine-tuning: 사전학습 인코더 + 새 분류 헤드, 작은 학습률
cls_head = nn.Linear(D, 2)
labels = (text[:, 0] > V // 2).long()
opt2 = torch.optim.Adam([{"params": encoder.parameters(), "lr": 2e-5}, {"params": cls_head.parameters(), "lr": 1e-3}])
for _ in range(50):
    loss = nn.functional.cross_entropy(cls_head(encoder(text)[:, 0]), labels)
    opt2.zero_grad(); loss.backward(); opt2.step()
drift = max((encoder.state_dict()[k] - pre_state[k]).abs().max().item() for k in pre_state)
print(drift < 0.01)                    # True  사전학습 가중치는 조금만 바뀜 (지식 유지)
```

## 관련 개념
[[BERT]] · [[GPT]] · [[ELMo]] · [[DistilBERT]] · [[In-context Learning]] · [[LoRA]] · [[전이학습(Transfer Learning)]] · [[Hugging Face pipeline·Trainer]]
