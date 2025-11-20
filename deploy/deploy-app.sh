#!/bin/bash

# Silver Healthcare - Application Deployment Script
# 로컬에서 실행하여 오라클 인스턴스에 배포합니다

set -e

# 설정
INSTANCE_IP="${1:-YOUR_INSTANCE_IP}"  # 첫 번째 인자로 IP 받기
SSH_KEY="$HOME/.ssh/ssh-key-2025-11-12.key"
SSH_USER="${2:-ubuntu}"  # 두 번째 인자로 사용자명 받기 (기본: ubuntu)

if [ "$INSTANCE_IP" = "YOUR_INSTANCE_IP" ]; then
    echo "Usage: $0 <INSTANCE_IP> [SSH_USER]"
    echo "Example: $0 123.456.78.90 ubuntu"
    exit 1
fi

echo "========================================="
echo "Silver Healthcare - Deployment"
echo "========================================="
echo "Instance IP: $INSTANCE_IP"
echo "SSH User: $SSH_USER"
echo "SSH Key: $SSH_KEY"
echo ""

# 1. Frontend 빌드
echo "[1/5] Building frontend..."
cd /Users/apple/SilverHealthCare/frontend
npm run build

echo "Frontend build completed!"

# 2. Backend 준비
echo ""
echo "[2/5] Preparing backend..."
cd /Users/apple/SilverHealthCare

# backend 파일 압축
tar -czf /tmp/backend.tar.gz -C backend .

echo "Backend files prepared!"

# 3. 파일 업로드
echo ""
echo "[3/5] Uploading files to server..."

# Frontend 빌드 파일 업로드
echo "Uploading frontend..."
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    frontend/dist/ \
    $SSH_USER@$INSTANCE_IP:/var/www/silverhealthcare/frontend/

# Backend 파일 업로드
echo "Uploading backend..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /tmp/backend.tar.gz \
    $SSH_USER@$INSTANCE_IP:/tmp/

# Backend 압축 해제
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$INSTANCE_IP << 'ENDSSH'
cd /var/www/silverhealthcare/backend
tar -xzf /tmp/backend.tar.gz
rm /tmp/backend.tar.gz
ENDSSH

echo "Files uploaded successfully!"

# 4. 서버에서 Python 환경 설정 및 서비스 시작
echo ""
echo "[4/5] Setting up Python environment on server..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$INSTANCE_IP << 'ENDSSH'
# Python 및 pip 설치 확인
if ! command -v python3 &> /dev/null; then
    echo "Installing Python3..."
    sudo apt update && sudo apt install -y python3 python3-pip || sudo yum install -y python3 python3-pip
fi

# FastAPI 의존성 설치
echo "Installing Python dependencies..."
cd /var/www/silverhealthcare/backend
pip3 install --user fastapi uvicorn pydantic python-multipart

# data 디렉토리 생성 (없으면)
mkdir -p data

echo "Python environment setup complete!"
ENDSSH

# 5. Systemd 서비스 파일 생성 (Backend 자동 시작)
echo ""
echo "[5/5] Creating systemd service for backend..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$INSTANCE_IP << 'ENDSSH'
sudo tee /etc/systemd/system/silverhealthcare-backend.service > /dev/null <<'EOF'
[Unit]
Description=Silver Healthcare FastAPI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/silverhealthcare/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable silverhealthcare-backend
sudo systemctl restart silverhealthcare-backend

echo "Backend service created and started!"
ENDSSH

# 완료
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Your application is now running at:"
echo "  http://$INSTANCE_IP"
echo ""
echo "API endpoint:"
echo "  http://$INSTANCE_IP/api/"
echo ""
echo "Useful commands to run on server:"
echo "  - Check backend status: sudo systemctl status silverhealthcare-backend"
echo "  - View backend logs: sudo journalctl -u silverhealthcare-backend -f"
echo "  - Restart backend: sudo systemctl restart silverhealthcare-backend"
echo "  - Check nginx status: sudo systemctl status nginx"
echo ""

# 정리
rm -f /tmp/backend.tar.gz

echo "Deployment script finished!"
