# Silver Health Care

노인 건강 모니터링 시스템 - 실시간 건강 데이터 추적 및 응급 알림 서비스

## 프로젝트 소개

Silver Health Care는 노인 요양 시설을 위한 실시간 건강 모니터링 시스템입니다.
웨어러블 기기와 센서를 통해 수집된 생체 데이터를 분석하고, 위급 상황 발생 시 즉시 알림을 제공합니다.

## 주요 기능

- **실시간 대시보드**: 전체 어르신의 건강 상태를 한눈에 확인
- **건강 모니터링**: 심박수, 혈압, 혈당, 체온, 산소포화도 실시간 추적
- **응급 알림**: 위급 상황 발생 시 즉시 알림 및 상세 정보 제공
- **건강 리포트**: 주기적인 건강 리포트 생성 및 권장사항 제공
- **복약 관리**: 약물 복용 스케줄 관리 및 복용 기록 추적
- **모바일 반응형**: 모바일 기기에서도 최적화된 UI/UX

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Ant Design** (UI 컴포넌트)
- **Axios** (API 통신)

### Backend
- **FastAPI** (Python)
- **JWT** (인증/인가)
- **JSON** 파일 기반 데이터 저장

### Infrastructure
- **Nginx** (리버스 프록시, 정적 파일 서빙)
- **Oracle Cloud** (호스팅)
- **SSL/TLS** (HTTPS 지원)

## 설치 및 실행

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev  # 개발 서버
npm run build  # 프로덕션 빌드
\`\`\`

### Backend

\`\`\`bash
cd backend
pip install -r requirements.txt
python3 main.py
\`\`\`

## 테스트 계정

- **관리자**: admin / admin123
- **보호자**: guardian / guard123

## 라이선스

MIT License
