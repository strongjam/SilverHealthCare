#!/bin/bash

# Update Server Backend Script
# 서버의 users.json을 업데이트하고 백엔드를 재시작합니다

set -e

INSTANCE_IP="134.185.115.106"
SSH_USER="ubuntu"
SSH_KEY="$HOME/.ssh/ssh-key-2025-11-12.key"

# SSH 키 확인
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo ""
    echo "Please update the SSH_KEY variable in this script."
    echo "To find your SSH keys, check these locations:"
    echo "  - ~/.ssh/"
    echo "  - ~/Downloads/"
    exit 1
fi

echo "========================================="
echo "Updating Server Backend"
echo "========================================="

# 1. users.json 업로드
echo "[1/2] Uploading users.json..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /Users/apple/SilverHealthCare/backend/data/users.json \
    $SSH_USER@$INSTANCE_IP:/var/www/silverhealthcare/backend/data/

# 2. 백엔드 재시작
echo "[2/2] Restarting backend service..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SSH_USER@$INSTANCE_IP << 'ENDSSH'
    sudo systemctl restart silverhealthcare-backend
    echo "Backend restarted successfully!"
    sudo systemctl status silverhealthcare-backend --no-pager -l
ENDSSH

echo ""
echo "========================================="
echo "Update Complete!"
echo "========================================="
echo ""
echo "Now you can:"
echo "1. Visit https://skrr.store"
echo "2. Login with admin / admin123"
echo "3. Check the health monitoring page - you should see 12 users"
