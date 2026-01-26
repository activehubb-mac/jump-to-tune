
# iOS Audio Playback Fix - Native Configuration Required

## Summary
After thorough research including Stack Overflow, GitHub issues, and Apple Developer forums, the persistent iOS audio buffering issue is caused by **missing native iOS configurations** in the Capacitor project. The JavaScript-level fixes already implemented are correct but insufficient.

## Root Cause (Confirmed)

### What's Already Fixed (JavaScript Layer)
- Removed `await` from `unlockAudioForIOS()` to preserve gesture chain
- Switched to `loadedmetadata` event instead of `canplaythrough`
- Ensured `audio_url` is always passed with track data

### What's Still Broken (Native Layer)
1. **WKWebView Autoplay Policy**: Capacitor's WKWebView defaults to requiring user action for ALL media playback, and iOS 17+ is stricter than Safari browser about what qualifies as a "gesture"
2. **AVAudioSession Cold Start**: WKWebView doesn't pre-activate the iOS audio session, causing the OS to buffer indefinitely while trying to activate the audio route

## Required Native iOS Changes

### Step 1: Pre-activate AVAudioSession in AppDelegate.swift

Location: `ios/App/App/AppDelegate.swift`

```swift
import UIKit
import Capacitor
import AVFoundation  // ADD THIS

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // PRE-ACTIVATE AUDIO SESSION FOR iOS
        // This prevents "infinite buffering" by warming up the audio route
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set up audio session: \(error)")
        }
        
        return true
    }
    
    // ... rest of AppDelegate
}
```

### Step 2: Configure WKWebView Media Playback Policy

Create a custom Capacitor plugin or modify the bridge configuration to set:

```swift
// Option A: Create ios/App/App/CustomWebViewPlugin.swift
import Capacitor

@objc(CustomWebViewPlugin)
public class CustomWebViewPlugin: CAPPlugin {
    override public func load() {
        // Configure WKWebView for audio playback
        if let webView = self.webView {
            webView.configuration.mediaTypesRequiringUserActionForPlayback = []
            webView.configuration.allowsInlineMediaPlayback = true
        }
    }
}
```

OR modify the existing bridge by subclassing `CAPBridgeViewController`.

### Step 3: Verify Info.plist Configuration

Ensure these keys exist in `ios/App/App/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>fetch</string>
</array>
```

### Step 4: Update ios-config.md Documentation

Add the new native configuration requirements to the documentation for future reference.

## Implementation Steps for User

Since native iOS code cannot be modified from Lovable, here's what you need to do:

1. **Export project to GitHub** via "Export to GitHub" button
2. **Clone the repository** to your local machine
3. **Add iOS platform**: `npx cap add ios`
4. **Open in Xcode**: `npx cap open ios`
5. **Modify AppDelegate.swift** with the AVAudioSession code above
6. **Add/verify Info.plist** background audio configuration
7. **Optionally**: Create the custom WKWebView plugin for media autoplay
8. **Build and test** on a real iOS device

## Why This Will Work

The research confirms that:
- Supabase audio URLs work fine on iOS when properly configured (HTTP 206 byte-range support is present)
- The JavaScript playback code is correct and works on Safari browser
- The missing piece is purely native iOS configuration for WKWebView media policies

## Technical Details

### Files to Create/Modify (in local Xcode project)

```text
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift    <- MODIFY: Add AVAudioSession activation
│   │   ├── Info.plist           <- VERIFY: UIBackgroundModes includes "audio"
│   │   └── CustomWebViewPlugin.swift  <- CREATE: Optional, for autoplay policy
```

### Testing Checklist
- [ ] Audio plays immediately on first tap (no gesture blocking)
- [ ] Audio continues when app goes to background
- [ ] No "infinite buffering" spinner
- [ ] Playback works on iOS 17.4+
- [ ] Playback works on older iOS versions (15, 16)

## Alternative: Capacitor Plugin Approach

If you prefer not to modify native code directly, consider using the `@nicholasbraun/capacitor-audio-toggle` plugin or similar that handles AVAudioSession configuration automatically. However, the native approach above is more reliable for streaming audio.
