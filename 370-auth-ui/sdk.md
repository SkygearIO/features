# SDK

The SDK acts as a OAuth public client. The developer must configure the SDK with `clientID` and the endpoints to Skygear Auth, Asset Gear and the app.

## Configuring the SDK

The developer must configure the SDK before use.

### Native App SDK

#### API

```typescript
interface ConfigureOptions {
  // OAuth client_id. It is used to identify the SDK as a public OAuth client.
  clientID: string;
  // The endpoint of the app. It is the default endpoint such as `https://myapp.skygearapp.com` or a custom domain `https://myapp.com`.
  appEndpoint: string;
  // The endpoint of Skygear Auth. If it is omitted, it is derived by
  // prepending `accounts.` to the domain of the app endpoint.
  authEndpoint?: string;
  // The endpoint of Asset Gear. If it is omitted, it is derived by
  // prepending `assets.` to the domain of the app endpoint.
  assetEndpoint?: string;
}

class Container {
  configure(opts: ConfigureOptions): void;
}
```

#### Example

##### Example of default domain

```typescript
import skygear from "@skygear/react-native";
skygear.configure({
  clientID: "client_id",
  appEndpoint: "https://myapp.skygearapp.com",
  // authEndpoint and assetEndpoint are derived from appEndpoint
  // authEndpoint: "https://accounts.myapp.skygearapp.com",
  // assetEndpoint: "https://assets.myapp.skygearapp.com",
});
```

##### Example of custom domain

```typescript
import skygear from "@skygear/react-native";
skygear.configure({
  clientID: "client_id",
  appEndpoint: "https://api.myapp.com",
  authEndpoint: "https://accounts.myapp.com",
  assetEndpoint: "https://assets.myapp.com",
});
```

### Browser-based App SDK

#### API

```typescript
interface ConfigureOptions {
  // OAuth client_id. It is used to identify the SDK as a public OAuth client.
  clientID: string;
  // The endpoint of the app. It is the default endpoint such as `https://myapp.skygearapp.com` or a custom domain `https://myapp.com`.
  appEndpoint: string;
  // The endpoint of Skygear Auth. If it is omitted, it is derived by
  // prepending `accounts.` to the domain of the app endpoint.
  authEndpoint?: string;
  // The endpoint of Asset Gear. If it is omitted, it is derived by
  // prepending `assets.` to the domain of the app endpoint.
  assetEndpoint?: string;
  // An application is first party if and only if it is not third party.
  // A first party application shares a common-domain thus the session cookie is shared.
  // If not specified, default to false. So by default the application is considered first party.
  isThirdPartyApp?: boolean;
}

class Container {
  configure(opts: ConfigureOptions): void;
}
```

#### Example

##### Example of first party app

```typescript
import skygear from "@skygear/web";
skygear.configure({
  clientID: "client_id",
  appEndpoint: "https://api.myapp.com",
  authEndpoint: "https://accounts.myapp.com",
  assetEndpoint: "https://assets.myapp.com",
  // isThirdPartyApp: false,
});
```

##### Example of third party app

```typescript
import skygear from "@skygear/web";
skygear.configure({
  clientID: "client_id",
  appEndpoint: "https://api.third-party-app.com",
  authEndpoint: "https://accounts.first-party-app.com",
  assetEndpoint: "https://assets.first-party-app.com",
  isThirdPartyApp: true,
});
```

## Authenticating the user

Depending on platform, the flow is a little bit different.

### Native APP SDK

#### API

```typescript
interface AuthorizeOptions {
  redirectURI: string;
  state?: string;
  onUserDuplicate?: "abort" | "merge" | "create";
}

// Modeled after https://tools.ietf.org/html/rfc6749#section-5.2
interface OAuthError {
  // The state from AuthorizeOptions.
  state?: string;
  error: string;
  error_description?: string;
  error_uri?: string;
}

// The promise rejects with an JavaScript Error that looks like a OAuthError.
function authorize(options: AuthorizeOptions): Promise<User>;

