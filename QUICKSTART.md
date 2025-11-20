# 빠른 시작 가이드

## 백엔드 실행하기

터미널을 열고 다음 명령어를 실행하세요:

```bash
cd /Users/apple/SilverHealthCare/backend
pip3 install fastapi uvicorn pydantic python-multipart
python3 main.py
```

백엔드가 http://localhost:8001 에서 실행됩니다.

## 프론트엔드 실행하기 (Node.js 20+ 필요)

새 터미널 창을 열고:

```bash
cd /Users/apple/SilverHealthCare/frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

브라우저에서 http://localhost:5173 을 열면 애플리케이션을 사용할 수 있습니다.

## API 테스트하기

백엔드가 실행 중일 때, 다음 명령어로 API를 테스트할 수 있습니다:

```bash
# 사용자 목록 조회
curl http://localhost:8001/api/users

# API 문서 확인
# 브라우저에서 http://localhost:8001/docs 를 열어보세요
```

## 초기 데이터

프로젝트에는 두 명의 테스트 사용자가 미리 설정되어 있습니다:
- 김영희 (75세, 여성)
- 이철수 (68세, 남성)

웹 인터페이스에서 "건강 데이터 추가" 버튼을 클릭하여 건강 데이터를 입력할 수 있습니다.

## 문제 해결

### Node.js 버전이 낮은 경우

```bash
# nvm을 사용하여 Node.js 20 설치
nvm install 20
nvm use 20
```

### 포트가 이미 사용 중인 경우

백엔드 포트(8001) 또는 프론트엔드 포트(5173)가 이미 사용 중이면:

1. 실행 중인 프로세스를 종료하거나
2. 코드에서 다른 포트를 사용하도록 수정하세요

```bash
# 포트 사용 확인 (macOS)
lsof -i :8001
lsof -i :5173
```
