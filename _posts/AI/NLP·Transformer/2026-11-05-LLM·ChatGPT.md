---
title: LLM·ChatGPT
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, LLM, GPT, AI응용]
---
# LLM·ChatGPT

## 정의·핵심
- **LLM (Large Language Model)**: 강의 정의 — 일반적으로 **10B(100억 개) 이상의 파라미터**를 가진 언어 모델 (응용 14차시 "현재의 LLM Q&A")
  - BERT, RoBERTa, GPT-2, BART, T5 등은 **해당되지 않음**
  - 현재 LLM은 대부분 **GPT 계열의 디코더 모델** → [[GPT]]
- **ChatGPT**: GPT-3.5/4 계열 LLM을 **대화용으로 정렬(Alignment)** 한 서비스
  1. **사전학습**: 대용량 텍스트로 다음 토큰 예측
  2. **SFT (지시 튜닝)**: 사람이 작성한 (지시, 좋은 응답) 쌍으로 파인튜닝
  3. **RLHF**: 사람이 응답 순위를 매긴 데이터로 **보상 모델** 학습 → 강화학습(PPO)으로 사람 선호에 맞춤 (최근엔 DPO 등)
- **강의 Q&A**
  - **Q1. 10B 이상 모델을 서비스에 적용하는 것이 쉬운가?** → 요약·번역 등에 쓸 수는 있지만 현실적으로 **인퍼런스 비용 문제**
  - **Q2. 10B 이상 모델이 오픈소스로 공개되어 있는가?** → Polyglot-ko 12.8B 등 공개됨
  - **Q3. 공개된 10B 내외 모델이 ChatGPT를 대체 가능할까? (KoAlpaca 등)** → ChatGPT를 175B로 추정할 때 절대 성능으로 따라잡을 수 없음, 흉내라도 내려면 최소 30B, 60B는 되어야 함 (강의 시점 기준)
- **튜닝**: 전체 파인튜닝은 비쌈 → **LoRA** / 예시만으로 → **In-context Learning** → [[LoRA]], [[In-context Learning]]
- **NLP 엔지니어로서의 방향성 (강의)**
  - 대부분 기업은 여전히 LLM을 자체 운용하기 어려움 → **BERT, RoBERTa, GPT-2, BART, T5를 다룰 수 있는 것이 경쟁력** (분류·NER·MRC는 여전히 강력)
  - LLM은 못 돌려도 **ChatGPT API, GPT-4 API는 사용 가능**:
    - ChatGPT API로 **데이터 레이블링** 후 위의 작은 모델 튜닝
    - ChatGPT API + **Embedding API**로 사내 데이터 기반 챗봇 (RAG)
    - **langchain, AutoGPT** 등으로 애플리케이션 개발
  - API 키는 코드에 직접 쓰지 않고 환경변수·보안 저장소에서 읽음 (강의 보강 실습도 `userdata.get`으로 키를 불러옴)
- **스케일링 법칙**: 파라미터·데이터·연산을 늘리면 손실이 멱법칙으로 감소, 일정 규모 이상에서 **창발 능력**(few-shot, 추론) 관찰
- **한계**: 환각(Hallucination), 최신 정보 부재(→ RAG), 비용·지연, 편향

## 수식·원리
```
사전학습:  min −Σ log p(x_t | x_<t)
SFT:      min −Σ log p(y_t | y_<t, 지시)
RLHF:     max E[r_φ(x, y)] − β·KL(π_θ ‖ π_SFT)
파라미터 메모리(fp16) ≈ 2 bytes × N   (예: 175B → 350GB)
```

## 코드 예시
```python
def mem_gb(params_b, bytes_per=2):                  # fp16 기준 가중치 메모리
    return params_b * 1e9 * bytes_per / 1e9

for name, b in [("BERT-base", 0.11), ("GPT-2", 1.5), ("Polyglot-ko", 12.8), ("GPT-3", 175)]:
    is_llm = b >= 10                                # 강의 정의: 10B 이상
    print(f"{name:12s} {b:>6}B  LLM={is_llm!s:5s}  {mem_gb(b):7.1f} GB")
# BERT-base      0.11B  LLM=False      0.2 GB
# GPT-2           1.5B  LLM=False      3.0 GB
# Polyglot-ko    12.8B  LLM=True      25.6 GB
# GPT-3           175B  LLM=True     350.0 GB  → 추론 비용 문제 (강의 Q1)

print(mem_gb(12.8, 0.5))                            # 6.4  4bit 양자화 시 (QLoRA 등)
```

## 관련 개념
[[GPT]] · [[In-context Learning]] · [[LoRA]] · [[NLU vs NLG]] · [[PLM·Pre-training·Fine-tuning]] · [[임베딩]]
