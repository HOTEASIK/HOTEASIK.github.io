---
title: Hugging Face
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, HuggingFace, AI개론, AI응용]
---
# Hugging Face

## 정의·핵심
- **정의**: 사전학습 모델·데이터셋을 공유하는 플랫폼(Hub)과 그것을 쓰는 라이브러리 묶음. NLP(BERT·GPT)와 ViT 실습에서 쓴다. (개론 17차시, 응용 14차시)
- **라이브러리 4개**
  - `transformers`: 모델·토크나이저. 강의에서 많이 쓴 순서 → `Trainer`, `TrainingArguments`, `AutoTokenizer`, `DataCollatorWithPadding`, `ViTForImageClassification`, `AutoModelForSequenceClassification`, `AutoImageProcessor`
  - `datasets`: `load_dataset("glue", "sst2")`, `load_dataset("beans")` 처럼 Hub의 데이터셋 불러오기
  - `evaluate`: 지표 불러오기 `evaluate.load("accuracy")`, `"f1"`, `"precision"`, `"recall"`
  - `pipeline`: 한 줄 추론 `pipeline("sentiment-analysis")`
- **Auto 클래스**: 모델 이름(체크포인트)만 주면 맞는 구조를 알아서 만든다.
  - `AutoTokenizer.from_pretrained("distilbert-base-uncased")`
  - `AutoModelForSequenceClassification.from_pretrained(이름, num_labels=2)` — 분류 헤드는 새로 붙어 무작위 초기화된다 (경고가 나는 게 정상)
- **Trainer 흐름** (DistilBERT SST-2 파인튜닝, 17차시)
  1. 데이터셋 토큰화: `ds.map(tokenize_fn, batched=True)`
  2. `DataCollatorWithPadding`: 배치마다 가장 긴 문장에 맞춰 패딩
  3. `TrainingArguments(output_dir, learning_rate, per_device_train_batch_size, num_train_epochs, eval_strategy)`
  4. `Trainer(model, args, train_dataset, eval_dataset, data_collator, compute_metrics).train()`
- **ViT** (응용 14차시): `AutoImageProcessor`(크기·정규화) + `ViTForImageClassification` → Beans 잎 병 분류 → [[ViT 파인튜닝 실습]]
- 모델은 처음 한 번 인터넷에서 내려받아 캐시(`~/.cache/huggingface`)에 저장된다.

## 수식·원리
```
문장 ─tokenizer─▶ input_ids, attention_mask ─model─▶ logits ─argmax─▶ 라벨
```

## 코드 예시
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch

name = "distilbert-base-uncased-finetuned-sst-2-english"   # 인터넷에서 내려받음
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForSequenceClassification.from_pretrained(name)

enc = tok(["I love this movie", "This is terrible"], padding=True, return_tensors="pt")
print(enc["input_ids"].shape)                   # torch.Size([2, 6]) 정도
with torch.no_grad():
    logits = model(**enc).logits
print(logits.argmax(dim=1).tolist())            # [1, 0]  (1=POSITIVE)
print(model.config.id2label)                    # {0: 'NEGATIVE', 1: 'POSITIVE'}

clf = pipeline("sentiment-analysis", model=name)
print(clf("What a great day")[0]["label"])      # POSITIVE
```

## 관련 개념
[[BERT]] · [[DistilBERT]] · [[토큰화(Tokenizer)]] · [[ViT]] · [[Hugging Face pipeline·Trainer]] · [[PLM·Pre-training·Fine-tuning]]
