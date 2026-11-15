---
title: Greedy Search·Beam Search
date: 2026-11-05 12:00:00 +0900
categories: [AI, 생성모델·응용]
tags: [생성모델, 이미지캡셔닝, 디코딩, AI응용]
---
# Greedy Search·Beam Search

## 정의·핵심
- **정의**: 학습된 디코더로 **추론할 때 다음 단어를 고르는 전략** (응용 8차시 "추론 전략: Greedy vs Beam Search")
- **Greedy Search — 매 순간 확률 1등만 선택**
  - **원리**: 현재 시점에서 확률이 가장 높은 단어 **1개만** 골라 다음 단계로 진행 (`argmax`)
  - **장점**: 계산 비용이 매우 적고 **추론 속도가 빠름**, 메모리 최소
  - **단점 — 국소 최적해(Local Optima)**: 지금 당장은 최선이지만 전체 문장으로는 어색할 수 있음, **한 번 잘못 고르면 되돌릴 수 없음**
  - **과제 문항 6 (sample)**: `<start>`/이미지 특징 입력 → LSTM → Linear → `argmax` → 그 단어를 Embedding해 다음 입력으로 → `<end>` 또는 최대 길이까지 반복
- **Beam Search — 상위 K개 후보(Beam Width) 유지**
  - **원리**: 매 시점 **누적 확률(로그 확률 합) 상위 k개 경로**를 유지하며 탐색 → 끝나면 누적 확률이 가장 높은 문장 선택
  - **장점 — 품질 향상**: 전체 문맥을 고려해 더 자연스럽고 정확한 캡션, 국소 최적해 위험 ↓
  - **단점 — 계산 비용**: **k배** 메모리와 연산 시간 (속도 ↔ 품질 트레이드오프)
  - **실무 Tip (강의)**: 이미지 캡셔닝에서 **k = 3 ~ 5** 가 적절. k가 너무 크면 오히려 **일반적인 문장(Generic Sentence)** 만 나오거나 향상폭 미미
- **보완 기법**: 길이 정규화(긴 문장이 누적 로그확률에서 불리한 문제 보정), 반복 억제
- **샘플링 계열** (다양성 필요 시): Top-k, Top-p(nucleus), Temperature — LLM 대화 생성에서 주로 사용

## 수식·원리
```
Greedy:  ŵ_t = argmax_w p(w | ŵ_{<t}, I)
Beam:    score(w_1..t) = Σ_{s≤t} log p(w_s | w_{<s}, I)
         매 시점 (k 경로 × V 단어) 중 score 상위 k개만 유지
길이 정규화: score / t^α
```

## 코드 예시
```python
import math

P = {                                              # 다음 단어 확률표 (이전 단어 → 분포)
    "<s>":  {"A": 0.5, "B": 0.4, "C": 0.1},
    "A":    {"x": 0.4, "y": 0.35, "<e>": 0.25},
    "B":    {"z": 0.9, "<e>": 0.1},
    "C":    {"<e>": 1.0},
    "x":    {"<e>": 1.0}, "y": {"<e>": 1.0}, "z": {"<e>": 1.0},
}

def greedy():
    seq, lp = ["<s>"], 0.0
    while seq[-1] != "<e>":
        w, p = max(P[seq[-1]].items(), key=lambda kv: kv[1])
        seq.append(w); lp += math.log(p)
    return seq[1:], round(math.exp(lp), 2)

def beam(k):
    beams = [(["<s>"], 0.0)]
    while not all(s[-1] == "<e>" for s, _ in beams):
        cand = []
        for s, lp in beams:
            if s[-1] == "<e>": cand.append((s, lp)); continue
            cand += [(s + [w], lp + math.log(p)) for w, p in P[s[-1]].items()]
        beams = sorted(cand, key=lambda c: -c[1])[:k]
    s, lp = beams[0]
    return s[1:], round(math.exp(lp), 2)

print(greedy())    # (['A', 'x', '<e>'], 0.2)   첫 단계 1등(A)을 골라 국소 최적
print(beam(2))     # (['B', 'z', '<e>'], 0.36)  후보 2개 유지 → 전체 확률이 더 높은 문장
```

## 관련 개념
[[CNN Encoder + LSTM Decoder]] · [[Teacher Forcing]] · [[캡셔닝 평가]] · [[Autoregressive 모델(언급)]]
