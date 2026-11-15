---
title: In-context Learning
date: 2026-11-05 12:00:00 +0900
categories: [AI, NLP·Transformer]
tags: [NLP, LLM, 프롬프트, AI응용]
---
# In-context Learning

## 정의·핵심
- **정의 (응용 14차시 "GPT-3와 LLMs")**: GPT-3가 **별도의 fine-tuning 과정 없이 프롬프트 안의 예시만으로** 학습한 것과 같은 효과를 내는 것 — 가중치는 바뀌지 않음
- **등장 배경 — Fine-tuning의 필요성? (강의)**
  - 대부분의 PLM은 사전학습 후 fine-tuning으로 태스크 학습
  - fine-tuning은 **수천~수만 개 데이터**가 필요하고 **오버피팅** 되기 쉬움
  - 각 Downstream Task마다 fine-tuning된 모델을 **각각** 만들어야 함
  - 사람은 **예제 몇 개만 주면** 바로 이해하고 문제를 풂 → 대조적
- **방식 (강의)**: LLM에게
  - **Zero-shot**: 예시 없이 지시만 ("다음 문장을 프랑스어로 번역해:")
  - **One-shot**: 예시 1개
  - **Few-shot**: 예시 몇 개
  - → **프롬프트 엔지니어링의 시작**
- **모델 크기와의 관계 (강의)**: **모델이 커질수록 In-context Learning의 효율성이 높아짐** (GPT-3 논문: 1.3B → 13B → 175B에서 few-shot 향상폭이 커짐) — 작은 모델에선 거의 안 됨 → [[LLM·ChatGPT]]
- **발전된 프롬프트 기법**: **Chain-of-Thought**(단계별 추론 예시), Self-consistency, 지시 튜닝(Instruction Tuning)으로 zero-shot 능력 강화, RAG(검색한 문서를 프롬프트에 넣기)
- **한계**: 컨텍스트 길이 제한, 예시 순서·형식에 민감, 매 호출마다 예시 토큰 비용 → 반복 사용이 많으면 LoRA 등 파인튜닝이 경제적 → [[LoRA]]

## 수식·원리
```
Fine-tuning:   θ' = θ − η∇L(데이터)  → p_θ'(y | x)
In-context:    θ 고정,  p_θ(y | [예시1; 예시2; ...; x])
Zero-shot: k=0,  One-shot: k=1,  Few-shot: k = 수 개
```

## 코드 예시
```python
def build_prompt(task, examples, query):
    lines = [task]
    for x, y in examples:
        lines.append(f"Input: {x}\nOutput: {y}")
    lines.append(f"Input: {query}\nOutput:")
    return "\n\n".join(lines)

demos = [("sea otter", "loutre de mer"), ("cheese", "fromage"), ("peppermint", "menthe poivrée")]
zero = build_prompt("Translate English to French.", [], "plush giraffe")
few = build_prompt("Translate English to French.", demos, "plush giraffe")
print(zero.count("Input:"), few.count("Input:"))     # 1 4  zero-shot vs few-shot(예시 3개 + 질문)
print(few.splitlines()[-2:])                         # ['Input: plush giraffe', 'Output:']  모델이 이어서 생성
print(len(few) > len(zero))                          # True  가중치는 그대로, 프롬프트(토큰 비용)만 늘어남
```

## 관련 개념
[[GPT]] · [[LLM·ChatGPT]] · [[LoRA]] · [[PLM·Pre-training·Fine-tuning]]
