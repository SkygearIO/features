# How to set up Sign in with Apple as a developer

- Register an Apple Developer Account. Apple Enterprise Account is not supported.
- Register a domain.
- The domain must be able to send and receive emails.
- Set up [SPF](https://en.wikipedia.org/wiki/Sender_Policy_Framework) for the domain.
- Set up [DKIM](https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail) for the domain.
- Help Apple to verify the domain. Download `apple-developer-domain-association.txt` from Apple Developer and serve it at `/.well-known/apple-developer-domain-association.txt`.
- Create an App ID with Sign in with Apple enabled.
- Create a Services ID with Sign in with Apple enabled. The description is user-facing.
- Create a Key with Sign in with Apple enabled. Keep the private key safe. It is used as `client_secret`.
- Make sure the bundle ID of the iOS application is the App ID.
- Add the capability "Sign in with Apple" to the iOS application.
- Declare an activity in AndroidManifest.xml to respond to the callback URL.
- Declare a custom URI scheme in Info.plist.
- Forward openURL callback in AppDelegate.

# Android Configuration Example

```xml
<!-- Declare that the application can respond to the callback URL. -->
<!-- The activity is implemented by the SDK. -->
<activity
  android:name="io.skygear.reactnative.OAuthRedirectActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="myapp"
      android:host="host" />
  </intent-filter>
</activity>
```

# iOS Configuration Example

## Info.plist

```xml
<!-- Declare that the application can respond to the callback URL. -->
<key>CFBundleURLTypes</key>
<array>
       <dict>
               <key>CFBundleTypeRole</key>
               <string>Editor</string>
               <key>CFBundleURLSchemes</key>
               <array>
                       <string>myapp</string>
               </array>
       </dict>
</array>
```

## AppDelegate.m

```
#import "SGSkygearReactNative.h"

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [SGSkygearReactNative application:application openURL:url options:options];
}
```

# UserConfiguration Example

```yaml
clients:
- client_name: My App
  redirect_uris:
  # The callback URL must match the ones declared in the iOS application and in the Android application.
  - "myapp://host/path"
sso:
  oauth:
    state_jwt_secret: statesecret
    providers:
    - id: apple-app
      type: apple
      client_id: 'your-sign-in-with-apple-enabled-app-id'
      client_secret: |
        -----BEGIN PRIVATE KEY-----
        The contents of the Key here.
        -----END PRIVATE KEY-----
      team_id: 'your-apple-developer-account-team-id'
      key_id: 'the-id-of-the-key'
    - id: apple-web
      type: apple
      client_id: 'your-sign-in-with-apple-enabled-services-id'
      client_secret: |
        -----BEGIN PRIVATE KEY-----
        The contents of the Key here.
        -----END PRIVATE KEY-----
      team_id: 'your-apple-developer-account-team-id'
      key_id: 'the-id-of-the-key'
```
