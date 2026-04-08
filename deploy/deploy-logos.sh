#!/bin/bash

# logos.koreanok.com Deployment Script
# 이 스크립트는 로컬에서 실행하여 sugar/ 디렉토리를 logos.koreanok.com 도메인으로 배포합니다.

set -e

SSH_ALIAS="jamss"
REMOTE_PATH="/var/www/logos"
NGINX_CONF="/etc/nginx/sites-available/logos"
NGINX_LINK="/etc/nginx/sites-enabled/logos"
DOMAIN="logos.koreanok.com"

echo "========================================="
echo "Deploying sugar/ to $DOMAIN"
echo "========================================="

# 1. 서버 디렉토리 생성 및 권한 설정
echo "[1/4] Preparing remote directory..."
ssh $SSH_ALIAS "sudo mkdir -p $REMOTE_PATH && sudo chown -R \$USER:\$USER $REMOTE_PATH"

# 2. 파일 업로드 (React 빌드 결과물 및 Backend 업로드)
echo "[2/4] Uploading frontend and backend..."
# Frontend (Sync directly to root, excluding backend)
rsync -avz --delete --progress --exclude 'backend' /Users/apple/SilverHealthCare/sugar/sugar_react/dist/ $SSH_ALIAS:$REMOTE_PATH/
# Backend (Sync to backend folder, excluding databases and node_modules)
rsync -avz --delete --progress --exclude 'node_modules' --exclude '*.db' --exclude '*.sqlite' --exclude 'database.sqlite' /Users/apple/SilverHealthCare/sugar/backend/ $SSH_ALIAS:$REMOTE_PATH/backend/

# 2.1 Backend Setup on Remote
echo "[2.1] Setting up backend dependencies..."
ssh $SSH_ALIAS "cd $REMOTE_PATH/backend && npm install --production"

# 3. Nginx 설정 파일 생성 및 활성화
echo "[3/4] Configuring Nginx..."
NGINX_CONTENT=$(cat <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location = /index.html {
        root $REMOTE_PATH;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        expires off;
    }

    location / {
        root $REMOTE_PATH;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
)

ssh $SSH_ALIAS "sudo tee $NGINX_CONF > /dev/null" <<EOF
$NGINX_CONTENT
EOF

ssh $SSH_ALIAS "sudo ln -sf $NGINX_CONF $NGINX_LINK
sudo nginx -t && sudo systemctl reload nginx"

# 3.1 PM2 Process Management
echo "[3.1] Starting/Restarting backend with PM2..."
ssh $SSH_ALIAS "cd $REMOTE_PATH/backend && pm2 delete sugar-backend || true && pm2 start server.js --name sugar-backend"

# 4. SSL 설정 (Certbot)
# ... (rest of the script)

# 4. SSL 설정 (Certbot)
echo "[4/4] Enabling HTTPS with Certbot..."
ssh $SSH_ALIAS << 'ENDSSH'
    # Certbot 설치 확인 및 설치
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found. Installing..."
        if command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        fi
    fi
    sudo certbot --nginx -d logos.koreanok.com --non-interactive --agree-tos -m admin@logos.koreanok.com --redirect
ENDSSH

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Access your site at: https://$DOMAIN"
