# iOS Configuration for JumTunes

After running `npx cap add ios`, you need to configure the following in Xcode:

## 1. Audio Session Pre-Activation (CRITICAL for Streaming Audio)

The most critical step for fixing iOS audio buffering issues. Open `ios/App/App/AppDelegate.swift` and modify it:

```swift
import UIKit
import Capacitor
import AVFoundation  // ADD THIS IMPORT

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // PRE-ACTIVATE AUDIO SESSION FOR iOS
        // This prevents "infinite buffering" by warming up the audio route before any playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
            print("Audio session activated successfully")
        } catch {
            print("Failed to set up audio session: \(error)")
        }
        
        return true
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
```

## 2. WKWebView Media Playback Configuration (Optional but Recommended)

For even more reliable audio playback, create a custom bridge view controller. Create `ios/App/App/CustomBridgeViewController.swift`:

```swift
import UIKit
import Capacitor
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    
    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        
        // Allow audio to play without requiring user gesture
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsInlineMediaPlayback = true
        
        return config
    }
}
```

Then update `ios/App/App/MainViewController.swift` to use the custom bridge:

```swift
import UIKit
import Capacitor

class MainViewController: CustomBridgeViewController {
    // The base class handles everything
}
```

## 3. Info.plist Permissions

Open `ios/App/App/Info.plist` and add:

```xml
<!-- Audio Background Mode (REQUIRED for audio streaming) -->
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

## 4. Deep Linking Configuration

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

## 5. Associated Domains (for Universal Links)

In Xcode:
1. Select your project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Associated Domains"
5. Add: `applinks:jump-to-tune.lovable.app`

## 6. Build Settings

- Minimum iOS version: 13.0
- Enable "Audio, AirPlay, and Picture in Picture" in Background Modes capability

## 7. Testing Audio Playback

After applying these configurations, test audio with:

```bash
# Build and run on device
npx cap run ios

# Or open in Xcode for debugging
npx cap open ios
```

### Testing Checklist
- [ ] Audio plays immediately on first tap (no gesture blocking)
- [ ] Audio continues when app goes to background
- [ ] No "infinite buffering" spinner
- [ ] Playback works on iOS 17.4+
- [ ] Playback works on older iOS versions (15, 16)

## 8. Testing Deep Links

Test deep links with:
```bash
xcrun simctl openurl booted "jumtunes://payment-success?session_id=test"
```

## Troubleshooting

### Audio stuck on "buffering"
1. Ensure AVAudioSession is activated in AppDelegate.swift
2. Verify UIBackgroundModes includes "audio" in Info.plist
3. Check that the audio URLs are valid HTTPS URLs

### Audio doesn't play on first tap
1. Implement the CustomBridgeViewController with `mediaTypesRequiringUserActionForPlayback = []`
2. Ensure the play() call happens synchronously within the user gesture handler

### Audio stops when app backgrounds
1. Verify "Audio, AirPlay, and Picture in Picture" is enabled in Background Modes
2. Ensure AVAudioSession category is set to `.playback`

## File Structure After Configuration

```text
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift           <- Modified with AVAudioSession
│   │   ├── CustomBridgeViewController.swift  <- New file for WKWebView config
│   │   ├── MainViewController.swift    <- Modified to use custom bridge
│   │   ├── Info.plist                  <- Modified with permissions
│   │   └── ...
```
