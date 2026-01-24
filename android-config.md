# Android Configuration for JumTunes

After running `npx cap add android`, configure the following:

## 1. AndroidManifest.xml Permissions

Open `android/app/src/main/AndroidManifest.xml` and ensure these permissions:

```xml
<manifest>
    <!-- Internet access -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Audio playback -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Storage for downloads -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- Camera for profile photos -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Microphone for karaoke -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
</manifest>
```

## 2. Deep Linking Intent Filter

In `android/app/src/main/AndroidManifest.xml`, inside the `<activity>` tag:

```xml
<activity>
    <!-- Existing content... -->
    
    <!-- Deep link scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="jumtunes" />
    </intent-filter>
    
    <!-- Universal links (App Links) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" 
              android:host="jump-to-tune.lovable.app" />
    </intent-filter>
</activity>
```

## 3. Audio Focus and Background Playback

For background audio, the app already handles this via the web audio API.
For enhanced control, consider adding a foreground service (advanced).

## 4. File Provider (for sharing/downloads)

In `android/app/src/main/res/xml/file_paths.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external" path="." />
    <cache-path name="cache" path="." />
</paths>
```

## 5. Build Configuration

In `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        minSdkVersion 22
        targetSdkVersion 34
    }
}
```

## Testing Deep Links

Test with ADB:
```bash
adb shell am start -a android.intent.action.VIEW -d "jumtunes://payment-success?session_id=test"
```
