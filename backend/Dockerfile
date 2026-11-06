# Stage 1: Build Spring Boot JAR with Maven & JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compile and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production JRE 21 runtime (minimal footprint ~150MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

# Low-memory footprint flags optimized for cloud free tiers (512MB RAM limit)
# -XX:+UseSerialGC saves ~50MB RAM on single-vCPU instances
# -Xmx350m prevents Out-Of-Memory (OOM 137) container killing
ENV JAVA_OPTS="-XX:+UseSerialGC -Xmx350m -Xms128m"
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]

