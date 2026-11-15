---
title: VLA(Vision-Language-Action)
date: 2026-11-05 12:00:00 +0900
categories: [AI, 강화학습·VLA]
tags: [VLA, VLM, 로봇, 피지컬AI, AI응용]
---
# VLA(Vision-Language-Action)

## 정의·핵심
- **정의**: Vision-Language-Action 모델 — **카메라 영상 + 언어 지시**를 입력받아 **로봇의 행동(Action)** 을 직접 출력하는 모델. VLM이 "보고 말하는" AI라면, VLA는 **"보고·이해하고·움직이는"** AI → [[VLM 구조]]
  - 보충 강의(멀티에이전트·피지컬 AI): "**로봇이 보고·생각하고 행동**" — 피지컬 AI의 두뇌 → [[피지컬 AI 개요]]
  - ※ 응용 16차시는 VLM까지 다루며, VLA는 VLM 구조 + 로봇응용 2주차(정책 출력)를 잇는 보충 정리
- **구조 (일반적인 형태)**
  1. **Vision Encoder**: 로봇 카메라 이미지 → 이미지 토큰 (VLM과 동일)
  2. **Language Model 백본**: 지시문("빨간 컵을 집어 상자에 넣어") + 이미지 토큰 → 상황 이해 (사전학습된 VLM의 상식 활용)
  3. **Action Head / Action Token**: 행동을 출력 — (a) 연속 값을 **구간(bin)으로 이산화해 토큰처럼 생성**(RT-2, OpenVLA: 차원당 256 bin), (b) **Diffusion/Flow 헤드**로 연속 행동 묶음(action chunk) 생성(π0 등)
- **행동 공간 (로봇응용 2주차)**: 정책 모델 출력은 **관절공간**(각 관절 각도) 또는 **작업공간**(손끝 위치·자세 Δx, Δy, Δz, 회전, 그리퍼)
  - **작업공간 출력**이면 로봇별 **역기구학(IK)** 으로 각자 관절 명령으로 변환 → **하나의 정책을 여러 로봇에** 적용 가능 → [[로봇팔 자유도(DOF)·Null space]]
- **학습 방법**: 사람 시연 데이터로 **모방 학습(Behavior Cloning)** 이 주류 (Open X-Embodiment 등 대규모 로봇 데이터) + 시뮬레이션·**강화학습(PPO)** 으로 미세 조정 → [[PPO]]
- **강화학습과의 연결**: VLA = 이미지·언어를 상태로 받는 **거대한 Policy Network** π(a | 이미지, 지시) → [[Policy Network]]
- **과제**: 실시간성(제어 주기 수~수십 Hz), 안전(현실의 실수 = 사고 → 하네스·검증), 데이터 수집 비용

## 수식·원리
```
a_t = π_θ( 이미지 o_t, 지시 l )          a_t = [Δx, Δy, Δz, Δroll, Δpitch, Δyaw, gripper]
이산화:  bin = round( (a − a_min) / (a_max − a_min) × (K − 1) ),   K = 256
모방 학습:  L = − Σ log π_θ(a*_t | o_t, l)      (a* = 사람 시연 행동)
작업공간 → 관절:  q = IK_robot(x_target)
```

## 코드 예시
```python
import torch
import torch.nn as nn

K, A_DIM = 256, 7                                          # 행동 7차원 (위치3·회전3·그리퍼), 차원당 256 bin
a_min, a_max = -1.0, 1.0
def to_bins(a): return torch.round((a - a_min) / (a_max - a_min) * (K - 1)).long()
def from_bins(b): return b.float() / (K - 1) * (a_max - a_min) + a_min

a = torch.tensor([0.10, -0.25, 0.0, 0.0, 0.05, -0.5, 1.0])
bins = to_bins(a)
print(bins.tolist(), round((from_bins(bins) - a).abs().max().item(), 4) <= 1 / (K - 1))   # 행동 → 토큰, 오차 ≤ 1 bin

class TinyVLA(nn.Module):                                  # 이미지 토큰 + 지시 토큰 → 행동 토큰 (개념 모델)
    def __init__(self, d=64, vocab=100):
        super().__init__()
        self.img_proj = nn.Linear(48, d)                   # 이미지 패치 특징 → d
        self.txt_emb = nn.Embedding(vocab, d)
        self.backbone = nn.TransformerEncoder(nn.TransformerEncoderLayer(d, 4, 128, batch_first=True), 2)
        self.action_head = nn.Linear(d, A_DIM * K)         # 차원마다 256-way 분류
    def forward(self, img_patches, instr_ids):
        x = torch.cat([self.img_proj(img_patches), self.txt_emb(instr_ids)], dim=1)
        h = self.backbone(x)[:, -1]                        # 마지막 토큰 요약
        return self.action_head(h).view(-1, A_DIM, K)

torch.manual_seed(0)
model = TinyVLA()
img, instr = torch.randn(8, 16, 48), torch.randint(0, 100, (8, 6))   # 배치 8, 패치 16개, 지시 6토큰
target = to_bins(torch.rand(8, A_DIM) * 2 - 1)            # 시연 행동 (가짜)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
for step in range(100):                                    # 모방 학습: 시연 행동 토큰의 CE
    loss = nn.functional.cross_entropy(model(img, instr).reshape(-1, K), target.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()
pred = model(img, instr).argmax(-1)
print(tuple(pred.shape), round(loss.item(), 2) < 5.55, (pred == target).float().mean().item() > 0.5)   # (8, 7) True True
```

## 관련 개념
[[VLM 구조]] · [[피지컬 AI 개요]] · [[로봇팔 자유도(DOF)·Null space]] · [[Policy Network]] · [[PPO]] · [[멀티에이전트]]
