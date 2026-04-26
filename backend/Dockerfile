FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the jar file
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
RUN apk add --no-cache imagemagick libheif
COPY --from=build /app/target/*.jar app.jar
# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
