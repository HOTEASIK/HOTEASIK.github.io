---
title: "Hugging_Face_모델_폴더_설명"
date: 2026-11-05 12:00:00 +0900
categories: [AI, 개인비서]
tags: []
---
# Hugging Face 모델 폴더란?

## 간단히 말하면

Hugging Face 모델 폴더는 Transformers 같은 라이브러리가 모델을 불러오는 데 필요한 파일을 모아 둔 디렉터리입니다. 로컬 폴더일 수도 있고 Hugging Face Hub의 모델 저장소를 내려받은 사본일 수도 있습니다. 단일한 고정 파일 구성이 있는 것은 아니며, 모델 구조와 저장 방식에 따라 달라집니다.

전형적인 폴더에는 다음 종류의 파일이 있을 수 있습니다.

```text
my_model/
  config.json                 # 모델 구조/설정
  model.safetensors           # 가중치 (크면 여러 shard로 나뉠 수 있음)
  model.safetensors.index.json # 분할 가중치의 인덱스(분할 저장 시)
  tokenizer.json              # 토크나이저 어휘와 설정(모델마다 구성 상이)
  tokenizer_config.json       # 토크나이저 설정
  special_tokens_map.json     # 특수 토큰 정보(있을 수 있음)
  chat_template.jinja         # 대화 형식 템플릿(있을 수 있음)
```

이 목록은 예시입니다. 모델에 따라 `tokenizer.model`, `generation_config.json` 등이 있을 수 있고, 일부 토크나이저/템플릿 정보는 다른 설정 파일에 포함될 수 있습니다. 가중치 파일은 `pytorch_model.bin`일 수도 있으며, 파일 이름과 분할 구조는 저장 형식에 따라 다릅니다.

## Python에서 쓰는 이유

Transformers는 모델 설정과 토크나이저를 함께 읽어 입력을 토큰화하고 모델 출력을 생성합니다. 대화형 모델은 모델이 학습한 메시지 형식에 맞는 chat template이 중요합니다. 템플릿이 다르면 응답이 이상해지거나 대화 역할 경계가 틀릴 수 있습니다. [Transformers chat template 문서](https://huggingface.co/docs/transformers/main/chat_templating)

Transformers에서 저장한 `save_pretrained()` 결과는 통상 다시 `from_pretrained()`로 불러올 수 있는 형태의 디렉터리입니다. 단, 필요한 가중치와 토크나이저 파일을 함께 보존해야 하고, LoRA 결과라면 어댑터만 저장됐는지 완전한 모델이 저장됐는지 구분해야 합니다.

## 기반 모델과 LoRA 어댑터

- **기반 모델 폴더**: 원래의 모델 가중치와 설정/토크나이저를 포함합니다.
- **LoRA 어댑터 폴더**: 학습으로 추가된 작은 어댑터 가중치와 설정을 저장합니다. 보통 이를 실행할 기반 모델이 별도로 필요합니다.
- **병합 모델 폴더**: 어댑터 변경 사항을 기반 모델 가중치에 합쳐 독립 실행에 가까운 형태로 저장한 결과입니다. 파일이 커질 수 있으며 병합 가능 여부와 저장 정밀도를 확인해야 합니다.

폴더 이름만 보고 어떤 종류인지 판단하지 말고, `adapter_config.json` 및 가중치 파일과 학습/저장 기록을 확인합니다. Hugging Face PEFT는 어댑터 방식이 전체 모델 파라미터의 일부만 학습하는 구조임을 설명합니다. [Transformers PEFT 문서](https://huggingface.co/docs/transformers/peft)

## 개인 비서 프로젝트에서의 흐름

```text
기반 Hugging Face 모델 폴더
        + 학습 대화 데이터(JSONL)
        ↓ LoRA/QLoRA SFT
LoRA 어댑터 체크포인트
        ↓ Python에서 기반 모델 + 어댑터 로드
대화 품질 평가
        ↓ 필요할 때만 병합/변환
선택적인 GGUF 내보내기
```

원본 모델, 학습 어댑터, 병합 모델, 변환된 GGUF는 이름이 명확한 별도 디렉터리에 보존합니다. 모델 카드의 라이선스, 출처, 사용 조건도 함께 기록합니다.

## GGUF와 차이

| 구분 | Hugging Face 모델 폴더 | GGUF |
|---|---|---|
| 형태 | 설정·토크나이저·가중치가 든 폴더 | 주로 하나의 바이너리 파일(때로 분할 파일) |
| 주된 용도 | Transformers 기반 학습과 Python 추론 | llama.cpp 계열 로컬 추론 |
| 파인 튜닝 준비 | 기반 모델로 사용하기 적합 | 일반적으로 학습 원본 형식으로 삼지 않음 |
| 변환 | GGUF로 변환할 원본이 될 수 있음 | 다른 런타임용 원본 폴더를 대체하지 않음 |

이 프로젝트는 Python 직접 실행이 목표이므로 **Hugging Face 형식으로 학습·평가를 먼저 진행하는 것을 추천**합니다. GGUF는 나중에 llama.cpp 계열로 실행할 필요가 생길 때 검토합니다.

## 공식 참고 자료

- [Transformers chat templates](https://huggingface.co/docs/transformers/main/chat_templating)
- [Transformers PEFT](https://huggingface.co/docs/transformers/peft)
- [TRL SFTTrainer 데이터 형식](https://huggingface.co/docs/trl/sft_trainer)
