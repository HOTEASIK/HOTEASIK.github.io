---
title: Jupyter Notebook
date: 2026-11-05 12:00:00 +0900
categories: [AI, 툴·환경]
tags: [툴환경, Jupyter, AI개론]
---
# Jupyter Notebook

## 정의·핵심
- **정의**: 코드·실행 결과·설명 글을 **셀 단위**로 한 파일(`.ipynb`)에 담는 대화형 실행 환경. 강의 실습 파일이 모두 이 형식이다. Colab, VSCode, JupyterLab에서 열 수 있다.
- **셀 종류**
  - 코드 셀: 실행하면 바로 아래에 결과(출력·그래프)가 붙는다. 실행 `Shift+Enter`
  - 마크다운 셀: 설명·수식(`$...$`)·이미지
- **커널(Kernel)**: 코드를 실제로 실행하는 파이썬 프로세스. **셀을 실행한 순서대로 변수가 메모리에 남는다.**
  - 위에서 아래가 아니라 **실행 순서**가 중요 → 셀 왼쪽 `[3]` 번호로 확인
  - 꼬였을 때: `커널 재시작` 후 `모두 실행` — 재현성 확인 방법
  - 파일을 다시 열어도 변수는 없다 (출력만 저장됨)
- **매직 명령**
  - `%` 라인 매직: `%time`(한 줄 시간), `%timeit`(여러 번 반복 평균), `%matplotlib inline`, `%pwd`
  - `%%` 셀 매직: `%%time`(셀 전체 시간), `%%writefile a.py`(셀 내용을 파일로 저장)
  - `!` 셸 명령: `!pip install ...`, `!ls`, `!nvidia-smi`
- **편리한 점**: 데이터를 한 번 읽어 두고 모델 부분만 여러 번 고쳐 실행 / 마지막 줄 값이 자동 출력 / `함수?`로 도움말
- **약점**: 실행 순서가 꼬이면 결과를 재현하기 어렵다. 긴 학습은 `.py` 스크립트가 낫다.

## 수식·원리
```
셀 [1] import torch      ─┐
셀 [2] x = torch.ones(3) ─┼─ 같은 커널(프로세스) 메모리 공유
셀 [3] print(x * 2)      ─┘   → 커널 재시작 시 모두 사라짐
```

## 코드 예시
```
%timeit sum(range(1000))        # 10.2 µs ± ... per loop
%%time
total = sum(range(10**7))       # CPU times: ... Wall time: ...
!pip list | grep torch
```
```python
import timeit
t = timeit.timeit("sum(range(1000))", number=1000)   # %timeit이 내부에서 하는 일
print(t > 0)                                          # True
```

## 관련 개념
[[Google Colab]] · [[VSCode]] · [[Conda 가상환경]] · [[ipywidgets]]
