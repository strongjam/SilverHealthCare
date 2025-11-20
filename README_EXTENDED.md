# 실버 헬스케어 - 실시간 건강 모니터링 시스템 (확장 버전)

어르신을 위한 실시간 건강 모니터링 시스템입니다. 심박수, 혈압, 혈당, 체온, 산소포화도 등의 건강 지표를 실시간으로 모니터링하고 관리할 수 있습니다.

## 🆕 새로운 기능 (v2.0)

### 1. 로그인 및 인증 시스템
- 관리자 및 보호자 계정 관리
- 토큰 기반 인증 (24시간 유효)
- 역할 기반 접근 제어 (RBAC)

### 2. 보호자/운영자 대시보드
- 전체 어르신 현황 한눈에 보기
- 활성 알림 및 복약 현황 모니터링
- 사용자별 건강 상태 실시간 확인

### 3. 응급 알림 시스템
- 위험 수준 자동 감지 (심박수, 혈압, 산소포화도)
- 실시간 알림 생성 및 관리
- 알림 확인 및 처리 이력 관리

### 4. 건강 리포트 자동 생성
- 주간/월간 건강 리포트 자동 생성
- 평균값 및 이상 징후 분석
- 맞춤 건강 권장사항 제공

### 5. 복약 알림 및 관리
- 복약 일정 등록 및 관리
- 복약 기록 추적 (복용/미복용/건너뜀)
- 복약 이행률 통계

## 기술 스택

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **Pydantic** - 데이터 검증
- **JWT** - 토큰 기반 인증
- **JSON** - 데이터 저장

### Frontend
- **Vite** - 빠른 개발 환경
- **React** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Ant Design** - UI 컴포넌트 라이브러리
- **Axios** - HTTP 클라이언트

## 프로젝트 구조

```
SilverHealthCare/
├── backend/
│   ├── main.py              # FastAPI 애플리케이션 (확장 버전)
│   ├── models.py            # 데이터 모델
│   ├── main_simple.py       # 기본 버전 (백업)
│   ├── pyproject.toml
│   └── data/                # JSON 데이터 저장소
│       ├── users.json
│       ├── admins.json
│       ├── health_data.json
│       ├── medications.json
│       ├── medication_logs.json
│       ├── emergency_alerts.json
│       ├── health_reports.json
│       └── sessions.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.tsx           # 로그인 화면
    │   │   └── HealthDashboard.tsx # 건강 모니터링
    │   ├── types/index.ts          # TypeScript 타입 정의 (확장)
    │   ├── services/api.ts
    │   ├── App.tsx                 # 통합 애플리케이션
    │   └── App_simple.tsx          # 기본 버전 (백업)
    └── package.json
```

## 설치 및 실행

### Backend 실행

```bash
cd backend
pip3 install fastapi uvicorn pydantic python-multipart
python3 main.py
```

Backend 서버가 http://localhost:8001 에서 실행됩니다.

### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

Frontend가 http://localhost:5173 (또는 사용 가능한 다음 포트)에서 실행됩니다.

## 로그인 정보

### 테스트 계정

**관리자 계정:**
- Username: `admin`
- Password: `admin123`
- 권한: 모든 사용자 관리 및 모니터링

**보호자 계정:**
- Username: `guardian`
- Password: `guard123`
- 권한: 담당 사용자만 모니터링

## API 엔드포인트

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 사용자 API
- `GET /api/users` - 모든 사용자 조회 (권한별 필터링)
- `GET /api/users/{user_id}` - 특정 사용자 조회

### 건강 데이터 API
- `GET /api/health-data/{user_id}` - 사용자 건강 데이터
- `GET /api/health-data/{user_id}/latest` - 최신 건강 데이터
- `POST /api/health-data` - 건강 데이터 생성

### 복약 관리 API
- `GET /api/medications/{user_id}` - 복약 목록
- `POST /api/medications` - 복약 정보 생성
- `GET /api/medication-logs/{user_id}` - 복약 기록
- `POST /api/medication-logs` - 복약 기록 생성
- `PUT /api/medication-logs/{log_id}` - 복약 기록 업데이트

### 응급 알림 API
- `GET /api/emergency-alerts` - 응급 알림 목록
- `POST /api/emergency-alerts` - 응급 알림 생성
- `PUT /api/emergency-alerts/{alert_id}/acknowledge` - 알림 확인

### 건강 리포트 API
- `GET /api/health-reports/{user_id}` - 건강 리포트 목록
- `POST /api/health-reports/generate/{user_id}` - 리포트 자동 생성

### 대시보드 API
- `GET /api/dashboard/overview` - 대시보드 개요

## 주요 기능 설명

### 1. 로그인 시스템
- 토큰 기반 인증 (24시간 유효)
- 역할별 접근 제어 (admin, guardian)
- 로그아웃 시 세션 자동 삭제

### 2. 건강 모니터링
- 5가지 주요 생체 신호 실시간 모니터링
- 비정상 수치 자동 감지
- 상태별 색상 코드 (정상/경고/위험)

### 3. 응급 알림
- 위험 수치 자동 감지 및 알림 생성
- 알림 우선순위 (high/medium/low)
- 알림 처리 이력 관리

### 4. 건강 리포트
- 기간별 건강 데이터 자동 분석
- 평균값 및 이상 징후 통계
- AI 기반 건강 권장사항 (확장 가능)

### 5. 복약 관리
- 복약 일정 등록 (하루 1회/2회/3회)
- 복약 알림 시간 설정
- 복약 이행률 추적

## 건강 지표 정상 범위

- **심박수**: 60-100 bpm
- **혈압**: 수축기 <140 mmHg, 이완기 <90 mmHg
- **혈당**: 70-180 mg/dL
- **체온**: 36.0-37.5 °C
- **산소포화도**: ≥95%

## 개발 환경

- Node.js: v18.15.0 이상 (Vite 5 사용)
- Python: 3.10 이상

## API 문서

FastAPI의 자동 생성 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 라이선스

MIT License

## 참고사항

- 이 프로젝트는 샘플/데모 프로젝트입니다
- 실제 의료 기기로 사용하기 위해서는 추가적인 보안 및 안정성 검증이 필요합니다
- 비밀번호는 실제 운영시 반드시 해싱하여 저장해야 합니다
- 데이터는 JSON 파일에 저장되므로, 실제 운영 환경에서는 데이터베이스 사용을 권장합니다

## 향후 개발 계획

- WebSocket을 통한 실시간 알림 푸시
- 차트 및 그래프 시각화
- 모바일 앱 연동
- 음성 알림 기능
- AI 기반 건강 예측 모델
