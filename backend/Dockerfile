# --- 1단계: 빌드 환경 ---
# Java 17 Temurin JDK 이미지를 빌드용 베이스 이미지로 사용
FROM eclipse-temurin:17-jdk-focal as builder

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /workspace/app

# Gradle Wrapper 및 빌드 스크립트 파일들을 먼저 복사
# (소스코드보다 먼저 복사하여, 의존성이 변경되지 않으면 이 레이어를 캐싱하여 빌드 속도 향상)
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Gradle을 사용하여 의존성만 먼저 다운로드
RUN ./gradlew dependencies

# 나머지 소스 코드를 복사
COPY src src

# 애플리케이션을 빌드하여 JAR 파일 생성
# RUN ./gradlew build --no-daemon
RUN ./gradlew bootJar --no-daemon


# --- 2단계: 실행 환경 ---
# 더 가벼운 JRE(Java 실행 환경) 이미지를 최종 베이스 이미지로 사용
FROM eclipse-temurin:17-jre-focal

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /app

# 빌드 환경에서 생성된 JAR 파일을 실행 환경으로 복사
COPY --from=builder /workspace/app/build/libs/*.jar app.jar

# 애플리케이션이 실행될 포트 (기본값: 8080)
EXPOSE 8080

# 컨테이너가 시작될 때 실행할 명령어
# 운영 환경에서는 profile을 'prod' 등으로 변경할 수 있습니다.
ENTRYPOINT ["java", "-jar", "app.jar"]