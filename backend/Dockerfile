# Build stage: the Gradle wrapper pins the Gradle version, so the image needs only a JDK.
FROM eclipse-temurin:26-jdk-alpine AS build
WORKDIR /build

# Copy the wrapper and build scripts first. Dependency resolution then stays cached
# as long as build.gradle is unchanged, however often the sources change.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN ./gradlew --no-daemon dependencies --configuration runtimeClasspath > /dev/null

COPY src ./src
# Tests need a Docker engine (Testcontainers), which is not available inside the image.
# CI runs them before this image is ever built - see .github/workflows.
RUN ./gradlew --no-daemon bootJar -x test

# Runtime stage: a JRE is enough, and a smaller attack surface is the point.
FROM eclipse-temurin:26-jre-alpine AS runtime
WORKDIR /app

# Never run as root: NFR-SEC, and a habit worth having before the VPS in Slice 11.
RUN addgroup -S ccm && adduser -S ccm -G ccm
COPY --from=build /build/build/libs/*.jar app.jar
RUN chown -R ccm:ccm /app
USER ccm

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
