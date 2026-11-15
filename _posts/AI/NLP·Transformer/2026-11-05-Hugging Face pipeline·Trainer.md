---
title: Hugging Face pipeline·Trainer
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, HuggingFace, 도구, AI응용]
---
# Hugging Face pipeline·Trainer

## 정의·핵심
- **Hugging Face**: 사전학습 모델 허브(Hub)와 라이브러리 생태계 — `transformers`(모델·토크나이저), `datasets`(데이터 로드·전처리), `evaluate`(지표), `accelerate`(분산·혼합정밀도) (개론 17차시·응용 14차시 실습 설치: `datasets>=3.0.1`, `transformers>=4.45.2`, `accelerate>=1.0.1`, `evaluate>=0.4.2`)
- **pipeline**: 전처리 → 모델 → 후처리를 한 줄로 — `pipeline("sentiment-analysis")`, `"text-generation"`, `"image-classification"`, `"summarization"`, `"translation"` 등. 빠른 시연·추론용
- **Auto 클래스**: 모델 이름만으로 맞는 클래스 자동 선택
  - `AutoTokenizer` (텍스트) / `AutoImageProcessor` (이미지) → [[토큰화(Tokenizer)]]
  - `AutoModelForSequenceClassification(num_labels=2)`, `ViTForImageClassification` — 사전학습 본체 + 태스크 헤드
- **datasets**: `load_dataset("nyu-mll/glue", "sst2")`, `"stanfordnlp/imdb"`, `"AI-Lab-Makerere/beans"` → `ds.map(fn, batched=True, remove_columns=[...])`
- **Data Collator**: 배치 만들기 — `DataCollatorWithPadding`(텍스트 **동적 패딩**), `DefaultDataCollator`(이미지 텐서) → [[어휘집(Vocabulary)·패딩]]
- **Trainer + TrainingArguments**: 학습 루프(forward·backward·옵티마이저·스케줄러·평가·체크포인트)를 대신 수행
  - 강의 주요 인자: `output_dir`, `eval_strategy="epoch"`(구버전 `evaluation_strategy`), `save_strategy="epoch"`, `per_device_train/eval_batch_size`, `num_train_epochs`, `learning_rate=2e-5`, `weight_decay=0.01`, `load_best_model_at_end=True`, `fp16=torch.cuda.is_available()`, `report_to="none"`(wandb·tensorboard 끔), `seed=2025`, `remove_unused_columns=False`(이미지)
  - **버전 호환 (강의 17차시)**: v4는 `evaluation_strategy`, 최신은 `eval_strategy` → `inspect.signature(TrainingArguments.__init__)`로 지원 인자를 확인해 넣는 헬퍼 사용
  - `compute_metrics(eval_pred)`: `(logits, labels)` → `argmax(-1)` → accuracy, f1, precision, recall (`evaluate.load(...)`)
- **흐름**: `trainer.train()` → `trainer.evaluate()` → `trainer.predict(test)` → `save_model` / `push_to_hub`
- 본 정리 환경에는 `transformers`가 설치되어 있지 않아, 아래 HF 코드는 실행하지 않은 **참고 코드**이고 실행 예시는 Trainer가 하는 일을 순수 PyTorch로 재현한 것

```
# 강의 SST-2 실습 요약 (transformers·datasets·evaluate 필요)
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, DataCollatorWithPadding, TrainingArguments, Trainer
clf = pipeline("sentiment-analysis")
clf("This movie was amazing!")                     # [{'label': 'POSITIVE', 'score': ...}]

tok = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
enc = ds.map(lambda ex: tok(ex["sentence"], truncation=True, max_length=256), batched=True, remove_columns=["sentence", "idx"])
args = TrainingArguments(output_dir="./sst2", eval_strategy="epoch", save_strategy="epoch",
                         per_device_train_batch_size=16, num_train_epochs=2, learning_rate=2e-5,
                         load_best_model_at_end=True, report_to="none", seed=2025)
trainer = Trainer(model=model, args=args, train_dataset=enc["train"], eval_dataset=enc["validation"],
                  data_collator=DataCollatorWithPadding(tok), compute_metrics=metrics)
trainer.train()
```

## 수식·원리
```
Trainer 한 스텝:  logits = model(**batch) → loss = CE(logits, labels) → backward → optimizer.step → scheduler.step
eval_strategy="epoch": epoch 끝마다 compute_metrics(argmax(logits), labels)
load_best_model_at_end: 검증 지표가 가장 좋은 체크포인트로 복원
```

## 코드 예시
```python
import inspect
import numpy as np
import torch
import torch.nn as nn

def compute_metrics(eval_pred):                         # 강의 compute_metrics와 같은 형태
    logits, labels = eval_pred
    preds = logits.argmax(-1)
    tp = ((preds == 1) & (labels == 1)).sum(); p = tp / max((preds == 1).sum(), 1); r = tp / max((labels == 1).sum(), 1)
    return {"acc": float((preds == labels).mean()), "f1": float(2 * p * r / (p + r)) if p + r else 0.0}

def collate(batch, pad=0):                              # DataCollatorWithPadding 역할: 배치 최대 길이까지만
    L = max(len(x) for x, _ in batch)
    ids = torch.tensor([x + [pad] * (L - len(x)) for x, _ in batch])
    return {"input_ids": ids, "attention_mask": (ids != pad).long(), "labels": torch.tensor([y for _, y in batch])}

b = collate([([5, 6, 7], 1), ([8, 9], 0)])
print(b["input_ids"].tolist(), b["attention_mask"].tolist())   # [[5, 6, 7], [8, 9, 0]] [[1, 1, 1], [1, 1, 0]]

class MiniTrainer:                                      # Trainer가 대신 해주는 학습·평가 루프
    def __init__(self, model, lr, epochs): self.m, self.opt, self.ep = model, torch.optim.AdamW(model.parameters(), lr=lr), epochs
    def train(self, X, y, Xv, yv):
        for e in range(self.ep):
            loss = nn.functional.cross_entropy(self.m(X), y); self.opt.zero_grad(); loss.backward(); self.opt.step()
        with torch.no_grad(): return compute_metrics((self.m(Xv).numpy(), yv.numpy()))

torch.manual_seed(0)
X = torch.randn(200, 4); y = (X[:, 0] > 0).long()
print(MiniTrainer(nn.Linear(4, 2), lr=0.1, epochs=100).train(X[:150], y[:150], X[150:], y[150:])["acc"] > 0.9)   # True

def make_args(**kw):                                    # 강의 버전 호환 헬퍼 아이디어
    sig = inspect.signature(lambda output_dir, eval_strategy=None, learning_rate=5e-5: None).parameters
    return {k: v for k, v in kw.items() if k in sig}
print(make_args(output_dir="./r", evaluation_strategy="epoch", eval_strategy="epoch", learning_rate=2e-5))   # 지원하지 않는 evaluation_strategy는 빠짐
```

## 관련 개념
[[DistilBERT]] · [[ViT 파인튜닝 실습]] · [[텍스트 분류 실습]] · [[토큰화(Tokenizer)]] · [[PLM·Pre-training·Fine-tuning]]
