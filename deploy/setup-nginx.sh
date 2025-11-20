#!/bin/bash

# Silver Healthcare - Oracle Instance Nginx Setup Script
# 이 스크립트는 Oracle Cloud Instance에서 실행됩니다

set -e  # 에러 발생시 중단

echo "========================================="
echo "Silver Healthcare - Nginx Setup"
echo "========================================="

# 1. OS 확인
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "OS detected: $OS"
else
    echo "Cannot detect OS"
    exit 1
fi

# 2. Nginx 설치
echo ""
echo "[1/6] Installing Nginx..."
if [ "$OS" = "ubuntu" ]; then
    sudo apt update
    sudo apt install -y nginx
elif [ "$OS" = "ol" ] || [ "$OS" = "oracle" ]; then
    sudo yum install -y nginx
else
    echo "Unsupported OS: $OS"
    exit 1
fi

# 3. 방화벽 설정
echo ""
echo "[2/6] Configuring Firewall..."

# iptables 설정 (Oracle Cloud Instance)
if [ "$OS" = "ubuntu" ]; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
    sudo netfilter-persistent save || sudo iptables-save | sudo tee /etc/iptables/rules.v4
elif [ "$OS" = "ol" ] || [ "$OS" = "oracle" ]; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

echo "Firewall configured for HTTP (80) and HTTPS (443)"

# 4. 애플리케이션 디렉토리 생성
echo ""
echo "[3/6] Creating application directories..."
sudo mkdir -p /var/www/silverhealthcare/frontend
sudo mkdir -p /var/www/silverhealthcare/backend
sudo chown -R $USER:$USER /var/www/silverhealthcare

# 5. Nginx 설정 파일 생성
echo ""
echo "[4/6] Creating Nginx configuration..."

# 기본 설정 백업
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Site 설정 파일 생성
sudo tee /etc/nginx/sites-available/silverhealthcare > /dev/null <<'EOF'
# Silver Healthcare - Nginx Configuration

upstream backend_api {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name _;  # 도메인이 있으면 여기에 입력 (예: example.com www.example.com)

    # 로그 파일
    access_log /var/log/nginx/silverhealthcare_access.log;
    error_log /var/log/nginx/silverhealthcare_error.log;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Frontend - React 앱
    location / {
        root /var/www/silverhealthcare/frontend;
        try_files $uri $uri/ /index.html;

        # 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend - FastAPI
    location /api/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 헤더 (FastAPI가 처리하지만 추가 보안)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# sites-enabled 디렉토리가 없으면 생성
sudo mkdir -p /etc/nginx/sites-enabled

# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/silverhealthcare /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

echo "Nginx configuration created at /etc/nginx/sites-available/silverhealthcare"

# 6. Nginx 설정 테스트 및 시작
echo ""
echo "[5/6] Testing Nginx configuration..."
sudo nginx -t

echo ""
echo "[6/6] Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# 상태 확인
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Next Steps:"
echo "1. Upload your frontend build files to: /var/www/silverhealthcare/frontend"
echo "2. Upload your backend files to: /var/www/silverhealthcare/backend"
echo "3. Start your FastAPI backend on port 8001"
echo "4. Access your application at: http://YOUR_INSTANCE_IP"
echo ""
echo "Useful Commands:"
echo "  - Check Nginx status: sudo systemctl status nginx"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - View error logs: sudo tail -f /var/log/nginx/silverhealthcare_error.log"
echo "  - View access logs: sudo tail -f /var/log/nginx/silverhealthcare_access.log"
echo ""
