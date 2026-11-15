---
title: Saliency Map
date: 2026-11-05 12:00:00 +0900
categories: [AI, XAI]
tags: [XAI, Saliency, 기울기, AI응용]
---
# Saliency Map

## 정의·핵심
- **정의 (응용 10차시)**: 입력 이미지의 **각 픽셀이 모델 출력에 얼마나 영향을 주는지** 시각화하는 기법 — **민감도(Sensitivity) 검사** (Simonyan et al., 2013)
  - 핵심 질문: "입력 이미지의 픽셀을 **아주 조금 바꿨을 때**, AI의 예측 결과가 **얼마나 크게 변하는가**?"
  - 한 줄 요약: "입력을 아주 조금 바꿨을 때 **결과가 흔들리는 곳**을 찾는다"
- **3단계 (강의)**
  1. **전처리**: 입력 이미지를 모델에 맞는 형태로 변환
  2. **기울기 계산**: **역전파**로 출력(클래스 점수)에 대한 **각 픽셀의 미분값** 계산
  3. **시각화**: 기울기의 **절댓값**을 취해 지도(Map)로 표현 (컬러 이미지면 채널 중 최댓값)
- **해석 (강의 예: 강아지 → "Golden Retriever")**: 붉고 밝은 영역 = 판단에 결정적으로 사용한 픽셀(눈, 코) / 어두운 영역 = 영향 거의 없음. 배경 노이즈가 강조될 수 있으니 **전체적인 형태**를 봐야 함
- **장점 (강의)**
  - **빠르고 간단**: 모델 구조 변경 없이 **역전파 1회**로 즉시 결과 → 빠른 1차 진단·모델 디버깅
  - **픽셀 단위(Pixel-level)** 로 세밀하게 확인
- **단점 (강의)**
  - **노이즈에 민감**: 지직거리는 TV 화면처럼 산만 → 직관적 해석 어려움 (개선: **SmoothGrad** — 노이즈를 섞은 여러 입력의 기울기 평균)
  - **기울기 소실·포화 (Saturation)**: 픽셀이 조금 변해도 예측이 변하지 않는 구간(예: sigmoid가 이미 1에 가까움)에서는 중요한 픽셀인데도 **중요도 0**으로 잘못 표시 → **Integrated Gradients**로 해결 → [[Integrated Gradients]]
- **흔한 오해 (강의)**: "Map이 선명하다고 모델 성능이 좋은 건 아님" (오히려 과적합 신호일 수도)
- **captum**: `Saliency(model).attribute(x, target=c)` (10차시 과제 문항 3) → [[captum·pytorch_grad_cam]]

## 수식·원리
```
S(x) = | ∂y_c / ∂x |               (컬러:  max_채널 |∂y_c/∂x_ch|)
1차 테일러:  y_c(x + δ) ≈ y_c(x) + ∇_x y_c · δ    → 기울기 = 민감도
SmoothGrad:  S̄(x) = (1/n) Σ_i | ∇ y_c(x + ε_i) |,   ε_i ~ N(0, σ²)
```

## 코드 예시
```python
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(0)
net = nn.Sequential(nn.Conv2d(1, 8, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2), nn.Flatten(), nn.Linear(8 * 8 * 8, 2))
X = 0.1 * torch.randn(256, 1, 16, 16); Y = torch.randint(0, 2, (256,))
X[Y == 1, :, 6:10, 6:10] += 1.0                               # 클래스 1 = 가운데 사각형
opt = torch.optim.Adam(net.parameters(), lr=0.01)
for _ in range(100):
    loss = F.cross_entropy(net(X), Y); opt.zero_grad(); loss.backward(); opt.step()

def saliency(x, cls):                                          # captum Saliency와 같은 계산
    x = x.clone().requires_grad_(True)
    net(x)[0, cls].backward()                                  # 역전파 1회
    return x.grad.abs()[0, 0]

x = 0.1 * torch.randn(1, 1, 16, 16); x[:, :, 6:10, 6:10] += 1.0
s = saliency(x, 1)
inside, outside = s[6:10, 6:10].mean().item(), s.sum().item() - s[6:10, 6:10].sum().item()
print(tuple(s.shape), inside > outside / (256 - 16))           # (16, 16) True  사각형 픽셀이 더 민감

smooth = torch.stack([saliency(x + 0.1 * torch.randn_like(x), 1) for _ in range(20)]).mean(0)   # SmoothGrad
print(smooth[6:10, 6:10].mean().item() > smooth.mean().item())  # True

z = torch.tensor([6.0], requires_grad=True)                    # 포화: sigmoid가 이미 1 근처
torch.sigmoid(2 * z).backward()
print(round(torch.sigmoid(2 * z).item(), 5), f"{z.grad.item():.1e}")   # 0.99999 1.2e-05  중요한 입력인데 기울기 ≈ 0
```

## 관련 개념
[[Integrated Gradients]] · [[Grad-CAM]] · [[XAI 기법 비교·도구]] · [[captum·pytorch_grad_cam]] · [[기울기 소실(Vanishing Gradient)]]
