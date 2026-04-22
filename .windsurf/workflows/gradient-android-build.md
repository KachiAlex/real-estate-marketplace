---
description: Build an Android release via Gradient Bundle
---

## Prerequisites

1. Repo checked out with `mobile-app/` directory.
2. Node.js 18+, npm 9+, and Expo CLI (`npm install -g expo-cli eas-cli`).
3. Java 11 or 17 and complete Android SDK (platform tools + build tools 34.0.0 or newer).
4. Gradient Bundle access (UI or CLI) with permission to run container jobs against this repo.
5. Ability to define secure secrets/variables inside Gradient.

## Step 1 – Generate the signing keystore (one time)

Run inside `mobile-app/android` (adjust names as desired):

```bash
keytool -genkeypair \
  -v \
  -keystore propertyark-release.keystore \
  -alias propertyark \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Record the following for Gradient secrets:

- `ANDROID_KEYSTORE_BASE64` – base64-encoded contents of `propertyark-release.keystore`
- `ANDROID_KEYSTORE_PASSWORD` – keystore password
- `ANDROID_KEY_ALIAS` – e.g., `propertyark`
- `ANDROID_KEY_ALIAS_PASSWORD` – alias password (if different)

Add the corresponding Gradle properties to `mobile-app/android/gradle.properties` (leave values blank so secrets can fill them at runtime):

```
MYAPP_UPLOAD_STORE_FILE=propertyark-release.keystore
MYAPP_UPLOAD_STORE_PASSWORD=
MYAPP_UPLOAD_KEY_ALIAS=
MYAPP_UPLOAD_KEY_PASSWORD=
```

## Step 2 – Local sanity check (optional)

```bash
cd mobile-app
npm install
npx expo prebuild -p android --non-interactive
cd android
./gradlew clean assembleRelease
```

The signed APK should appear at `mobile-app/android/app/build/outputs/apk/release/app-release.apk`.

## Step 3 – Configure Gradient Bundle workflow

1. **Create a workflow** named "Android APK Build".
2. **Base image**: pick an Android-ready image (e.g., `cimg/android:2023.09` or any container with Node + Java 17 + Android SDK). Ensure `bash`, `npm`, and `gradlew` exist.
3. **Repo checkout step**: use Gradient’s built-in git checkout so the workspace contains this repo.
4. **Env / secrets**:
   - Inject `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_ALIAS_PASSWORD`.
   - Optionally add `EXPO_TOKEN` / `EAS_NO_VCS=1` if Expo auth is required.

5. **Workflow commands** (run at repo root):

```bash
set -e
cd mobile-app
npm install
npx expo prebuild -p android --non-interactive
cd android

# reconstruct keystore
echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > propertyark-release.keystore
cat <<'EOF' >> ../android/gradle.properties
MYAPP_UPLOAD_STORE_PASSWORD=${ANDROID_KEYSTORE_PASSWORD}
MYAPP_UPLOAD_KEY_ALIAS=${ANDROID_KEY_ALIAS}
MYAPP_UPLOAD_KEY_PASSWORD=${ANDROID_KEY_ALIAS_PASSWORD}
EOF

./gradlew clean assembleRelease
```

> If the container lacks `base64 -d`, use `base64 --decode`.

6. **Artifacts**: configure Gradient to upload
   - `mobile-app/android/app/build/outputs/apk/release/app-release.apk`
   - `mobile-app/android/app/build/outputs/bundle/release/app-release.aab` (add `./gradlew bundleRelease` if you also need an AAB).

7. **Trigger**: run on demand or push-to-main according to your release strategy.

## Step 4 – Download & verify

After the job succeeds, download the artifact(s) from Gradient, install on a device, and verify login, property list, and chat flows.

## Troubleshooting

- `ANDROID_HOME` errors: export `ANDROID_HOME=/opt/android-sdk` (or the path in your image) and add `platform-tools` to `PATH` before running Gradle.
- Signature issues: confirm the keystore password + alias secrets are correct and that `gradle.properties` references the same values.
- Expo prebuild prompts: the `--non-interactive` flag plus `EXPO_TOKEN` avoids prompts; ensure the token is configured if Expo requires auth.
