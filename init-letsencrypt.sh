#!/bin/bash

# 사용할 도메인과 이메일 설정 (로컬 .env 파일에서 읽어옴)
DOMAIN=$(grep DOMAIN_NAME .env | cut -d '=' -f2)
EMAIL=$(grep LETSENCRYPT_EMAIL .env | cut -d '=' -f2)

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Error: DOMAIN_NAME and LETSENCRYPT_EMAIL must be set in .env file"
  exit 1
fi

echo "### Requesting certificate for $DOMAIN ..."

# 1. 임시 Nginx 컨테이너 실행 (인증서 발급용)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm --service-ports \
  -v "$(pwd)/frontend/nginx/init-letsencrypt.conf:/etc/nginx/conf.d/default.conf" \
  frontend &

# 백그라운드에서 Nginx가 시작될 시간을 잠시 기다림
sleep 5

# 2. Certbot 실행하여 인증서 발급
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  --non-interactive

# 3. 임시 Nginx 컨테이너 중지
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

echo "### Certificate issued successfully. Starting all services..."

# 4. 모든 서비스를 최종 설정으로 실행
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d