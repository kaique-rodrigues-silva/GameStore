FROM node:22-alpine AS web
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /src/backend
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=web /src/frontend/dist/gamestore/browser/ ./src/main/resources/static/
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/backend/target/gamestore-limpa-1.0.0.jar /app/app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
