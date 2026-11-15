---
title: Forward Hook
date: 2026-11-05 12:00:00 +0900
categories: [AI, CNN·비전]
tags: [CNN비전, PyTorch, 시각화, AI응용]
---
# Forward Hook

## 정의·핵심
- **정의**: 모듈의 **순전파가 끝날 때마다 자동으로 호출되는 함수**를 등록하는 기능. 모델 코드를 고치지 않고 **중간 층의 출력(특징 맵)을 꺼내** 볼 수 있다
  - `handle = layer.register_forward_hook(fn)`, `fn(module, input, output)`
  - `input`은 **튜플**, `output`은 텐서
  - 다 쓰면 `handle.remove()` (안 지우면 계속 호출되고 메모리 누수)
- **용도**
  - **중간 Feature Map 시각화**: conv1의 64개 채널을 이미지로 그려 모델이 무엇에 반응하는지 확인 → [[Feature Map]]
  - 특징 벡터 추출(GAP 출력)로 검색·t-SNE
  - **Grad-CAM**: forward hook으로 특징 맵 + backward hook(`register_full_backward_hook`)으로 기울기 저장 → [[Grad-CAM]]
  - 디버깅: 층별 출력 shape·평균·NaN 확인
- **관련 훅**
  - `register_forward_pre_hook(fn(module, input))`: 순전파 **전에** 입력을 보거나 바꿈
  - `register_full_backward_hook(fn(module, grad_input, grad_output))`: 역전파 때 기울기
  - 텐서 훅 `tensor.register_hook` → [[Autograd Hook]]
- **대안**: `torchvision.models.feature_extraction.create_feature_extractor(model, return_nodes={...})` — 여러 중간 출력을 딕셔너리로
- 저장할 때 `output.detach()`로 그래프에서 떼어 내야 메모리가 쌓이지 않는다
- 훅에서 값을 **반환하면 출력이 그 값으로 바뀐다** (보통은 반환하지 않음)

## 수식·원리
```
y = module(x)  →  hook(module, (x,), y) 호출  →  (반환값이 있으면 y 대체)
```

## 코드 예시
```python
import torch
from torchvision import models

net = models.resnet18(weights=None).eval()
features = {}
def save(name):
    def hook(module, inp, out):
        features[name] = out.detach()
    return hook

handles = [net.conv1.register_forward_hook(save("conv1")),
           net.layer4.register_forward_hook(save("layer4")),
           net.avgpool.register_forward_hook(save("gap"))]
with torch.no_grad():
    net(torch.randn(1, 3, 224, 224))
for k, v in features.items():
    print(k, tuple(v.shape))
# conv1 (1, 64, 112, 112)
# layer4 (1, 512, 7, 7)
# gap (1, 512, 1, 1)
for h in handles:
    h.remove()
features.clear(); net(torch.randn(1, 3, 224, 224))
print(len(features))                                      # 0  제거 후 더 이상 호출 안 됨
# 시각화: plt.imshow(features["conv1"][0, i]) 로 채널 i의 특징 맵
```

## 관련 개념
[[Feature Map]] · [[Autograd Hook]] · [[Grad-CAM]] · [[nn.Module]] · [[torch.no_grad]]
