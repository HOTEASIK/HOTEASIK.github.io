---
title: Faster R-CNN
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, TwoStage, RPN, AI응용]
---
# Faster R-CNN

## 정의·핵심
- **정의**: Faster R-CNN (2015, Ren et al.). CPU 기반 **Selective Search를 학습 가능한 신경망인 RPN(Region Proposal Network)으로 대체** → 전체 검출 파이프라인이 **하나의 통합 네트워크**가 되어 **end-to-end 학습** 가능 (응용 11차시 "완전한 End-to-End")
- **구조**: Backbone(VGG16/ResNet+FPN) → 공유 feature map → **RPN**(후보 제안) → **RoI Pooling** → 분류·박스 회귀 (= Fast R-CNN head)
- **RPN (강의)**
  - feature map 위를 **3×3 conv로 sliding** → 위치마다 **k = 9개 앵커**(3 스케일 × 3 비율) → [[Anchor Box(Default Box)]]
  - 출력: 위치마다 **2k 점수**(객체/배경, 강의 "2: obj 1, 0") + **4k 좌표 오프셋**
  - 앵커 라벨: GT와 **IoU > 0.7 양성, < 0.3 음성** / 미니배치 256개(양성:음성 1:1)
  - 점수 상위 앵커를 디코딩 → **NMS(0.7)** → 상위 N개(학습 2000, 추론 **300**)를 RoI로 전달
  - 손실: `L = L_cls(물체 여부) + λ·L_reg(Smooth L1)`
- **학습 (강의 "Alternating training")**: ① RPN 학습 → ② RPN 후보로 Fast R-CNN 학습 → ③ 검출기 conv를 고정하고 RPN 미세조정 → ④ Fast R-CNN head 미세조정 (4단계 교대) / 지금은 **두 손실을 합쳐 한 번에(approximate joint)** 학습
- **성과**: 후보 생성이 GPU에서 **이미지당 ~10ms**, 전체 **약 5 FPS**(VGG16), 정확도 상승 (후보 품질 ↑)
- **과제 문항 1**: Faster R-CNN은 **GPU 상에서 동작하며 학습 가능한 RPN**으로 Selective Search 병목을 해결
- 후속: **FPN** 결합(다중 스케일), **Mask R-CNN**(마스크 브랜치), Cascade R-CNN
- torchvision: `fasterrcnn_resnet50_fpn`, `fasterrcnn_mobilenet_v3_large_fpn` → [[Faster R-CNN 파인튜닝]]

## 수식·원리
```
RPN: 위치당 k앵커 → cls (2k), reg (4k)
L({p_i}, {t_i}) = (1/N_cls) Σ L_cls(p_i, p_i*) + λ (1/N_reg) Σ p_i*·L_reg(t_i, t_i*)
전체 손실 = RPN(cls + reg) + RoI Head(cls + reg)
```

## 코드 예시
```python
import torch
from torchvision.models.detection import fasterrcnn_mobilenet_v3_large_fpn

torch.manual_seed(0)
model = fasterrcnn_mobilenet_v3_large_fpn(weights=None, weights_backbone=None, num_classes=3)
print(model.rpn.anchor_generator.num_anchors_per_location())     # [15, 15, 15]  이 모델은 5 크기 × 3 비율 (원 논문은 9)
print(model.rpn._pre_nms_top_n, model.rpn._post_nms_top_n, model.rpn.nms_thresh)
# {'training': 2000, 'testing': 1000} {'training': 2000, 'testing': 1000} 0.7

model.train()                                                      # 학습: 이미지 + 타깃 → 손실 딕셔너리
imgs = [torch.rand(3, 256, 256)]
tgts = [{"boxes": torch.tensor([[30., 40., 120., 160.]]), "labels": torch.tensor([1])}]
losses = model(imgs, tgts)
print(sorted(losses.keys()))   # ['loss_box_reg', 'loss_classifier', 'loss_objectness', 'loss_rpn_box_reg']
sum(losses.values()).backward()                                    # RPN + Head 손실을 합쳐 end-to-end

model.eval()
with torch.no_grad():
    out = model(imgs)
print(sorted(out[0].keys()))                                       # ['boxes', 'labels', 'scores']
```

## 관련 개념
[[Fast R-CNN]] · [[Anchor Box(Default Box)]] · [[Faster R-CNN 파인튜닝]] · [[FPN·PANet]] · [[NMS(Non-Maximum Suppression)]]
