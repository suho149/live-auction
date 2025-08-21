# --- 1단계: 빌드 환경 ---
# Node.js 18-alpine 이미지를 빌드용 베이스 이미지로 사용 (alpine은 경량 버전)
FROM node:18-alpine as builder

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 의존성 레이어 캐싱
COPY package*.json ./

# npm 의존성 설치
RUN npm install

# 나머지 소스 코드 복사
COPY . .

# 프로덕션용으로 React 앱 빌드 (build 폴더에 정적 파일 생성)
RUN npm run build


# --- 2단계: 서빙 환경 ---
# 경량 웹서버 Nginx를 최종 베이스 이미지로 사용
FROM nginx:1.23-alpine

# 위 빌드 환경에서 생성된 build 폴더 안의 모든 파일을 Nginx의 기본 웹 루트 디렉토리로 복사
COPY --from=builder /app/build /usr/share/nginx/html

# React Router가 제대로 동작하도록 커스텀 Nginx 설정을 덮어쓰기
# (아래에서 만들 default.conf.template 파일을 복사)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Nginx 기본 포트인 80번 포트 노출
EXPOSE 80
EXPOSE 443

# Nginx를 foreground로 실행하여 컨테이너가 바로 종료되지 않도록 함
CMD ["nginx", "-g", "daemon off;"]