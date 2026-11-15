---
title: ImageNet·ILSVRC
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, 데이터셋, 평가지표, 대학원, AI개론]
---
# ImageNet·ILSVRC

## 정의·핵심
- **ImageNet**: **1,500만 장 이상**의 라벨된 고해상도 이미지, **약 22,000개 범주**로 이루어진 대규모 이미지 데이터베이스 (대학원 01)
- **ILSVRC (ImageNet Large Scale Visual Recognition Challenge)**: ImageNet의 일부(**1,000개 클래스, 학습 약 128만 장**)로 매년 열린 이미지 인식 대회 (2010~2017)
  - 분류(CLS), 위치 찾기(LOC), 검출(DET) 부문
- **딥러닝 역사의 이정표 (Top-5 오류율)**

| 연도 | 우승·주요 모델 | Top-5 오류 | 의미 |
|---|---|---|---|
| 2012 | **AlexNet** | 16.4% | CNN 대중화, 딥러닝 돌파의 해 |
| 2014 | **GoogLeNet** (1위) / VGG (2위) | 6.7% / 7.3% | 깊이와 효율 |
| 2015 | **ResNet** (152층) | **3.57%** | 사람 수준(5~10%) 초과 |

- **Top-1 / Top-5 오류율** (개론 13차시)
  - **Top-1 에러**: 모델이 **가장 높게** 예측한 클래스가 정답이 아닐 확률
  - **Top-5 에러**: **상위 5개** 예측 안에 정답이 없을 확률 — 1,000개 클래스 중 비슷한 품종(개 품종 등)이 많아 함께 쓰인다
  - torchvision 사전학습 모델 (강의 표): AlexNet 43.45/20.91, VGG-19-BN 25.76/8.15, ResNet-18 30.24/10.92, ResNet-152 21.69/5.94
- **사전학습의 원천**: torchvision 등 대부분의 사전학습 모델은 ImageNet-1K로 학습 → 출력층이 **1000개**, 입력 **224×224**, 정규화 통계도 ImageNet 값 → [[사전학습(Pretrained) 모델]], [[ImageNet 정규화 통계]]

## 수식·원리
```
Top-k 정확도 = (1/N) Σ 1[ yᵢ ∈ topk(logitsᵢ) ]
Top-k 에러 = 1 − Top-k 정확도
```

## 코드 예시
```python
import torch

torch.manual_seed(0)
logits = torch.randn(1000, 10)                        # 1000개 샘플, 10개 클래스 (예시)
y = torch.randint(0, 10, (1000,))
logits[torch.arange(1000), y] += 1.5                  # 정답 쪽 점수를 조금 올림
top1 = (logits.argmax(1) == y).float().mean()
top5 = (logits.topk(5, dim=1).indices == y[:, None]).any(1).float().mean()
print(round(1 - top1.item(), 3), round(1 - top5.item(), 3))   # Top-1 에러 > Top-5 에러
print(top5 >= top1)                                           # tensor(True)
```

## 관련 개념
[[AlexNet]] · [[GoogLeNet]] · [[VGG]] · [[ResNet]] · [[사전학습(Pretrained) 모델]] · [[CNN 아키텍처 진화 정리]]
