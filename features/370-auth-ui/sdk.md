# SDK

The following new methods are added to access Auth UI.

## React Native

```typescript
interface LoginOptions {
  // If custom domain is used, this specify the custom domain.
  endpoint?: string;
  onUserDuplicate?: "abort" | "merge" | "create";
}

// Open a WebView to login. If it is canceled, the promise will be rejected.
function authorizeWithWeb(redirectURI: string, options?: LoginOptions): Promise<{
  authorizationCode: string;
}>;

function exchangeToken(authorizationCode: string): Promise<User>;

// Open a WebView that may retain the cookie of a previous session.
function openURL(url: string): Promise<void>;
```

## Web

```typescript
interface LoginOptions {
  // If custom domain is used, this specify the custom domain.
  endpoint?: string;
  onUserDuplicate?: "abort" | "merge" | "create";
}

// Redirect the current window to Auth UI.
function authorizeWithWeb(redirectURI: string, options?: LoginOptions): Promise<void>;

// If authorizationCode is not given, then it is retrieved from window.location
function exchangeToken(authorizationCode?: string): Promise<User>;
```

## Use cases

### Authenticate in a React Native application

```typescript
import React, { useCallback } from "react";
import skygear from "@skygear/react-native";
import {Button, View} from "react-native";

function AuthenticationScreen({ navigate } : { navigate: (screenName: string) => void }) {
  const onPress = useCallback(() => {
    try {
      const { authorizationCode } = await skygear.auth.authorizeWithWeb("myappid://anyhost/anypath", {
        endpoint: "https://accounts.myapp.com",
      });
      const user = await skygear.auth.exchangeToken(authorizationCode);
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

### Settings in a React Native application

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

### Authenticate in a Web application

```typescript
import React, { useCallback, useEffect } from "react";
import skygear from "@skygear/web";

function AuthenticationScreen() {
  const onClick = useCallback(() => {
    await skygear.auth.authorizeWithWeb("https://www.myapp.com/continue");
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
      const user = await skygear.auth.exchangeToken();
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

### Settings in a Web application

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
