---
title: DataLoader 속도
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [DataLoader, 학습효율, 병목, 보충]
---
# DataLoader 속도

## 정의·핵심
- **훈련이 느린 3가지 이유 (보충 02)**
  - **계산 병목 (Compute-bound)**: GPU 사용률 높음(90%+) → AMP, 더 큰 배치, 경량 모델 → [[AMP(혼합 정밀도)]]
  - **데이터 병목 (Data-bound)**: GPU가 다음 배치를 **기다림** (CPU 전처리·디스크가 못 따라감), **GPU 사용률 낮음(30%대)** → `num_workers`↑, `pin_memory`, 캐싱·경량 전처리
  - **메모리 병목 (Memory-bound)**: CUDA out of memory → 배치↓, AMP, Gradient Accumulation → [[GPU 메모리 부족(OOM) 대응]]
  - 진단 순서: GPU 사용률 < 50% → 데이터 병목 / OOM → 메모리 병목 / 둘 다 아님 → 계산 병목
  - 확인: `!nvidia-smi` (GPU-Util, Memory-Usage) 또는 W&B 시스템 탭 → [[WandB 실험 기록·Sweeps]]
- **훈련 한 스텝의 여정 (강의)**: ① 데이터 로드(CPU, 데이터 병목) → ② GPU로 전송(`.to(device)`, 전송 병목) → ③ 순전파 → ④ 역전파·갱신(계산 병목)
- **DataLoader 최적화 (보충 2_6 STEP 2)** → [[DataLoader]]
  - **`num_workers`**: 데이터를 **여러 프로세스로 미리 준비** — 여러 값을 재 보고 가장 빠른 값 선택. Colab 무료 vCPU 2개 → 보통 **2가 적정**. 너무 크면 컨텍스트 전환·오버헤드로 **오히려 느려짐** (강의 연습 Q3)
  - **`pin_memory=True`**: CPU 메모리를 '고정(pinned)'해 **GPU 전송을 빠르게** — **GPU를 쓸 때만** 의미 (2_6 연습 문제 2), `pin_memory=IS_CUDA`
  - **`non_blocking=True`**: pinned 메모리와 함께 CPU→GPU 전송을 **비동기**로 겹쳐 대기 시간 감소
  - **`persistent_workers=True`**: 에폭마다 worker를 다시 만들지 않음 / `prefetch_factor`: worker당 미리 준비할 배치 수
- **측정 (2_6 STEP 0·1)**: **처리량(img/sec)** 과 GPU 메모리를 재는 측정기 / GPU 시간 측정 전 **`torch.cuda.synchronize()`** — GPU 연산은 비동기라, 기다리지 않으면 실제보다 빠르게 측정됨 (연습 문제 1)
- **검증 DataLoader**: `shuffle=False`, 배치를 학습보다 크게 해도 됨 — 순서 무관, 역전파(그래디언트 저장) 없어 메모리 여유 (강의 연습 Q4)
- **Windows 주의**: `num_workers > 0`이면 스크립트를 `if __name__ == "__main__":` 안에서 실행해야 함 (spawn 방식)

## 수식·원리
```
스텝 시간 ≈ max(데이터 준비 시간 / num_workers, GPU 계산 시간)   (프리페치가 겹쳐질 때)
처리량 = 배치 크기 × 스텝 수 / 경과 시간   (img/sec)
GPU 사용률 ≈ 계산 시간 / (계산 시간 + 대기 시간)
```

## 코드 예시
```python
import time
import torch
from torch.utils.data import DataLoader, Dataset

class SlowDataset(Dataset):                               # 전처리가 무거운 데이터셋 (CPU 병목 흉내)
    def __len__(self): return 256
    def __getitem__(self, i):
        x = torch.randn(3, 32, 32)
        for _ in range(30): x = torch.tanh(x * 1.01)      # 무거운 transform
        return x, i % 10

def throughput(loader, compute_s=0.0):
    t0, n = time.perf_counter(), 0
    for xb, _ in loader:
        if compute_s: time.sleep(compute_s)               # GPU 계산 시간 흉내
        n += len(xb)
    return n / (time.perf_counter() - t0)

ds = SlowDataset()
loader = DataLoader(ds, batch_size=32, num_workers=0, pin_memory=torch.cuda.is_available())
tp = throughput(loader)
print(len(loader), tp > 0)                                # 8 True  배치 수, 처리량(img/sec) 측정

xb, yb = next(iter(DataLoader(ds, batch_size=32, pin_memory=torch.cuda.is_available())))
print(xb.is_pinned() == torch.cuda.is_available())        # True  GPU가 있을 때만 pinned 메모리
if torch.cuda.is_available():
    t0 = time.perf_counter(); y = xb.cuda(non_blocking=True) @ torch.ones(32, 32, device="cuda")
    torch.cuda.synchronize()                              # 비동기 → 기다린 뒤에 시간 측정
    print(time.perf_counter() - t0 > 0)                   # True
```

## 관련 개념
[[DataLoader]] · [[AMP(혼합 정밀도)]] · [[GPU 메모리 부족(OOM) 대응]] · [[torch.compile]] · [[GPU·CUDA]]
