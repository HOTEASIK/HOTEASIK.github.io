---
title: DistilBERT
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, BERT, 경량화, 지식증류, AI응용]
---
# DistilBERT

## 정의·핵심
- **정의**: Hugging Face (Sanh et al., 2019). BERT-base를 **지식 증류(Knowledge Distillation)** 로 압축한 경량 모델 — **층 수를 절반(12 → 6)**, 파라미터 약 **40% 감소(66M)**, 추론 약 **60% 빠름**, 성능은 BERT의 약 **97%** 유지 (개론 17차시 "DistilBERT 개요", 응용 14차시 SST-2 실습)
- **지식 증류**
  - **Teacher**(큰 BERT)의 출력 확률 분포(soft label)를 **Student**(작은 모델)가 따라 하도록 학습
  - Soft label은 "정답 외 클래스들이 얼마나 그럴듯한가"까지 담음 → 정답 레이블(hard)만 쓸 때보다 많은 정보
  - **Temperature T**로 분포를 부드럽게 (`softmax(z/T)`)
  - DistilBERT 손실 = 증류 손실(KL) + MLM 손실 + 은닉 상태 **코사인** 손실
- **구조 변경**: NSP 제거, **token type(segment) 임베딩 제거**, Teacher의 층을 하나 걸러 가져와 초기화
- **강의 실습 (SST-2 / IMDb)**
  - `MODEL = "distilbert-base-uncased"` → `AutoTokenizer`, `AutoModelForSequenceClassification(num_labels=2)`
  - 전처리 `tokenizer(ex["sentence"], truncation=True, max_length=256)` → `DataCollatorWithPadding`(동적 패딩)
  - `TrainingArguments(eval_strategy="epoch", per_device_train_batch_size=16, num_train_epochs=2, learning_rate=2e-5, fp16=GPU일 때, seed=2025)`
  - 지표: accuracy, F1 (IMDb 실습은 precision·recall 추가)
  - 추론: "This movie was amazing!" → Positive 확률, "Worst film ever." → Negative 확률
  - **fp16**: 16bit 부동소수점 → 메모리 절반·속도 향상 (A100 이상은 **bf16** 권장) — 강의 주석
- **언제 쓰나**: 정확도 약간 양보하고 **속도·메모리**가 중요할 때 (모바일, 실시간 서비스, 실습 환경)

## 수식·원리
```
p_T = softmax(z_teacher / T),   p_S = softmax(z_student / T)
L_distill = T² · KL(p_T ‖ p_S)
L = α·L_distill + β·L_MLM + γ·L_cos(h_T, h_S)
```

```
# Hugging Face 사용 (강의 실습 코드 요약, transformers·datasets 필요)
from transformers import AutoTokenizer, AutoModelForSequenceClassification, DataCollatorWithPadding
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
enc = ds.map(lambda ex: tokenizer(ex["sentence"], truncation=True, max_length=256), batched=True)
collator = DataCollatorWithPadding(tokenizer=tokenizer)
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

def n_params(layers, d=768, ff=3072, V=30522, pos=512):
    per_layer = 4 * d * d + 4 * d + 2 * d * ff + d + ff + 4 * d        # attention + FFN + LayerNorm 2개
    return V * d + pos * d + 2 * d + layers * per_layer                 # 임베딩(토큰·위치) + LN
bert, distil = n_params(12) + 2 * 768, n_params(6)                     # BERT는 segment 임베딩 추가
print(round(bert / 1e6), round(distil / 1e6), round(1 - distil / bert, 2))   # 109 66 0.39

torch.manual_seed(0)
teacher_logits = torch.tensor([[4.0, 1.5, 0.2]])
T = 3.0
print([round(v, 3) for v in F.softmax(teacher_logits, -1)[0].tolist()])        # [0.905, 0.074, 0.02]  hard에 가까움
print([round(v, 3) for v in F.softmax(teacher_logits / T, -1)[0].tolist()])    # [0.583, 0.253, 0.164]  soft label

student = nn.Linear(5, 3); x = torch.randn(1, 5)
opt = torch.optim.SGD(student.parameters(), lr=0.5)
for _ in range(200):
    loss = T * T * F.kl_div(F.log_softmax(student(x) / T, -1), F.softmax(teacher_logits / T, -1), reduction="batchmean")
    opt.zero_grad(); loss.backward(); opt.step()
print(round(loss.item(), 4), student(x).argmax().item())                       # 0.0 0  Teacher 분포를 따라감
```

## 관련 개념
[[BERT]] · [[PLM·Pre-training·Fine-tuning]] · [[텍스트 분류 실습]] · [[Hugging Face pipeline·Trainer]] · [[RoBERTa]]
