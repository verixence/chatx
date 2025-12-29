# Mobile App Setup Guide

## Overview

The ChatX mobile app is built with Expo and React Native, matching the web app's design and functionality.

## Design System

The mobile app uses the exact same design system as the web app:

### Colors
- **Primary**: #EFA07F (Peach/Coral)
- **Primary Light**: #F9E5DD
- **Secondary**: #1e3a8a (Blue)
- **Background**: Same background.jpeg image as web

### Typography
- Font sizes match web app
- Same font weights and line heights

### Components
- Button component with variants (primary, secondary, ghost, outline)
- Background image wrapper matching web styling
- Consistent spacing and border radius

## Current Implementation

### ✅ Completed
- Monorepo structure setup
- Expo project initialization
- Design tokens and theme system
- Navigation setup (React Navigation)
- Home/Marketing screen
- Login screen
- Signup screen
- Dashboard screen with upload options
- Background image integration
- Button component
- Color system matching web

### 🚧 In Progress / To Do
- Content detail view
- Chat interface
- Settings screen
- API integration (Supabase client)
- Authentication flow
- File upload functionality
- PDF viewer
- YouTube video integration
- Quiz and flashcard screens
- Settings and subscription management

## Running the App

### Development

```bash
# From root
npm run mobile

# Or from mobile directory
cd apps/mobile
npm run start
```

### Android

```bash
npm run mobile:android
```

### iOS

```bash
npm run mobile:ios
```

## File Structure

```
apps/mobile/
├── src/
│   ├── components/
│   │   ├── BackgroundImage.tsx
│   │   └── Button.tsx
│   ├── navigation/
│   │   └── types.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── DashboardScreen.tsx
│   └── theme/
│       ├── colors.ts
│       └── index.ts
├── assets/
│   ├── background.jpeg
│   └── logo.png
├── App.tsx
└── package.json
```

## Next Steps

1. **API Integration**: Set up Supabase client for mobile
2. **Authentication**: Implement auth flow with NextAuth/API
3. **Content Upload**: Add file picker and upload functionality
4. **Content Detail**: Create content viewing screen with tabs
5. **Chat Interface**: Implement chat UI matching web
6. **Navigation**: Add bottom tabs or drawer navigation
7. **Settings**: Create settings screen with subscription management

## Notes

- The app uses the same background image as the web app
- All colors and styling match the web app exactly
- Touch targets are minimum 44x44px for accessibility
- Uses SafeAreaView for proper spacing on all devices

