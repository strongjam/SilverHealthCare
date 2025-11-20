# Silver Healthcare - 배포 가이드

오라클 클라우드 인스턴스에 Silver Healthcare 애플리케이션을 배포하는 방법입니다.

## 사전 준비

1. **오라클 클라우드 인스턴스 정보**
   - 인스턴스 공인 IP 주소
   - SSH 키 파일: `~/.ssh/ssh-key-2025-11-12.key`
   - SSH 사용자명 (보통 `ubuntu` 또는 `opc`)

2. **오라클 클라우드 보안 목록 설정**
   - 오라클 클라우드 콘솔 → Networking → Virtual Cloud Networks
   - 사용 중인 VCN 선택 → Security Lists
   - Ingress Rules에 다음 추가:
     - **Source CIDR**: `0.0.0.0/0`
     - **Destination Port**: `80` (HTTP)
     - **Destination Port**: `443` (HTTPS)

## 배포 단계

### 1단계: Nginx 설정 스크립트를 서버에 업로드

```bash
# 오라클 인스턴스 IP 주소 설정 (예시)
export INSTANCE_IP="123.456.78.90"

# 스크립트 업로드
scp -i ~/.ssh/ssh-key-2025-11-12.key \
    deploy/setup-nginx.sh \
    ubuntu@$INSTANCE_IP:~/
```

### 2단계: 서버에서 Nginx 설정 실행

```bash
# 서버에 SSH 접속
ssh -i ~/.ssh/ssh-key-2025-11-12.key ubuntu@$INSTANCE_IP

# 스크립트 실행 권한 부여
chmod +x setup-nginx.sh

# Nginx 설정 실행
./setup-nginx.sh

# 완료 후 로그아웃
exit
```

이 단계에서 다음이 자동으로 설정됩니다:
- ✅ Nginx 설치
- ✅ 방화벽 설정 (포트 80, 443 열기)
- ✅ 애플리케이션 디렉토리 생성
- ✅ Nginx 리버스 프록시 설정
- ✅ Nginx 서비스 시작

### 3단계: 애플리케이션 배포

로컬 컴퓨터에서 실행:

```bash
# 배포 스크립트에 실행 권한 부여
chmod +x deploy/deploy-app.sh

# 애플리케이션 배포 (IP 주소는 실제 값으로 변경)
./deploy/deploy-app.sh 123.456.78.90 ubuntu
```

이 단계에서 다음이 자동으로 수행됩니다:
- ✅ Frontend 빌드 (`npm run build`)
- ✅ Frontend 파일 서버에 업로드
- ✅ Backend 파일 서버에 업로드
- ✅ Python 환경 및 의존성 설치
- ✅ Backend systemd 서비스 생성 및 시작

### 4단계: 확인

배포가 완료되면 브라우저에서 접속:

```
http://YOUR_INSTANCE_IP
```

로그인 화면이 나타나면 성공!

**테스트 계정:**
- 관리자: `admin` / `admin123`
- 보호자: `guardian` / `guard123`

## 문제 해결

### 서버 상태 확인

```bash
# SSH 접속
ssh -i ~/.ssh/ssh-key-2025-11-12.key ubuntu@$INSTANCE_IP

# Nginx 상태 확인
sudo systemctl status nginx

# Backend 상태 확인
sudo systemctl status silverhealthcare-backend

# Backend 로그 확인
sudo journalctl -u silverhealthcare-backend -f

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/silverhealthcare_error.log
```

### 포트가 열리지 않는 경우

1. **오라클 클라우드 보안 목록 확인**
   - 콘솔에서 Ingress Rules에 포트 80, 443이 있는지 확인

2. **인스턴스 방화벽 확인**
   ```bash
   # Ubuntu
   sudo iptables -L -n | grep 80

   # Oracle Linux
   sudo firewall-cmd --list-all
   ```

3. **Nginx 설정 확인**
   ```bash
   sudo nginx -t
   ```

### Backend가 시작되지 않는 경우

```bash
# 수동으로 실행해서 에러 확인
cd /var/www/silverhealthcare/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001

# 의존성 재설치
pip3 install --user fastapi uvicorn pydantic python-multipart
```

### Frontend가 보이지 않는 경우

```bash
# 파일 확인
ls -la /var/www/silverhealthcare/frontend

# 권한 확인
sudo chown -R ubuntu:ubuntu /var/www/silverhealthcare

# Nginx 재시작
sudo systemctl restart nginx
```

## 재배포

코드를 수정한 후 재배포하려면:

```bash
# 로컬에서 실행
./deploy/deploy-app.sh 123.456.78.90 ubuntu
```

이 명령은:
- Frontend를 다시 빌드하고 업로드
- Backend 파일을 업데이트
- Backend 서비스를 재시작

## SSL/HTTPS 설정 (선택사항)

도메인이 있는 경우 Let's Encrypt로 무료 SSL 인증서 설치:

```bash
# 서버에서 실행
sudo apt install -y certbot python3-certbot-nginx

# 도메인으로 인증서 발급 (example.com을 실제 도메인으로 변경)
sudo certbot --nginx -d example.com -d www.example.com

# 자동 갱신 설정 (cron에 자동 추가됨)
sudo certbot renew --dry-run
```

## 유용한 명령어

```bash
# 서비스 재시작
sudo systemctl restart nginx
sudo systemctl restart silverhealthcare-backend

# 로그 실시간 확인
sudo journalctl -u silverhealthcare-backend -f
sudo tail -f /var/log/nginx/silverhealthcare_access.log
sudo tail -f /var/log/nginx/silverhealthcare_error.log

# 서비스 중지
sudo systemctl stop silverhealthcare-backend

# 서비스 시작
sudo systemctl start silverhealthcare-backend
```

## 디렉토리 구조

```
/var/www/silverhealthcare/
├── frontend/           # React 빌드 파일
│   ├── index.html
│   ├── assets/
│   └── ...
└── backend/            # FastAPI 소스 코드
    ├── main.py
    ├── models.py
    └── data/           # JSON 데이터 저장소
```

## 보안 권장사항

1. SSH 포트 변경 (22 → 다른 포트)
2. SSH 비밀번호 로그인 비활성화
3. fail2ban 설치로 무차별 대입 공격 방지
4. 정기적인 보안 업데이트
5. 백업 설정

## 참고

- 이 설정은 개발/테스트 환경에 적합합니다
- 프로덕션 환경에서는 추가 보안 설정이 필요합니다
- 데이터베이스 사용을 권장합니다 (현재는 JSON 파일 사용)
