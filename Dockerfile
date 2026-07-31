# syntax=docker/dockerfile:1

FROM node:22.22.2-alpine3.22 AS web-build
WORKDIR /workspace/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-21 AS api-build
WORKDIR /workspace/apps/api
COPY apps/api/pom.xml ./
RUN mvn -B dependency:go-offline
COPY apps/api/src ./src
COPY --from=web-build /workspace/apps/web/dist ./src/main/resources/static
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S careops && adduser -S -G careops careops
WORKDIR /app
COPY --from=api-build --chown=careops:careops /workspace/apps/api/target/careops-vh-api-0.1.0.jar ./app.jar
USER careops
ENV CAREOPS_REQUIRE_DATABASE=true \
    CAREOPS_DATA_PATH=/tmp/careops-store.json
EXPOSE 4310
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-4310}/api/health >/dev/null || exit 1
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -jar /app/app.jar"]
