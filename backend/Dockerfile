# Use an OpenJDK base image
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the JAR file into the container
COPY target/iam-0.0.1-SNAPSHOT.jar app.jar

# Expose the port used by the service
# EXPOSE 8081

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
