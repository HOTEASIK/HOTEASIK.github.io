---
title: GPT-4o API로 VLM 쓰기
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [VLM, OpenAI, API, 실습, AI응용]
---
# GPT-4o API로 VLM 쓰기

## 정의·핵심
- **개요 (응용 16차시 Basic VLM 4단계)**: GPT-4o는 우리 GPU가 아니라 **OpenAI 서버에서 실행** → 이미지를 **base64로 인코딩해 API로 전송**하고 답을 받음
  - 비유: "사진을 찍어서 **이메일로 보내고**, 상대방이 답장을 보내주는 것"
- **API 키 관리**: Colab **Secrets**(`userdata.get(...)`)로 불러오고 **코드에 직접 쓰지 않음** (키 노출 = 과금 피해)
- **요청 구성**
  - `openai.chat.completions.create(model="gpt-4o", messages=[...], max_tokens=100)`
  - content에 **두 가지 타입**: `{"type": "image_url", "image_url": {"url": "data:image/png;base64,<b64>", "detail": "low"}}` + `{"type": "text", "text": 질문}`
  - **detail="low"**: 이미지를 저해상도로 처리 → **빠르고 비용 절감** (고정된 적은 토큰), "high"는 세밀한 글자·차트에 유리하지만 토큰·비용 ↑
  - 답변: `response.choices[0].message.content`
- **로컬 모델(Qwen3-VL) vs API 모델(GPT-4o) 비교 (강의 5단계, ChartQA N=20)**

| 항목 | Qwen3-VL-4B (로컬) | GPT-4o (API) |
|---|---|---|
| 실행 위치 | 내 GPU (T4) | OpenAI 서버 |
| 비용 | GPU 시간만 (호출당 무료) | **호출마다 과금** (토큰 수 기준) |
| 데이터 | 외부 전송 없음 | 이미지가 서버로 전송됨 |
| 준비 | 모델 다운로드·메모리 8.3 GB | API 키만 있으면 바로 |
| 비교 지표 | 정확도·지연 시간 | 정확도·지연 시간·비용 |

- **과금 주의**: 이미지도 **토큰으로 환산**되어 과금 → 반복 실험 시 `detail`, 이미지 크기, 호출 횟수 조절 → [[Qwen3-VL 실습]]

## 수식·원리
```
base64 크기 ≈ 원본 바이트 × 4/3
data URL = "data:image/png;base64," + b64
비용 ≈ (입력 토큰 × 입력 단가 + 출력 토큰 × 출력 단가) × 호출 수
```

## 코드 예시
강의 코드 (openai 패키지·API 키 필요, 호출마다 과금 — 이 환경 미실행):
```
import openai
from google.colab import userdata
openai.api_key = userdata.get("openai")          # Secrets에서 불러오기 (하드코딩 금지)

def ask_gpt4o(image, question, max_tokens=100):
    b64 = image_to_base64(image)
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"}},
            {"type": "text", "text": question},
        ]}],
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
```

실행 가능한 부분 (이미지 → base64 → 요청 본문 만들기):
```python
import base64, json
from io import BytesIO
import numpy as np
from PIL import Image

def image_to_base64(pil_image):                       # 강의 함수
    buf = BytesIO()
    pil_image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

img = Image.fromarray(np.zeros((64, 64, 3), dtype=np.uint8))
b64 = image_to_base64(img)
raw = base64.b64decode(b64)
print(raw[:4] == b"\x89PNG", round(len(b64) / len(raw), 2))   # True 1.36  PNG 시그니처, base64는 약 4/3배 (작은 파일은 패딩 때문에 조금 더 큼)

payload = {"model": "gpt-4o", "max_tokens": 100, "messages": [{"role": "user", "content": [
    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"}},
    {"type": "text", "text": "What is the highest bar?"}]}]}
print([c["type"] for c in payload["messages"][0]["content"]], payload["messages"][0]["content"][0]["image_url"]["url"][:22])
# ['image_url', 'text'] data:image/png;base64,

restored = Image.open(BytesIO(base64.b64decode(b64)))
print(restored.size, len(json.dumps(payload)) > len(b64))   # (64, 64) True  서버 쪽에서 그대로 복원 가능
```

## 관련 개념
[[Qwen3-VL 실습]] · [[VLM 구조]] · [[LLM·ChatGPT]] · [[비트와 양자화]]
