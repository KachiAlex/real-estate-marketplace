# KIKI Real Estate Mobile App

React Native mobile application for the KIKI Real Estate marketplace, built with Expo.

## Features

- 🔐 Firebase Authentication (Email/Password & Guest Login)
- 🏠 Property Listings & Search
- 📱 Property Details & Gallery
- 💰 Investment Tracking
- 🏦 Mortgage Management
- 👤 User Profile & Settings
- 🔔 Push Notifications (Coming Soon)
- 📍 Location Services

## Tech Stack

- **React Native** with Expo
- **React Navigation** for navigation
- **Firebase** for authentication and backend
- **AsyncStorage** for local storage
- **Expo Location** for location services
- **Expo Notifications** for push notifications

## Getting Started

### Prerequisites

- Node.js 14+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Firebase project configured

### Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running on Android

1. Start the Expo development server:
```bash
npm run android
```

2. Or scan the QR code with the Expo Go app on your Android device.

### Building for Production

#### Android APK

```bash
# Build APK for Android
expo build:android

# Or with EAS CLI (recommended)
npm install -g eas-cli
eas build -p android --profile production
```

#### Android App Bundle (AAB) for Play Store

```bash
eas build -p android --profile production
```

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.js
│   │   ├── PropertiesScreen.js
│   │   ├── PropertyDetailScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── SplashScreen.js
│   ├── navigation/       # Navigation configuration
│   │   └── AppNavigator.js
│   ├── config/          # Configuration files
│   │   └── firebase.js
│   ├── utils/           # Utility functions
│   │   └── mockData.js
│   └── components/      # Reusable components
├── assets/              # Images and static assets
├── App.js              # Main app component
└── app.json            # Expo configuration
```

## Configuration

### Firebase Setup

Update `src/config/firebase.js` with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};
```

### Android Configuration

The app is configured in `app.json` with:
- Package name: `com.kikirealestate.app`
- Permissions for location, camera, and storage
- Orange brand color (#f97316)

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator (macOS only)
- `npm run web` - Run in web browser
- `expo build:android` - Build Android APK
- `eas build` - Build with EAS (recommended)

## Features in Detail

### Authentication

- Email/Password registration and login
- Guest login (anonymous authentication)
- Firebase Auth integration
- Persistent sessions

### Property Management

- Browse properties by category
- Search and filter properties
- View property details and images
- Contact property owners
- Save favorite properties

### Dashboard

- Quick stats (properties, investments, mortgages)
- Recent activity
- Investment tracking
- Mortgage overview

### Profile

- Edit user profile
- Manage payment methods
- Notification preferences
- Settings and preferences
- Help & support

## Deployment

### Google Play Store

1. Build the app bundle:
```bash
eas build -p android --profile production
```

2. Download the AAB file from the Expo dashboard

3. Upload to Google Play Console

4. Complete the store listing and release

### Testing

- Use Expo Go app for quick testing
- Use Android emulator for extensive testing
- Physical device testing recommended before release

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Check `firebase.js` configuration
2. **Navigation errors**: Ensure all screens are properly registered
3. **Build failures**: Clear cache with `expo start -c`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright © 2024 KIKI Real Estate. All rights reserved.

