---
title: OpenAI API
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, LLM, AI응용]
---
# OpenAI API

## 정의·핵심
- **정의**: GPT 계열 모델(GPT-4o 등)을 **인터넷으로 호출해 쓰는 유료 API**. 모델을 내려받거나 학습하지 않고, 요청을 보내면 답을 받는다. (응용 14차시: "LLM은 [직접] 사용할 수 없어도 ChatGPT API, GPT-4 API는 사용할 수 있음")
- **로컬 모델과 차이**: 거대한 LLM을 내 GPU로 돌리긴 어렵다 → API로 쓰면 GPU가 필요 없다. 대신 **토큰 단위로 비용**이 들고, 데이터가 외부 서버로 간다.
- **준비**
  - platform.openai.com에서 API 키 발급 → **환경변수 `OPENAI_API_KEY`에 저장** (코드·노트북·Git에 키를 직접 쓰지 않는다. Colab은 왼쪽 🔑 보안 비밀 사용)
  - `pip install openai`
- **호출 구조 (Chat Completions)**
  - `client = OpenAI()` → 환경변수의 키를 자동으로 읽음
  - `client.chat.completions.create(model="gpt-4o", messages=[...])`
  - `messages`: 역할별 대화 목록 — `system`(역할·규칙 지시), `user`(질문), `assistant`(이전 답)
  - 답: `resp.choices[0].message.content`, 사용량: `resp.usage.total_tokens`
- **주요 옵션**: `temperature`(0에 가까울수록 일정한 답, 높을수록 다양), `max_tokens`(답 길이 제한)
- **GPT-4o의 'o'(omni)**: 글뿐 아니라 이미지도 입력으로 받는다 → `content`에 `{"type": "image_url", ...}`를 넣어 이미지 설명·VQA 가능
- 대화를 이어가려면 이전 질문·답을 `messages`에 계속 붙여 보낸다 (API는 기억이 없다)

## 수식·원리
```
messages = [system 지시, user 질문, (assistant 이전 답, user 다음 질문 ...)]
   ─HTTPS + API 키─▶ GPT-4o ─▶ choices[0].message.content (+ usage 토큰 수 → 비용)
```

## 코드 예시
```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])   # 키는 환경변수에서
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "너는 딥러닝 조교다. 한 문장으로 답해."},
        {"role": "user", "content": "역전파가 뭐야?"},
    ],
    temperature=0.2,
)
print(resp.choices[0].message.content)
print(resp.usage.total_tokens)
```

## 관련 개념
[[GPT]] · [[LLM]] · [[Hugging Face]] · [[VQA·멀티모달]] · [[프롬프트]]
