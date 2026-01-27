# iOS Configuration for JumTunes

After running `npx cap add ios`, you need to configure the following in Xcode:

## 1. Info.plist Permissions

Open `ios/App/App/Info.plist` and add:

```xml
<!-- Audio Background Mode -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>fetch</string>
</array>

<!-- Audio Session Category -->
<key>AVAudioSessionCategory</key>
<string>AVAudioSessionCategoryPlayback</string>

<!-- Microphone (for future karaoke recording) -->
<key>NSMicrophoneUsageDescription</key>
<string>JumTunes needs microphone access for karaoke recording features</string>

<!-- Photo Library (for cover art uploads) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>JumTunes needs photo library access to upload cover art and profile pictures</string>

<!-- Camera (optional, for profile photos) -->
<key>NSCameraUsageDescription</key>
<string>JumTunes needs camera access for profile photos</string>

<!-- Media Library -->
<key>NSAppleMusicUsageDescription</key>
<string>JumTunes integrates with your music library</string>
```

## 2. Deep Linking Configuration

In `ios/App/App/Info.plist`, add URL scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>jumtunes</string>
        </array>
        <key>CFBundleURLName</key>
        <string>app.lovable.cc620898f7c7430e97e07eaf8a387695</string>
    </dict>
</array>
```

## 3. Associated Domains (for Universal Links)

In Xcode:
1. Select your project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Associated Domains"
5. Add: `applinks:jump-to-tune.lovable.app`

## 4. App Transport Security

For development, you may need to allow cleartext (already handled in capacitor.config.ts).
For production, ensure all API calls use HTTPS.

## 5. Build Settings

- Minimum iOS version: 13.0
- Enable "Audio, AirPlay, and Picture in Picture" in Background Modes

## Testing Deep Links

Test deep links with:
```bash
xcrun simctl openurl booted "jumtunes://payment-success?session_id=test"
```
