---
title: Integrated Gradients
date: 2026-11-05 12:00:00 +0900
categories: [AI, XAI]
tags: [XAI, IntegratedGradients, 기울기, AI응용]
---
# Integrated Gradients

## 정의·핵심
- **정의 (응용 10차시)**: 딥러닝 모델 출력에 대한 **입력 특징의 기여도를 정량적으로 계산**하는 기법 (Sundararajan et al., 2017). **기준값(Baseline)에서 입력값까지의 선형 경로를 따라 기울기를 누적(적분)**
  - 비유: "**등산하듯 누적하기**" — 한 지점의 기울기만 보는 대신 출발점부터 도착점까지 **모든 기울기를 더함** ("모든 발자국을 더하면 높이가 된다")
- **3단계 (강의)**
  1. **Baseline (산 입구)**: 정보가 없는 상태(예: **검정색 이미지**)에서 시작 — "아무런 특징도 없는 0의 상태"
  2. **경로 (Path)**: Baseline에서 실제 이미지까지 **조금씩 픽셀값을 변화** — "이미지가 서서히 밝아지는 과정"
  3. **누적 (Integration)**: 이동하는 모든 순간의 기울기를 **합산**해 최종 기여도
  - 10차시 과제 문항 2: Saliency의 **기울기 포화** 문제를 해결하기 위해 ( **기준(Baseline)** ) 이미지에서 원본으로 변할 때의 기울기를 모두 ( **적분/누적** )
- **Baseline 선택 (강의)**: "무엇과 비교할 것인가?"가 설명의 시작
  - 이미지: **완전한 검정색(0)** 또는 노이즈 이미지 / 텍스트: 의미 없는 토큰(Embedding = 0)이나 패딩
  - Baseline은 **'정보가 없는 상태'** 여야 함 — 잘못되면 해석이 왜곡됨 (예: 검은 물체는 검정 baseline과 차이가 0 → 기여도 0)
- **완전성 (Completeness, 강의 "케이크 비유")**: `Σ(특성 기여도) = f(입력) − f(Baseline)` — 딸기(특성 A) + 밀가루(특성 B) 기여도를 모두 더하면 케이크 전체의 맛 점수
  - captum은 `return_convergence_delta=True`로 이 오차(delta)를 확인 → 0에 가까울수록 근사가 정확 (n_steps ↑)
- **Saliency vs IG (강의 비교)**: Saliency = **로컬 기울기**(현재 입력에서의 민감도, 빠름, 노이즈·포화) / IG = **누적 기울기**(경로 적분, **포화 해결**, 완전성 보장, 대신 **수십 번 반복 계산**·Baseline 설정 필요) → [[Saliency Map]]
- **적합 상황 (강의)**: **금융·의료 등 고신뢰 분야**, 규제 대응, 정밀 분석 / 이미지·**탭 데이터**의 특징 중요도 분석
- **captum**: `IntegratedGradients(model).attribute(x, baselines=torch.zeros_like(x), target=c, n_steps=50)` (10차시 과제 문항 4) → [[captum·pytorch_grad_cam]]

## 수식·원리
```
IG_i(x) = (x_i − x'_i) × ∫_0^1  ∂f(x' + α(x − x')) / ∂x_i  dα
리만 합 근사 (m = n_steps):
IG_i ≈ (x_i − x'_i) × (1/m) Σ_{k=1}^{m} ∂f(x' + (k/m)(x − x')) / ∂x_i
완전성:  Σ_i IG_i(x) = f(x) − f(x')
```

## 코드 예시
```python
import torch

def f(x):                                                   # 포화가 있는 모델: 입력 합이 커지면 출력이 1로 포화
    return torch.sigmoid(2 * x.sum(-1) - 2) + 0.1 * x[..., 2]

def integrated_gradients(f, x, baseline, n_steps=50):
    alphas = (torch.arange(1, n_steps + 1) / n_steps)[:, None]
    path = (baseline + alphas * (x - baseline)).requires_grad_(True)   # 경로 위 n_steps개 점
    f(path).sum().backward()
    return (x - baseline) * path.grad.mean(0)                # (x − x') × 평균 기울기

x = torch.tensor([3.0, 2.0, 1.0]); base = torch.zeros(3)     # 검정(0) baseline
xs = x.clone().requires_grad_(True); f(xs).backward()
print([round(g, 4) for g in xs.grad.tolist()])              # Saliency: 포화로 0.0 근처 (특징 0·1의 중요도를 놓침)

ig = integrated_gradients(f, x, base, n_steps=200)
print([round(v, 3) for v in ig.tolist()])                    # 특징 0 > 1 > 2 순으로 기여
delta = ig.sum() - (f(x) - f(base))
print(round(abs(delta.item()), 3) < 0.01)                    # True  완전성: Σ IG = f(x) − f(baseline)
print(round(integrated_gradients(f, x, x.clone()).abs().sum().item(), 3))   # 0.0  baseline = 입력이면 기여도 0
```

## 관련 개념
[[Saliency Map]] · [[XAI 기법 비교·도구]] · [[captum·pytorch_grad_cam]] · [[Grad-CAM]] · [[XAI 개요]]
