---
title: torchvision.datasets
date: 2026-11-05 12:00:00 +0900
categories: [AI, 파이썬 라이브러리]
tags: [파이썬라이브러리, torchvision, AI개론]
---
# torchvision.datasets

## 정의·핵심
- **정의**: 유명한 공개 이미지 데이터셋을 **내려받아 Dataset으로** 바로 쓰게 해 주는 모듈. 한 줄로 데이터 준비가 끝난다.
- **공통 인자**
  - `root`: 저장 폴더 / `train=True`(학습용)·`False`(테스트용) / `download=True`(없으면 내려받기) / `transform=`(전처리)
  - SVHN만 `train=` 대신 `split='train'|'test'`
- **강의에서 쓴 데이터셋**

| 데이터셋 | 크기 | 이미지 | 클래스 | 차시 |
|---|---|---|---|---|
| MNIST | 학습 6만 / 테스트 1만 | 흑백 28×28 | 숫자 0~9 | 10 |
| FashionMNIST | 6만 / 1만 | 흑백 28×28 | 옷 종류 10 | 10 |
| CIFAR10 | 5만 / 1만 | 컬러 32×32 | 비행기·자동차·새… 10 | 11·12 |
| SVHN | 약 7.3만 / 2.6만 | 컬러 32×32 | 집 번호 숫자 10 | 16 |

- **돌려주는 형태**: transform이 없으면 `(PIL 이미지, 정수 라벨)`. 그래서 보통 `ToTensor()`를 넣는다.
- **클래스 이름**: `ds.classes` (예: CIFAR10 `['airplane', 'automobile', ...]`), 라벨 배열 `ds.targets`
- **그 밖에**: sklearn의 `load_iris()`(표 데이터, 8·9차시)는 sklearn 쪽 → [[scikit-learn]]. 내 이미지 폴더는 [[ImageFolder]]
- 실습에서 Colab 재실행마다 다시 받지 않게 `root`를 고정 경로로 둔다.

## 수식·원리
```
datasets.MNIST(root, train=True, download=True, transform=...)
    → Dataset (len 60000)  → ds[i] = (tensor[1,28,28], label)
    → DataLoader로 배치
```
```
# 실제 다운로드 코드 (인터넷 필요)
train_set = datasets.MNIST(root="./data", train=True, download=True, transform=transforms.ToTensor())
test_set  = datasets.MNIST(root="./data", train=False, download=True, transform=transforms.ToTensor())
svhn      = datasets.SVHN(root="./data", split="train", download=True)
```

## 코드 예시
```python
import torch
from torchvision import datasets, transforms

# 다운로드 없이 같은 형태를 흉내 내는 FakeData (MNIST 모양)
fake = datasets.FakeData(size=100, image_size=(1, 28, 28), num_classes=10,
                         transform=transforms.ToTensor())
img, label = fake[0]
print(len(fake), img.shape, type(label))    # 100 torch.Size([1, 28, 28]) <class 'int'>

loader = torch.utils.data.DataLoader(fake, batch_size=25)
x, y = next(iter(loader))
print(x.shape, y.shape)                     # torch.Size([25, 1, 28, 28]) torch.Size([25])
```

## 관련 개념
[[Dataset]] · [[transforms]] · [[DataLoader]] · [[ImageFolder]]
