# syntax=docker/dockerfile:1

FROM gradle:8.11.1-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.war app.war
EXPOSE 8080
# Spring Boot executable WAR is launched with `java -jar`.
ENTRYPOINT ["java", "-jar", "/app/app.war"]
