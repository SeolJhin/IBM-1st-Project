# syntax=docker/dockerfile:1

FROM gradle:8.11.1-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
# `bootJar` produces an executable JAR, so run that artifact directly.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
