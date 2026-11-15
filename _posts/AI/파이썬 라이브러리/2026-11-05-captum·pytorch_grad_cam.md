---
title: captum·pytorch_grad_cam
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, XAI, AI응용]
---
# captum·pytorch_grad_cam

## 정의·핵심
- **공통 목적**: 모델이 **이미지의 어디를 보고 판단했는지** 시각화하는 XAI(설명 가능한 AI) 도구. (응용 10차시, 13차시 의료영상) 개념은 [[12_XAI]] 폴더
- **captum** — PyTorch 공식 해석 라이브러리 (`pip install captum`)
  - `Saliency(model)`: 입력 픽셀에 대한 기울기 크기 → [[Saliency Map]]
  - `IntegratedGradients(model)`: 기준 이미지(검은 화면)에서 입력까지 기울기를 적분 → [[Integrated Gradients]]
  - 공통 사용법: `attr = method.attribute(input, target=클래스)` → 입력과 같은 모양의 중요도
  - `captum.attr.visualization.visualize_image_attr(attr, img, method='heat_map')`로 그리기
  - 입력 텐서에 `requires_grad_()`가 필요하고 모델은 `eval()` 상태여야 한다
- **pytorch_grad_cam** — CAM 계열 전용 (`pip install grad-cam`)
  - `GradCAM(model, target_layers=[model.layer4[-1]])`: 마지막 합성곱 층의 특징맵과 기울기로 히트맵 → [[Grad-CAM]]
  - `GradCAMPlusPlus`, `ScoreCAM`(기울기 없이 점수로) → [[Score-CAM]]
  - `ClassifierOutputTarget(클래스 번호)`: 어떤 클래스에 대한 근거를 볼지
  - `show_cam_on_image(rgb_0to1, grayscale_cam, use_rgb=True)`: 원본 위에 겹쳐 그리기
  - **target_layers 고르기가 핵심**: ResNet은 `layer4[-1]`, VGG는 `features[-1]` 근처 마지막 conv

## 수식·원리
```
captum:   attr = IntegratedGradients(model).attribute(x, target=c)     → (1,3,H,W)
grad_cam: cam = GradCAM(model, [layer])(x, targets=[ClassifierOutputTarget(c)]) → (1,H,W) 0~1
```

## 코드 예시
```python
import numpy as np
import torch
from torchvision import models
from captum.attr import IntegratedGradients, Saliency
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

model = models.resnet18(weights=None).eval()
x = torch.rand(1, 3, 224, 224, requires_grad=True)

ig = IntegratedGradients(model).attribute(x, target=0, n_steps=20)
sal = Saliency(model).attribute(x, target=0)
print(ig.shape, sal.shape)                     # torch.Size([1, 3, 224, 224]) 두 번

cam = GradCAM(model=model, target_layers=[model.layer4[-1]])
g = cam(input_tensor=x, targets=[ClassifierOutputTarget(0)])
print(g.shape, g.min() >= 0, g.max() <= 1)     # (1, 224, 224) True True
vis = show_cam_on_image(np.random.rand(224, 224, 3).astype(np.float32), g[0], use_rgb=True)
print(vis.shape)                               # (224, 224, 3)
```

## 관련 개념
[[XAI 개요]] · [[Grad-CAM]] · [[Saliency Map]] · [[Integrated Gradients]] · [[의료영상에서 Grad-CAM 활용]]
