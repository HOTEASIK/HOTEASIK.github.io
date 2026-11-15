---
title: Google Colab
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, Colab, AI개론]
---
# Google Colab

## 정의·핵심
- **정의**: 구글이 제공하는 **브라우저용 Jupyter 노트북 환경**. 설치 없이 무료 GPU(T4)를 쓸 수 있어 강의 실습의 **권장 환경**이다. (개론 1차시: "Google Colab: 별도 설치 없이 GPU 사용 가능 (권장)")
- **GPU 런타임 켜기**: 메뉴 `[런타임] → [런타임 유형 변경] → 하드웨어 가속기: T4 GPU`
  - 확인: `!nvidia-smi` 또는 `torch.cuda.is_available()` → `True`, `torch.cuda.get_device_name(0)` → `Tesla T4`
  - T4는 FP16 연산이 빨라 AMP(혼합 정밀도)와 잘 맞는다 → [[AMP(혼합 정밀도)]]
- **구글 드라이브 마운트**: Colab 디스크는 **세션이 끝나면 지워진다.** 데이터·체크포인트(best.pt 등)는 드라이브에 저장한다.
  - `from google.colab import drive; drive.mount('/content/drive')` → 계정 인증 팝업 → `/content/drive/MyDrive/` 아래 접근
- **패키지 설치**: 셀에서 `!pip install wandb -q`, `!pip install ultralytics` 처럼 `!`를 붙여 셸 명령 실행. 기본 설치된 것(torch, numpy, sklearn, cv2 등)이 많다.
- **한글 폰트 설치**: 그래프 한글이 □로 깨질 때 `!apt-get install -y fonts-nanum` 설치 후 **[런타임] → [런타임 다시 시작]** 을 해야 Matplotlib이 새 폰트를 인식한다 → [[한글 폰트 설정]]
- **주의할 점**
  - 런타임 연결이 오래 쉬면 끊기고, 무료 사용량에 GPU 시간 제한이 있다
  - `cv2.imshow`가 안 된다 → `from google.colab.patches import cv2_imshow`
  - 웹캠·GUI 창(트랙바)이 필요한 실습은 ipywidgets로 대체 → [[ipywidgets]]
  - 파일 업로드: 왼쪽 파일 탭 또는 `files.upload()`

## 수식·원리
```
브라우저 ── 노트북(.ipynb) ── 구글 서버 VM(CPU/GPU, 임시 디스크)
                                  └─ /content/drive ── 내 구글 드라이브(영구 저장)
```

## 코드 예시
```
# Colab 셀에서 실행
!nvidia-smi                                  # GPU 이름·메모리 확인
from google.colab import drive
drive.mount('/content/drive')                # 인증 후 마운트
!pip install wandb -q                        # 패키지 설치
!apt-get -qq install -y fonts-nanum          # 한글 폰트 → 런타임 다시 시작
```
```python
import torch
device = "cuda" if torch.cuda.is_available() else "cpu"
print(device)                                # Colab GPU 런타임이면 cuda
if device == "cuda":
    print(torch.cuda.get_device_name(0))     # Colab 무료는 Tesla T4
```

## 관련 개념
[[Jupyter Notebook]] · [[GPU·CUDA]] · [[device와 GPU]] · [[한글 폰트 설정]] · [[VSCode]]
