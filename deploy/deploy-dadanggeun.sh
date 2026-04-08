#!/bin/bash

# dadanggeun.skrr.store Deployment Script
# 이 스크립트는 로컬에서 실행하여 dadanggeun/ 디렉토리를 배포합니다.

set -e

SSH_ALIAS="jamss"
REMOTE_PATH="/var/www/dadanggeun"
NGINX_CONF="/etc/nginx/sites-available/dadanggeun"
NGINX_LINK="/etc/nginx/sites-enabled/dadanggeun"
DOMAIN="dadanggeun.skrr.store"

echo "========================================="
echo "Deploying dadanggeun/ to $DOMAIN"
echo "========================================="

# 1. 서버 디렉토리 생성 및 권한 설정
echo "[1/4] Preparing remote directory..."
ssh $SSH_ALIAS "sudo mkdir -p $REMOTE_PATH && sudo chown -R \$USER:\$USER $REMOTE_PATH"

# 1.5. 프론트엔드 빌드
echo "[1.5/5] Building React App..."
cd /Users/apple/SilverHealthCare/dadanggeun/frontend
npm run build
cd -

# 2. 파일 업로드
echo "[2/5] Uploading files..."
rsync -avz --exclude 'backend/database.sqlite' --exclude 'backend/uploads/' --exclude 'backend/node_modules/' --delete --progress /Users/apple/SilverHealthCare/dadanggeun/ $SSH_ALIAS:$REMOTE_PATH/

# 2.5 백엔드 및 PM2 데몬 설정
echo "[2.5/5] Setting up Node Backend & PM2..."
ssh $SSH_ALIAS << 'ENDPM2'
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if ! nvm use 20 &> /dev/null; then
        echo "Node 20 not found via NVM. Installing..."
        nvm install 20
        nvm use 20
    fi

    cd /var/www/dadanggeun/backend
    rm -rf node_modules package-lock.json
    npm install --production
    npm install -g pm2
    pm2 restart multicarrot-api || pm2 start src/server.js --name "multicarrot-api"
    pm2 save
ENDPM2

# 3. Nginx 설정 파일 생성 및 활성화
echo "[3/5] Configuring Nginx..."
ssh $SSH_ALIAS "sudo tee $NGINX_CONF > /dev/null <<'EOF'
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 50M;

    location / {
        root $REMOTE_PATH/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        alias $REMOTE_PATH/backend/uploads/;
    }
}
EOF
sudo ln -sf $NGINX_CONF $NGINX_LINK
sudo nginx -t && sudo systemctl reload nginx"

# 4. SSL 설정 (Certbot)
echo "[4/5] Enabling HTTPS with Certbot..."
ssh $SSH_ALIAS << 'ENDSSH'
    # Certbot 설치 확인
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found. Error."
        exit 1
    fi
    # SSL 인증서 발급 시도 (DNS 설정이 되어 있어야 함)
    sudo certbot --nginx -d dadanggeun.skrr.store --non-interactive --agree-tos -m admin@skrr.store --redirect || echo "SSL Certificate issuance failed. Check DNS."
ENDSSH

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Access your site at: http://$DOMAIN (or https if SSL succeeded)"
