---
title: ImageFolder
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, torchvision, AI개론]
---
# ImageFolder

## 정의·핵심
- **정의**: **폴더 이름을 클래스로** 보고 이미지를 읽어 주는 Dataset. `torchvision.datasets.ImageFolder(root, transform=)`
- **내 데이터(Custom Dataset)로 분류할 때 가장 쉬운 방법** (15차시 ants·bees 분류)
- **폴더 구조가 규칙이다**
```
data/
├─ train/
│  ├─ ants/  img1.jpg ...
│  └─ bees/  ...
└─ val/
   ├─ ants/
   └─ bees/
```
- 클래스 번호는 **폴더 이름의 알파벳 순서**로 붙는다 → `ds.classes = ['ants', 'bees']`, `ds.class_to_idx = {'ants': 0, 'bees': 1}`
- train·val을 폴더로 미리 나누고 각각 ImageFolder를 만든다. 훈련용에는 증강 transform, 검증용에는 기본 transform을 준다.
- 사진 크기가 제각각이므로 transform에 `Resize`·`CenterCrop`(예: 224)을 꼭 넣어야 배치로 묶인다.
- `ds.samples`: `(파일 경로, 클래스 번호)` 목록 — 잘못 예측한 이미지 파일을 찾을 때 쓴다.
- 구조가 다르거나(CSV 라벨 등) 정답이 분류가 아니면(검출 박스) 직접 Custom Dataset을 만든다. → [[Dataset]]

## 수식·원리
```
ImageFolder("data/train") → ds[i] = (transform(PIL 이미지), 폴더 순번)
```

## 코드 예시
```python
import os, tempfile
import numpy as np
from PIL import Image
from torchvision import datasets, transforms

root = os.path.join(tempfile.mkdtemp(), "train")
for cls in ["bees", "ants"]:
    os.makedirs(os.path.join(root, cls))
    for i in range(3):
        Image.fromarray(np.uint8(np.random.rand(40 + i, 50, 3) * 255)).save(
            os.path.join(root, cls, f"{i}.jpg"))

ds = datasets.ImageFolder(root, transform=transforms.Compose([
    transforms.Resize((224, 224)), transforms.ToTensor()]))
print(ds.classes, ds.class_to_idx)    # ['ants', 'bees'] {'ants': 0, 'bees': 1}
x, y = ds[4]
print(len(ds), x.shape, y)            # 6 torch.Size([3, 224, 224]) 1
```

## 관련 개념
[[Dataset]] · [[Custom Dataset 분류]] · [[transforms]] · [[전이학습(Transfer Learning)]]
