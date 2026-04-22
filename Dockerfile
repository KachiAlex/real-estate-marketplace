# Simplified Android APK build with Expo/React Native
# Use Ubuntu instead of Alpine for better compatibility
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    nodejs \
    npm \
    git \
    curl \
    wget \
    unzip \
    android-sdk \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV ANDROID_SDK_ROOT=/usr/lib/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=${PATH}:/usr/lib/android-sdk/cmdline-tools/latest/bin:/usr/lib/android-sdk/platform-tools

# Install Node packages globally
RUN npm install -g yarn

# Set working directory
WORKDIR /build

# Copy entire project
COPY . .

# Install yarn dependencies
RUN cd mobile-app && \
    rm -rf node_modules yarn.lock && \
    yarn install --network-timeout=100000

# Create gradle config
RUN mkdir -p ~/.gradle && \
    echo "org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=1024m" > ~/.gradle/gradle.properties && \
    echo "kotlin.jvm.target.validation.mode=warning" >> ~/.gradle/gradle.properties && \
    echo "org.gradle.daemon=false" >> ~/.gradle/gradle.properties

# Run expo prebuild to generate Android native code
RUN cd mobile-app && \
    npx expo prebuild --platform android --clean

# Build the APK
RUN cd mobile-app/android && \
    chmod +x gradlew && \
    ./gradlew assembleRelease

# Output command
CMD ["bash", "-c", "if [ -f /build/mobile-app/android/app/build/outputs/apk/release/app-release.apk ]; then echo 'SUCCESS: APK built at /build/mobile-app/android/app/build/outputs/apk/release/app-release.apk' && ls -lh /build/mobile-app/android/app/build/outputs/apk/release/; else echo 'FAILED: APK not found'; fi"]
