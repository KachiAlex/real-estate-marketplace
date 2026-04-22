# Docker APK Build Instructions

## Prerequisites
1. **Install Docker Desktop**: Download from https://www.docker.com/products/docker-desktop
2. **Start Docker Desktop**: Open the application and wait for it to fully start
3. **Verify Docker is running**: 
   ```powershell
   docker --version
   ```

## Build Method 1: Using Docker Compose (Recommended)

```powershell
# From the project root directory
cd d:\real-estate-marketplace

# Build and run the container
docker-compose up --build

# The APK will be generated at:
# ./mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## Build Method 2: Using Docker Directly

```powershell
# Build the Docker image
docker build -t react-native-build .

# Run the container
docker run --rm -v "$(pwd)/mobile-app/android/app/build:/build/mobile-app/android/app/build" react-native-build

# The APK will be at:
# ./mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## Build Method 3: Quick Interactive Build

```powershell
# Enter the container shell
docker run -it --rm -v "$(pwd):/build" react-native-build bash

# Inside the container:
cd mobile-app
yarn install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

## What the Docker Setup Does

1. **Linux Alpine base** - Lightweight OS with Node.js 20
2. **Java 17** - Required for Android SDK tools
3. **Android SDK 36** - Latest API level
4. **NDK 27.1** - For native code
5. **Gradle Cache** - Mounts ~/.gradle to speed up subsequent builds
6. **Dependencies** - Installs all npm packages and prepares the project

## Troubleshooting

### "Docker daemon is not running"
- Open Docker Desktop and wait 2-3 minutes for startup

### "Cannot find image"
- Ensure Docker build command completed successfully
- Check available images: `docker images`

### "Out of disk space"
- Docker images can be large. Ensure 10GB+ free space
- Clean up: `docker system prune -a`

### Build takes too long
- First build downloads ~2GB of Android tools (normal)
- Subsequent builds are much faster due to caching
- Keep Docker Desktop running for faster builds

### Out of memory during build
- Docker memory may be limited. Increase in Docker Desktop settings:
  - Settings → Resources → Memory → Set to 6GB+

## If Build Succeeds

The APK will be at:
```
d:\real-estate-marketplace\mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

You can then:
- **Test on emulator**: Install Android Studio with emulator
- **Test on device**: `adb install app-release.apk`
- **Distribute**: Upload to Google Play Store

## Cleanup

```powershell
# Remove the image when done
docker rmi react-native-build

# Remove all unused Docker resources
docker system prune -a
```
