#!/bin/bash

# 에러 발생 시 즉시 스크립트 중단
set -e

# 1. 기존 환경 완전 정리
echo "### Cleaning up existing environment..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm liveauction-project_certbot_conf liveauction-project_certbot_www || true

# 2. 인증서 발급 전용 docker-compose 파일로 Nginx와 Certbot 실행
echo "### Requesting certificate..."
docker-compose -f docker-compose-init.yml up

# 3. 인증서 발급용 컨테이너 정리
echo "### Cleaning up temporary containers..."
docker-compose -f docker-compose-init.yml down

# 4. 모든 서비스를 최종 설정으로 실행
echo "### Starting all services with HTTPS..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d