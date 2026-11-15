---
title: WandB 실험 기록·Sweeps
date: 2026-11-05 12:00:00 +0900
categories: [AI, 실험관리·학습효율]
tags: [WandB, 실험관리, Sweeps, 실습, 보충]
---
# WandB 실험 기록·Sweeps

## 정의·핵심
- **실습 순서 (보충 2_2 W&B 실습)**: ① 설치·로그인 → ② 데이터 준비(MNIST) → ③ **config 정의 + `wandb.init`** → ④ 학습 루프에서 **`wandb.log`** → ⑤ **`wandb.watch`**(모델 내부 감시) → ⑥ 예측 이미지·**혼동행렬** 기록(media) → ⑦ **`wandb.finish`** + 대시보드 확인
  - 도구 자체(Project·Run·config 용어, 로그인)는 → [[WandB]]
  - **API 키는 코드에 쓰지 않음** — `wandb.login()` 입력창 또는 환경변수 `WANDB_API_KEY`
- **기록 포인트 (2_2)**
  - `config` = 하이퍼파라미터를 한곳에 모은 딕셔너리 (lr, batch_size, hidden, epochs, optimizer) → `wandb.init(project='mnist-wandb', name='mlp-baseline', config=config)` → `cfg = wandb.config`
  - 학습 루프에 **딱 한 줄** `wandb.log({'epoch':…, 'train_loss':…, 'val_acc':…})` — 호출마다 step이 쌓여 차트의 x축
  - `wandb.watch(model, log='all', log_freq=100)` — 가중치·그래디언트 분포 (손실이 안 줄 때 진단)
  - `wandb.Image`(예측/정답 캡션), `wandb.plot.confusion_matrix` → 미디어 패널 (정확도가 같아도 **무엇을 틀리는지** 비교)
  - **시스템 메트릭** 자동 수집(GPU 사용률·메모리·온도) → GPU 사용률이 30%면 **데이터 병목** → [[DataLoader 속도]]
- **Sweeps — 하이퍼파라미터 자동 탐색 (보충 02 실습 2)**
  - 탐색 공간·방법을 선언하면 W&B가 여러 Run을 **자동 실행·기록·시각화**
  - **3단계**: ① 탐색 공간을 dict/YAML로 선언 → ② `wandb.sweep(sweep_config, project=...)` → sweep_id → ③ `wandb.agent(sweep_id, function=train, count=20)`
  - `train()` 안에서 `wandb.init()` → sweep이 config를 주입 → `cfg.lr` 등 사용
  - **병렬**: 여러 머신에서 같은 sweep_id로 agent를 띄우면 병렬 탐색
- **sweep_config 구성 (강의)**
  - `method`: **grid | random | bayes** → [[Grid Search]], [[Random Search]], [[Bayesian Optimization]]
  - `metric`: `{'name': 'val_acc', 'goal': 'maximize'}`
  - `parameters`: 연속은 `min/max` (+ lr은 `distribution: log_uniform_values`), 이산은 `values: [...]`
  - `early_terminate`: `{'type': 'hyperband', 'min_iter': 3}` → 가망 없는 Run 중단 → [[Hyperband·BOHB]]
  - 추천: 넓게 볼 땐 **random**으로 시작, 유망 구간이 보이면 **bayes**로 좁혀 마무리 ('넓게→좁게'의 자동화)
- **대시보드 (강의)**: 최적화 곡선(best 상승), **병렬좌표**(어떤 조합이 좋은지), **파라미터 중요도**, 최적 config / **Artifacts**: 데이터셋·모델 버전 관리 ("이 모델이 어떤 데이터로 학습됐지?")
- 이 환경엔 wandb **미설치** → 사용 코드는 미실행, 아래 실행 예시는 sweep_config를 해석해 random/grid로 Run을 생성·기록하는 흐름을 재현

## 수식·원리
```
sweep = (method, metric, parameters, early_terminate)
agent:  for i in range(count):  config_i ~ method(parameters, history)
                                 score_i = train(config_i)  →  history에 기록
best = argmax_i score_i  (goal = maximize)
```

## 코드 예시
W&B 코드 (wandb 미설치·로그인 필요 — 이 환경 미실행):
```
import wandb
sweep_config = {
    "method": "bayes",
    "metric": {"name": "val_acc", "goal": "maximize"},
    "parameters": {
        "lr": {"min": 1e-4, "max": 1e-2, "distribution": "log_uniform_values"},
        "batch_size": {"values": [32, 64, 128, 256]},
        "dropout": {"min": 0.0, "max": 0.5},
        "hidden": {"values": [64, 128, 256]},
    },
    "early_terminate": {"type": "hyperband", "min_iter": 3},
}
def train():
    wandb.init()
    cfg = wandb.config
    model = build(cfg.hidden, cfg.dropout).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=cfg.lr)
    for epoch in range(5):
        train_one_epoch(model, opt, DataLoader(train_ds, batch_size=cfg.batch_size, shuffle=True))
        wandb.log({"val_acc": evaluate(model, val_loader), "epoch": epoch})
sweep_id = wandb.sweep(sweep_config, project="mnist-sweep")
wandb.agent(sweep_id, function=train, count=20)
```

실행 가능한 흐름 재현 (sweep_config 해석 → Run 생성 → 로그 → best):
```python
import itertools
import json
import math
import random

sweep_config = {"method": "random", "metric": {"name": "val_acc", "goal": "maximize"},
                "parameters": {"lr": {"min": 1e-4, "max": 1e-2, "distribution": "log_uniform_values"},
                               "batch_size": {"values": [32, 64, 128]}, "dropout": {"min": 0.0, "max": 0.5}}}

def sample(params, rng):
    cfg = {}
    for k, spec in params.items():
        if "values" in spec: cfg[k] = rng.choice(spec["values"])
        elif spec.get("distribution") == "log_uniform_values":
            cfg[k] = math.exp(rng.uniform(math.log(spec["min"]), math.log(spec["max"])))
        else: cfg[k] = rng.uniform(spec["min"], spec["max"])
    return cfg

def train(cfg):                                           # 가짜 학습: 에폭마다 log 기록
    history = []
    for epoch in range(5):
        acc = 0.97 - 0.01 * (math.log10(cfg["lr"]) + 2.5) ** 2 - 0.02 * abs(cfg["dropout"] - 0.2) - 0.03 * 0.6 ** epoch
        history.append({"epoch": epoch, "val_acc": round(acc, 4)})   # ≈ wandb.log
    return history

rng = random.Random(0)
runs = []
for i in range(10):                                       # ≈ wandb.agent(count=10)
    cfg = sample(sweep_config["parameters"], rng)
    runs.append({"name": f"run-{i}", "config": cfg, "history": train(cfg)})
best = max(runs, key=lambda r: r["history"][-1]["val_acc"])
print(len(runs), len(best["history"]), sorted(best["config"]))   # 10 5 ['batch_size', 'dropout', 'lr']
print(all(1e-4 <= r["config"]["lr"] <= 1e-2 for r in runs))      # True  log_uniform 범위 안에서 샘플
grid_n = len(list(itertools.product([32, 64, 128], [1e-4, 1e-3, 1e-2])))
print(grid_n, json.dumps(best["config"], default=float)[:1])     # 9 {  method: grid면 조합 수만큼 Run
```

## 관련 개념
[[WandB]] · [[Grid Search]] · [[Random Search]] · [[Bayesian Optimization]] · [[Hyperband·BOHB]] · [[재현성]]
