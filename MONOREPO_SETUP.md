# Monorepo Setup Guide

This project is organized as a monorepo with the following structure:

```
chatx_new/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo React Native mobile app
├── packages/
│   └── design-tokens/ # Shared design system tokens
└── package.json      # Root workspace configuration
```

## Getting Started

### Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for all workspaces.

### Running the Web App

```bash
npm run dev
# or
npm run dev --workspace=web
```

### Running the Mobile App

```bash
npm run mobile
# or
npm run mobile --workspace=mobile

# For Android
npm run mobile:android

# For iOS
npm run mobile:ios
```

## Workspace Commands

### Web App (Next.js)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Mobile App (Expo)
- `npm run start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser

## Design System

The mobile app uses the same design tokens as the web app:
- Colors: Primary peach (#EFA07F), Secondary blue (#1e3a8a)
- Spacing: Consistent spacing scale
- Typography: Matching font sizes and weights
- Border Radius: Consistent rounded corners

## Notes

- Both apps share the same API endpoints
- Design system is kept in sync manually (consider shared package in future)
- Mobile app assets are in `apps/mobile/assets/`

