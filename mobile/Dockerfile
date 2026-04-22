FROM node:18

WORKDIR /app

# Install Java (required for Gradle)
RUN apt-get update && apt-get install -y \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . .

# Install npm dependencies
RUN npm install --legacy-peer-deps

# Prebuild for Android
RUN echo "y" | npx expo prebuild --clean

# Fix settings.gradle to remove problematic plugin references
RUN cat > android/settings.gradle << 'EOF'
pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

rootProject.name = 'PropertyArk'
include ':app'
EOF

# Fix build.gradle with proper versions
RUN cat > android/build.gradle << 'EOF'
ext {
    compileSdkVersion = 34
    targetSdkVersion = 34
    minSdkVersion = 24
    buildToolsVersion = "34.0.0"
    ndkVersion = "26.1.10909125"
}

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle:8.1.0')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.0')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}
EOF

# Build APK using Gradle
WORKDIR /app/android
RUN GRADLE_OPTS="-Xmx4g" ./gradlew --no-daemon assembleDebug

# Copy output to /output
RUN mkdir -p /output && \
    cp app/build/outputs/apk/debug/app-debug.apk /output/app-debug.apk

WORKDIR /app

# Default command
CMD ["echo", "APK built successfully at /output/app-debug.apk"]
