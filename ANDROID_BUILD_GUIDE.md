# Android Production Build Guide

This guide will help you build and deploy the ChatX mobile app to the Google Play Store.

## Prerequisites

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Create an Expo Account**
   - Sign up at https://expo.dev
   - Login via CLI: `eas login`

3. **Google Play Console Account**
   - Create a Google Play Developer account ($25 one-time fee)
   - Create an app listing in the Play Console

## Build Configuration

The app is configured with three build profiles in `eas.json`:

### 1. Development Build
For internal testing with development client:
```bash
cd apps/mobile
eas build --profile development --platform android
```

### 2. Preview Build (APK)
For internal testing and distribution:
```bash
cd apps/mobile
eas build --profile preview --platform android
```

### 3. Production Build (AAB)
For Google Play Store submission:
```bash
cd apps/mobile
eas build --profile production --platform android
```

## Environment Variables

Before building, ensure your `.env` file has production values:

```env
API_URL=https://your-production-api.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Building for Production

### Step 1: Configure Build
```bash
cd apps/mobile
eas build:configure
```

### Step 2: Build AAB for Play Store
```bash
eas build --profile production --platform android
```

This will:
- Generate a signed AAB (Android App Bundle)
- Upload it to Expo's servers
- Provide a download link when complete

### Step 3: Download the AAB
After the build completes, download the AAB file from the provided link.

## Submitting to Google Play Store

### Option 1: Manual Upload
1. Go to Google Play Console
2. Select your app
3. Navigate to "Release" > "Production" > "Create new release"
4. Upload the AAB file
5. Fill in release notes
6. Review and rollout

### Option 2: Automated Submit (EAS Submit)

1. **Create a Google Service Account**:
   - Go to Google Cloud Console
   - Create a service account
   - Download the JSON key file
   - Save it as `google-service-account.json` in `apps/mobile`

2. **Grant Permissions**:
   - In Google Play Console, go to "Users and permissions"
   - Add the service account email
   - Grant necessary permissions

3. **Submit via EAS**:
   ```bash
   eas submit --platform android
   ```

## Version Management

### Updating Version

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // User-facing version
    "android": {
      "versionCode": 2    // Increment for each Play Store release
    }
  }
}
```

**Important**:
- `version`: Semantic version shown to users (e.g., "1.0.1")
- `versionCode`: Integer that must increase with each release

### Build New Version
```bash
# Update version in app.json
# Then build
eas build --profile production --platform android
```

## Testing Before Release

### Internal Testing
1. Build with `preview` profile
2. Install APK on test devices
3. Test all features:
   - Login/Signup
   - Content upload
   - Chat functionality
   - Quiz and flashcards
   - Settings and account management

### Beta Testing via Play Store
1. Upload AAB to Play Store
2. Release to "Internal testing" track
3. Add testers via email
4. Collect feedback
5. Fix issues
6. Promote to production when ready

## Build Optimization

### Reduce APK Size
The app is already optimized with:
- Asset optimization enabled
- Unused code elimination
- ProGuard/R8 obfuscation (automatically enabled in production)

### Additional Optimizations
If you need to reduce size further, you can:

1. **Enable Hermes Engine** (React Native 0.70+):
   ```json
   {
     "expo": {
       "jsEngine": "hermes"
     }
   }
   ```

2. **Split APKs by ABI**:
   ```json
   {
     "android": {
       "enableShrinkingAndObfuscation": true,
       "enableProguardInReleaseBuilds": true
     }
   }
   ```

## Troubleshooting

### Build Fails
- Check Expo status page: https://status.expo.dev
- Review build logs in Expo dashboard
- Ensure all dependencies are compatible

### App Crashes on Launch
- Check logs: `adb logcat`
- Verify environment variables are set
- Test with development build first

### Play Store Rejection
- Follow Google's guidelines
- Ensure privacy policy is linked
- Add required screenshots and descriptions

## Commands Cheat Sheet

```bash
# Login to Expo
eas login

# Configure build
eas build:configure

# Build for testing (APK)
eas build --profile preview --platform android

# Build for production (AAB)
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android

# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

## Security Notes

1. **Never commit**:
   - `google-service-account.json`
   - `.env` with production credentials
   - Signing keys

2. **Use Expo Secrets** for sensitive data:
   ```bash
   eas secret:create --name API_URL --value https://api.example.com
   ```

## Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [ChatX API Documentation](../apps/web/README.md)

## Support

For build issues or questions:
- Email: info@verixence.com
- GitHub Issues: https://github.com/verixence/chatx/issues
