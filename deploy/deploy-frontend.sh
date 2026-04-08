#!/bin/bash

# Quick Frontend Deployment Script
# 이 스크립트는 로컬에서 실행하여 프론트엔드만 재배포합니다

set -e

INSTANCE_IP="134.185.115.106"
SSH_USER="ubuntu"
SSH_KEY="$HOME/.ssh/ssh-key-2025-11-12.key"

# SSH 키 확인
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Please update the SSH_KEY variable in this script with the correct path."
    echo ""
    echo "To find your SSH keys, run: ls -la ~/.ssh/"
    exit 1
fi

echo "========================================="
echo "Deploying Frontend to skrr.store"
echo "========================================="

# Frontend 빌드 파일 업로드
echo "Uploading frontend..."
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    /Users/apple/SilverHealthCare/frontend/dist/ \
    $SSH_USER@$INSTANCE_IP:/var/www/silverhealthcare/frontend/

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Your updated frontend is now live at: https://skrr.store"