// Open the URL with the user agent that is used to perform authentication.
// On iOS it is SFAuthenticationSession or ASWebAuthenticationSession
// On Android it is Chrome Custom Tabs.
function openURL(url: string): Promise<void>;
```

#### Example

##### Authenticate in a React Native application

```typescript
import React, { useCallback } from "react";
import skygear from "@skygear/react-native";
import {Button, View} from "react-native";
function AuthenticationScreen({ navigate } : { navigate: (screenName: string) => void }) {
  const onPress = useCallback(() => {
    try {
      const user = await skygear.auth.authorize({
        redirectURI: "myappid://anyhost/anypath",
      });
      // If the application requires verification, check if the user is verified.
      if (!user.isVerified) {
        navigate("VerificationScreen");
      } else {
        navigate("HomeScreen");
      }
    } catch (e) {
      // Handle the error properly here.
      // For example, duplicated user.
    }
  }, []);
  return (
    <View>
      <Button title="Sign in" onPress={onPress} />
    </View>
  );
}
```

##### Open settings in a React Native application

```typescript
import React, { useCallback } from "react";
import skygear from "@skygear/react-native";
import {Button, View} from "react-native";
function SettingsScreen() {
  const onPressEditProfile = useCallback(() => {
    // Application-specific settings
  }, []);
  const onPressSecuritySettings = useCallback(() => {
    skygear.auth.openURL("https://accounts.myapp.com").catch(e => {
      // The error here should be unrecoverable.
    });
  }, []);
  return (
    <View>
      <Button title="Edit Profile" onPress={onPressEditProfile} />
      <Button title="Security Settings" onPress={onPressSecuritySettings} />
    </View>
  );
}
```

### Browser-based App SDK

#### API

```typescript
interface AuthorizeOptions {
  redirectURI: string;
  state?: string;
  onUserDuplicate?: "abort" | "merge" | "create";
}

// Modeled after https://tools.ietf.org/html/rfc6749#section-5.2
interface OAuthError {
  // The state from AuthorizeOptions.
  state?: string;
  error: string;
  error_description?: string;
  error_uri?: string;
}

// The promise resolves to nothing. It is because after calling this function,
// the URL is changed. The app is destoryed so the return value is not usable at all.
function authorize(options: AuthorizeOptions): Promise<void>;

// exchangeToken looks at window.location
// It checks if error is present and rejects with OAuthError.
// Otherwise assume code is present, make a token request.
function exchangeToken(): Promise<{ user: User; state?: string }>;
```

#### Example

##### Authenticate in a Browser-based application

```typescript
import React, { useCallback, useEffect } from "react";
import skygear from "@skygear/web";

function AuthenticationScreen() {
  const onClick = useCallback(() => {
    await skygear.auth.authorize({
      redirectURI: "https://www.myapp.com/continue",
      state: "mystate",
    });
  }, []);
  return (
    <div>
      <button onClick={onClick}>Sign in</button>
    </div>
  );
}

function ContinueScreen() {
  useEffect(() => {
    try {
      const { user, state } = await skygear.auth.exchangeToken();
      if (!user.isVerified) {
        window.location = "https://myapp.skygearapps.com/verify";
      } else {
        window.location = "https://myapp.skygearapps.com/home";
      }
    } catch (e) {
      // Handle the error properly here.
      // For example, duplicated user.
      // Or
      // This route is likely to be accessed manually.
      // Redirect to home
      window.location = "https://myapp.skygearapps.com/home";
    }
  }, []);
  return (
    <div>Loading</div>
  );
}
```

##### Open settings in a Browser-based application

```typescript
import React, { useCallback } from "react";
import skygear from "@skygear/web";

function SettingsScreen() {
  const url = "https://accounts.myapp.com";
  const onClickOpenSettingsAsPopup = useCallback(() => {
    window.open(url);
  }, []);
  const onClickOpenSettings = useCallback(() => {
    window.location = url;
  }, []);
  return (
    <div>
      <button onClick={onClickOpenSettingsAsPopup}>Open Settings as popup</button>
      <button onClick={onClickOpenSettings}>Open Settings</button>
      <iframe src={url} />
    </div>
  );
}
```

## The open source AppAuth library

There exists an open source library AppAuth which affiliates with OpenID. It comes with 3 variants, namely [Android](https://github.com/openid/AppAuth-Android), [iOS](https://github.com/openid/AppAuth-iOS) and [JS](https://github.com/openid/AppAuth-JS). The JS variant supports both browser and Node, but not React Native. There also exists an open source library [react-native-app-auth](https://github.com/FormidableLabs/react-native-app-auth) which is a bridge for AppAuth-Android and AppAuth-iOS.

However AppAuth is not particularly useful for the SDK. The more challenging part of the SDK is the refresh flows, which are not covered by AppAuth. Therefore AppAuth is not used internally by the SDK. Skygear Auth, however, should be compatible with any conforming client.
