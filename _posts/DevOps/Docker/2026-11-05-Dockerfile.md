---
title: "Dockerfile"
date: 2026-11-05 12:00:00 +0900
categories: [DevOps, Docker]
tags: []
---
# 정의
도커 이미지 생성(빌드) 과정을 정의하는 텍스트 파일 
어떤 기반 이미지(예: Ubuntu, Python), 어떤 파일을 복사할지, 어떤 패키지를 설치할지, 어떤 명령을 실행할지 등을 순서 대로 기록

# 특징 
`#` : 으로 사용
# 코드

| 명령어         | 설명                             |
| ----------- | ------------------------------ |
| FROM<br>    | 시작할 기본 이미지 지정(필수)              |
| WORKDIR<br> | 작업 디렉터리 설정                     |
| COPY / ADD  | 디렉터리/파일을 이미지 내 복사<br>          |
| RUN<br>     | 이미지 빌드 시 실행할 명령 (패키지 설치 등)<br> |
| CMD<br>     | 컨테이너 실행 시 기본 명령<br>            |
| EXPOSE<br>  | 사용할 포트 명시 (문서 목적)<br>          |
| ENV<br>     | 환경 변수 설정<br>                   |
| ENTRYPOIN   | 실행 명령 고정                       |

작업 폴더 생성 
	mkdir C:\build_test 
	cd C:\build_test

작업 폴더 내 Dockerfile 생성 
	 Dockerfile  생성

내용 작성
	```dockerfile
	 # "#" 으로 주석처리
	FROM ubuntu:22.04 
	WORKDIR /app
	```

build
	docker build -t step2 .

실행 
	작업 디렉터리 생성 및 위치 확인 
	docker run --name step2 step2 pwd

컨테이너 및 이미지 삭제
	docker rm step2
	docker rmi step2