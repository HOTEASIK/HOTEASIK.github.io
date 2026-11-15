---
title: Faster R-CNN 파인튜닝
date: 2026-11-05 12:00:00 +0900
categories: [AI, 객체검출]
tags: [객체검출, TwoStage, 전이학습, PyTorch, AI응용]
---
# Faster R-CNN 파인튜닝

## 정의·핵심
- **정의**: COCO로 사전학습된 torchvision `fasterrcnn_resnet50_fpn`을 불러와 **Box Predictor(분류기·회귀기)만 내 클래스 수에 맞게 교체**한 뒤 커스텀 데이터로 학습 (응용 11차시 실습 "Faster_R_CNN_Fine_tuning_실무", 과제 5·6)
- **Head 교체 (과제 문항 6)**
  ```
  model = fasterrcnn_resnet50_fpn(weights="DEFAULT")
  in_features = model.roi_heads.box_predictor.cls_score.in_features   # 1024
  model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
  ```
  - **num_classes = 실제 클래스 수 + 1 (배경)** — 배경이 0번
  - `FastRCNNPredictor`: `cls_score`(num_classes) + `bbox_pred`(num_classes × 4)
- **Custom Dataset (과제 문항 5)**
  - `__getitem__`은 `(image_tensor, target)` 반환, `target = {"boxes": FloatTensor[N, 4], "labels": Int64Tensor[N]}`
  - **박스는 xyxy 픽셀 좌표** — COCO의 `[x, y, w, h]`는 `x2 = x + w`, `y2 = y + h`로 변환 → [[Bounding Box]]
  - 이미지는 **0~1 float (C, H, W)**, 정규화·리사이즈는 모델 내부 `GeneralizedRCNNTransform`이 수행
  - 이미지마다 박스 수가 다르므로 **`collate_fn = lambda b: tuple(zip(*b))`** 로 리스트 배치
- **학습 루프**
  - `model.train()` → `loss_dict = model(images, targets)` → `sum(loss_dict.values()).backward()`
  - 손실 4개: `loss_classifier`, `loss_box_reg`(RoI head), `loss_objectness`, `loss_rpn_box_reg`(RPN)
  - 옵티마이저: SGD(lr 0.005, momentum 0.9, weight_decay 5e-4) + StepLR이 흔한 설정
  - `trainable_backbone_layers`(0~5)로 백본 동결 정도 조절 → [[레이어 동결]]
- **추론**: `model.eval()` → `model(images)` → `[{"boxes", "labels", "scores"}]` → score threshold로 필터
- **평가**: COCO mAP (`pycocotools` / torchmetrics `MeanAveragePrecision`) → [[AP·mAP]]

## 수식·원리
```
num_classes = K + 1 (배경)
cls_score:  Linear(1024, K+1)
bbox_pred:  Linear(1024, (K+1)·4)
총 손실 = loss_classifier + loss_box_reg + loss_objectness + loss_rpn_box_reg
```

## 코드 예시
```python
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

class CocoLikeDS(Dataset):
    def __init__(self):
        self.items = [([[20, 30, 60, 80]], [1]), ([[10, 10, 40, 40], [80, 60, 50, 50]], [1, 2])]   # COCO xywh
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        b, l = self.items[i]
        b = torch.tensor(b, dtype=torch.float32)
        b[:, 2:] += b[:, :2]                                     # xywh → xyxy (과제 5)
        return torch.rand(3, 160, 160), {"boxes": b, "labels": torch.tensor(l, dtype=torch.int64)}

num_classes = 2 + 1                                              # 클래스 2 + 배경
model = fasterrcnn_resnet50_fpn(weights=None, weights_backbone=None, min_size=160, max_size=160)   # 실사용: weights="DEFAULT"
in_f = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = FastRCNNPredictor(in_f, num_classes)   # Head 교체 (과제 6)
print(in_f, model.roi_heads.box_predictor.cls_score.out_features, model.roi_heads.box_predictor.bbox_pred.out_features)   # 1024 3 12

dl = DataLoader(CocoLikeDS(), batch_size=2, collate_fn=lambda b: tuple(zip(*b)))
opt = torch.optim.SGD([p for p in model.parameters() if p.requires_grad], lr=0.005, momentum=0.9, weight_decay=5e-4)
model.train()
for imgs, tgts in dl:
    loss_dict = model(list(imgs), list(tgts))
    loss = sum(loss_dict.values())
    opt.zero_grad(); loss.backward(); opt.step()
print(tgts[1]["boxes"].tolist(), len(loss_dict))                # [[10.0, 10.0, 50.0, 50.0], [80.0, 60.0, 130.0, 110.0]] 4
```

## 관련 개념
[[Faster R-CNN]] · [[출력층 교체]] · [[전이학습(Transfer Learning)]] · [[Bounding Box]] · [[라벨 형식]]
