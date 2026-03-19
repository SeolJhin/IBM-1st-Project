# syntax=docker/dockerfile:1

FROM gradle:8.11.1-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pil \
       python-is-python3 \
       fonts-nanum \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
# `bootJar` produces an executable JAR, so run that artifact directly.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
