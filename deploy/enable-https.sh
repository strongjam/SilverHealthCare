#!/bin/bash

# Silver Healthcare - Enable HTTPS Script
# 이 스크립트는 로컬에서 실행하여 원격 서버에 HTTPS를 설정합니다.

set -e

# 설정
INSTANCE_IP="134.185.115.106"
DOMAIN="skrr.store"
SSH_USER="ubuntu"
SSH_KEY="$HOME/.ssh/ssh-key-2025-11-12.key"  # 키 경로가 다르면 수정하세요

# SSH 키 확인
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Please update the SSH_KEY variable in this script with the correct path."
    exit 1
fi

echo "========================================="
echo "Enabling HTTPS for $DOMAIN"
echo "========================================="

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$INSTANCE_IP << ENDSSH
    # 1. Certbot 설치
    echo "[1/3] Installing Certbot..."
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    fi

    # 2. Nginx 설정 업데이트 (도메인 추가)
    echo "[2/3] Updating Nginx configuration..."
    # server_name이 _로 되어있는지 확인하고 도메인으로 변경
    sudo sed -i 's/server_name _;/server_name skrr.store;/' /etc/nginx/sites-available/silverhealthcare
    sudo systemctl reload nginx

    # 3. 인증서 발급
    echo "[3/3] Obtaining SSL Certificate..."
    # 비대화형 모드로 실행, 리다이렉트 설정 포함
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect

    echo "HTTPS enabled successfully!"
ENDSSH

echo ""
echo "Deployment Complete! Access your site at: https://$DOMAIN"
