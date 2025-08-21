#!/bin/bash

# 사용할 도메인과 이메일 설정 (로컬 .env 파일에서 읽어옴)
DOMAIN=$(grep DOMAIN_NAME .env | cut -d '=' -f2)
EMAIL=$(grep LETSENCRYPT_EMAIL .env | cut -d '=' -f2)

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Error: DOMAIN_NAME and LETSENCRYPT_EMAIL must be set in .env file"
  exit 1
fi

echo "### Cleaning up existing environment..."
# 1. 실행 중인 모든 컨테이너를 중지하고 볼륨을 정리합니다.
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm liveauction-project_certbot_conf liveauction-project_certbot_www

echo "### Starting temporary Nginx for certificate issuance..."
# 2. 임시 Nginx 컨테이너를 백그라운드에서 실행합니다.
#    -f 옵션으로 docker-compose.yml을, --file 옵션으로 임시 설정 파일을 사용합니다.
#    frontend 서비스만 명시하여 실행합니다.
docker-compose -f docker-compose.yml run -d --service-ports \
  --name temp_nginx \
  -v "$(pwd)/frontend/nginx/init-letsencrypt.conf:/etc/nginx/conf.d/default.conf" \
  frontend

# 백그라운드에서 Nginx가 시작될 시간을 충분히 기다림
echo "### Waiting for Nginx to start..."
sleep 10

echo "### Requesting certificate for $DOMAIN ..."
# 3. Certbot을 실행하여 인증서를 발급받습니다.
#    temp_nginx가 실행 중이므로 --webroot 방식이 성공할 것입니다.
docker-compose -f docker-compose.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  --non-interactive

echo "### Stopping temporary Nginx..."
# 4. 임시 Nginx 컨테이너를 중지하고 제거합니다.
docker stop temp_nginx
docker rm temp_nginx

echo "### Certificate issued successfully. Starting all services..."
# 5. 모든 서비스를 최종 설정으로 실행합니다.
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d