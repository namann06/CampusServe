# Production Multi-Stage Dockerfile for CampusServe Backend
# Stage 1: Build Spring Boot JAR with Maven & OpenJDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY backend/pom.xml pom.xml
RUN mvn dependency:go-offline -B

# Compile and package application
COPY backend/src src
RUN mvn clean package -DskipTests

# Stage 2: Minimal, fast, low-memory JRE 21 runtime (~150MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

# JVM memory tuning for free cloud tiers (512MB RAM cap):
# -XX:+UseSerialGC reduces GC thread overhead on single-core instances
# -Xmx350m guarantees heap stays within limits to prevent OOM termination (exit code 137)
ENV JAVA_OPTS="-XX:+UseSerialGC -Xmx350m -Xms128m"
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]

