---
title: Fully Connected 층
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, CNN, AI개론, 대학원]
---
# Fully Connected 층

## 정의·핵심
- **정의**: 전결합층(완전연결층, Dense). 입력의 **모든 값이 모든 출력 노드와 연결**된 층. PyTorch `nn.Linear(in, out)` = `y = xWᵀ + b`
- **CNN에서의 역할 (개론 11차시)**: 합성곱·풀링이 뽑은 **핵심 특징들의 조합을 보고 최종 결론**을 내린다. 레고 비유: "이 부품들로는 자동차를 만들 수 있겠군!"
  - 대학원 05: 이전 층 출력을 펼쳐(flatten) 하나의 벡터로 만든 뒤 다음 단계의 입력으로 사용
  - 마지막 FC의 출력 수 = **클래스 수** (로짓) → CrossEntropyLoss
- **구성 예 (강의)**: `classifier = Sequential(Linear(6272, n_hidden), ReLU, Linear(n_hidden, n_output))`
  - AlexNet·VGG: FC 4096 → 4096 → 1000 (+ Dropout)
  - ResNet: GAP 뒤 **FC 하나** `Linear(512, 1000)`
- **특징과 단점**
  - 위치 개념이 없다: 입력 순서만 다를 뿐 모든 값을 똑같이 섞는다 → 이미지 자체를 바로 넣으면 공간 정보 손실 (MLP 53% vs CNN 66%)
  - **파라미터가 매우 많다**: VGG16 전체 1.38억 개 중 FC가 약 1.2억 → 메모리·과적합의 주범 → Dropout을 FC 사이에 넣는 이유
  - 입력 크기가 고정 → 이미지 크기가 바뀌면 오류 (GAP으로 해결)
- **전이학습에서의 의미**: 사전학습 모델의 마지막 FC만 **우리 클래스 수로 교체**하는 것이 기본 → [[출력층 교체]]

## 수식·원리
```
y = x Wᵀ + b,   W: (out, in),  b: (out)
Params = in · out + out
VGG16 FC: 25088·4096 + 4096·4096 + 4096·1000 (+bias) ≈ 1.24억
```

## 코드 예시
```python
import torch
import torch.nn as nn

classifier = nn.Sequential(nn.Linear(6272, 128), nn.ReLU(inplace=True), nn.Linear(128, 10))
print(classifier(torch.randn(100, 6272)).shape)            # torch.Size([100, 10])  클래스별 로짓
fc = nn.Linear(4, 3)
x = torch.randn(2, 4)
print(torch.allclose(fc(x), x @ fc.weight.T + fc.bias))    # True
vgg_fc = 25088 * 4096 + 4096 + 4096 * 4096 + 4096 + 4096 * 1000 + 1000
print(vgg_fc)                                              # 123642856  ← VGG16 파라미터 대부분
try:
    nn.Linear(6272, 10)(torch.randn(1, 5000))
except RuntimeError as e:
    print("크기 불일치:", "shapes cannot be multiplied" in str(e))   # 크기 불일치: True
```

## 관련 개념
[[Flatten]] · [[Feature Extractor·Classifier 구조]] · [[Global Average Pooling(GAP)]] · [[출력층 교체]] · [[Dropout]] · [[다층 퍼셉트론(MLP)]]
