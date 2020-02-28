# Overview

The Auth gear supports single sign-on (SSO) via OAuth 2.0, OpenID Connect, Sign in with Apple, and Custom Token.

The only implemented OAuth 2.0 flow is [Authorization Code](https://tools.ietf.org/html/rfc6749#section-4.1) for devices that have access to a browser.

In the future we may support [limited-input device](https://developers.google.com/identity/protocols/OAuth2ForDevices).

In addition to the OAuth 2.0 Authorization Code flow, existing provider access tokens are also accepted. However, the API is disabled by default due to possible vulnerability. The details will be included in later section in this document.

# OAuth 2.0 Authorization Code flow

## Web browser with Popup

The flow does not change the location of the current window, instead, it opens a new popup window of the provider authorization UI.

### API

```typescript
interface LoginOptions {
  // Specify how the server should handle user duplicate. Default to "abort".
  onUserDuplicate?: "abort" | "merge" | "create";
  // Which realm to consider during merging. Default to the "default" realm.
  mergeRealm?: string;
}

// Create a new user with the provider identity.
function loginOAuthProviderWithPopup(providerID: string, options?: LoginOptions): Promise<User>;
// Link the provider identity with the current logged in user.
function linkOAuthProviderWithPopup(providerID: string): Promise<User>;
```

### Example

```typescript
skygear.auth.loginOAuthProviderWithPopup("google").then(user => {
  // login suceedeed
});
```

## Web browser with Redirect

The flow changes the location of the current window to show the provider authorization UI.

### API

```typescript
interface RedirectOptions {
  // If provided, when the flow finishes, the browser will be redirected
  // to this URL. Default to window.location.href if not provided.
  callbackURL?: string;
}

// Create a new user with the provider identity.
function loginOAuthProviderWithRedirect(providerID: string, options?: RedirectOptions & LoginOptions): Promise<void>;
// Link the provider identity with the current logged in user.
function linkOAuthProviderWithRedirect(providerID: string, options?: RedirectOptions): Promise<void>;

function getLoginRedirectResult(): Promise<User>;
function getLinkRedirectResult(): Promise<User>;
```

### Example

```typescript
skygear.auth.loginOAuthProviderWithRedirect("google").catch(error => {
  // If we reach here, something went wrong and window.location.href is unchanged.
});

// If the above promise did not reject, the page was redirected so the `then` handler
// will not be called.

// Later on when the flow finishes, the user will be redirected to `callbackURL`.

// Call this to retrieve the result of the flow.
skygear.auth.getLoginRedirectResult().then(user => {
  // login suceedeed
});
```

## React Native

### API

```typescript
interface SSOLoginOptions {
  onUserDuplicate?: "abort" | "merge" | "create";
}

function loginOAuthProvider(providerID: string, callbackURL: string, options?: SSOLoginOptions): Promise<User>;
function linkOAuthProvider(providerID: string, callbackURL: string): Promise<User>;

function loginApple(providerID: string, callbackURL: string, options?: SSOLoginOptions): Promise<User>;
function linkApple(providerID: string, callbackURL: string): Promise<User>;

function getCredentialStateForUserID(appleUserID: string): Promise<"Authorized" | "NotFound" | "Revoked" | "Transferred">;
```

### Example

#### Login example

```typescript
import { getSystemVersion } from "react-native-device-info";

function getMajorSystemVersion(): number {
  const version = getSystemVersion();
  const parts = version.split(".");
  return parseInt(parts[0], 10);
}

function LoginScreen() {
  // For a React Native app, Sign in with Apple must provide two experiences.
  //
  // On iOS >= 13, the developer must use loginApple which uses AuthenticationServices
  // to provide a native experience.
  //
  // On other iOS versions and Android, the developer must use loginOAuthProvider which is the standard
  // web-based OpenID Connect flow.
  const onPress = useCallback(() => {
    if (Platform.OS === "ios" && getMajorSystemVersion() >= 13) {
      skygear.auth.loginApple("apple-app", "myapp://host/path");
    } else if (Platform.OS === "ios" || Platform.OS === "android") {
      skygear.auth.loginOAuthProvider("apple-web", "myapp://host/path");
    }
  }, []);
  return (
    <View>
      <SignInWithAppleButton onPress={onPress} />
    </View>
  );
}
```

#### Revoke example

```typescript
async function onAppLaunch() {
  await skygear.configure({ apiKey: "apiKey", endpoint: "https://example.com"});
  const i = skygear.auth.currentIdentity;
  if (i != null && i.type === "oauth" && i.providerType === "apple") {
    const state = await getCredentialStateForUserID(i.providerUserID);
    if (state === "Revoked") {
      // Logout the user and present suitable UI.
    }
  }
}
```

# External access token flow

This is not a flow defined by OAuth 2.0. The main usecase is for native applications that have already acquired an access token, for example, via [Facebook Login for iOS](https://developers.facebook.com/docs/facebook-login/ios/).

## Possible Vulnerability

Suppose Alice grants access to Mallory, a malicious application, via OAuth 2.0. Mallory now has the bearer access token of Alice, which is considered a proof of identity. Mallory can now impersonate Alice and login our application with the identity of Alice.

Since this API is vulnerable by design, it is disabled by default. The developer is strongly recommended to use the standard OAuth 2.0 Authorization Code flow even the application is native and has already had acquired an access token.

### API

```typescript
function loginOAuthProviderWithAccessToken(providerID: string, accessToken: string, options?: LoginOptions): Promise<User>;
function linkOAuthProviderWithAccessToken(providerID: string, accessToken: string): Promise<User>;
```

### Example

```typescript
getAccessTokenViaFacebookSDKSomehow().then(accessToken => {
  loginOAuthProviderWithAccessToken("facebook", accessToken).then(user => {
    // login suceedeed
  });
});
```

# Remove OAuth Provider

Removing the provider used to login in current session is forbidden. Such case happens when the user logged in with some provider and has no other login means.

### API

```typescript
function removeOAuthProvider(providerID: string): Promise<void>;
```

### Example

```typescript
askConfirmation().then(confirmed => {
  if (confirmed) {
    skygear.auth.removeOAuthProvider("google");
  }
});
```

# Options on duplicated email during login

Some users may forget that they have signed up with email long ago. When they return to the application again, they may login with OAuth 2.0 provider in which the same email is used.

The client side configuration `onUserDuplicate` has three options `abort`, `merge` and `create`.

The server side configuration `on_user_duplicate_allow_merge` is a boolean flag whether `merge` is allowed.

The server side configuration `on_user_duplicate_allow_create` is a boolean flag whether `create` is allowed.

Since login ID by itself is not unique, the client has an option `mergeRealm` to specify the realm to match against.

## Abort on duplicate

- The Auth gear will infer the email from the provider user info.
- The email and `mergeRealm` are used to match an existing user.
- If such match is found and `onUserDuplicate` is `abort`, the process is aborted and user duplicated error is returned to the client.
- It is the developer's responsibility to handle this error, probably by showing an error message explaining the situation such as `Seems that you have signed up before. Click here to login.`
- Preferably after the user has logged in with their email, the application can offer an option to link with the provider.

### Example

```typescript
try {
  await loginOAuthProviderWithPopup("google");
} catch (e) {
  if (skygear.error.isUserDuplicate(e)) {
    const navigateToLogin = await alert("Seems that you have signed up before. Click here to login.");
    if (navigateToLogin) {
      history.push("/login");
    }
  }
}
```

## Merge on duplicate

- The Auth gear will infer the email from the provider user info.
- The email and `mergeRealm` are used to match an existing user.
- If such match is found and `onUserDuplicate` is `merge`, that provider becomes a new Identity of that existing user.

### Example

```typescript
loginOAuthProviderWithPopup("google", {
  // The server must have enabled merge otherwise this is an error.
  onUserDuplicate: "merge",
});
```

However, merging has security implications as illustrated by the following scenario.

1. Mallory signs up a legit website using Alice's email and the website does not have email verification.
2. Mallory sends a link to the website to Alice and asks Alice to sign up.
3. Alice signs up with OAuth 2.0 Provider and her account is shared with Mallory.
4. Mallory can now access Alice's profile of that provider.

> In addition to email, should we consider phone number?

## Create new user on duplicate

- The Auth gear will infer the email from the provider user info.
- The email and `mergeRealm` are used to match an existing user.
- If such match is found and `onUserDuplicate` is `create`, a new user is created.

### Example

```typescript
loginOAuthProviderWithPopup("google", {
  // The server must have enabled create otherwise this is an error.
  onUserDuplicate: "create",
});
```

# Removal of v1 API

The following v1 API is removed.

```typescript
function getOAuthProviderProfiles(): Promise<{[providerID: string]: any}>;
```

The existing implementation simply return all snapshots of user info of all providers of the logged in user. The snapshot of user info most likely will be stale. So the function unlikely return what the developer expects. If we want to make the function always return the fresh user info, we need to implement refresh token of OAuth 2.0. However, to implement refresh token, we have to drop support for `withAccessToken`, not to mention that some providers like Facebook does not support refresh token.

# List of Supported OAuth 2.0 Providers

- Google
- Facebook
- Instagram
- LinkedIn

# List of Supported OpenID Connect Providers

- [Microsoft identify platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)

# Custom Token

In case the developer want to integrate with a provider who does not support OAuth 2.0, they can achieve single sign-on with Custom Token.

### Client Side API

```typescript
function loginWithCustomToken(token: string, options?: LoginOptions): Promise<User>;
```

### Client Side Example

```typescript
loginMyAuthenticationServer().then(token => {
  skygear.auth.loginWithCustomToken(token).then(user => {
    // login suceeded
  });
});
```

### Server Side Integration

The custom token **MUST** be a JWT token.

It **MUST** have the following JWT standard claims.

- `iss`: The value must match the configured value in tenant configuration.
- `sub`: The user ID of the foreign authentication system.

It **SHOULD** have the following JWT standard claims.

- `aud`: If present and the configured value is not empty, they must match.
- `exp`: If present, the Auth gear will validate it against the current time.
- `nbf`: If present, the Auth gear will validate it against the current time.

It **MAY** have the following OpenID Connect standard claims.

- `email`: If present, it is used in [handling duplicated email](#options-on-duplicated-email-during-login)

The signing algorithm is `HS256`. The signing key is shared between the Auth gear and the foreign authentication system.

### Server Side Example (Node.js)

```typescript
// Install this package from npm
const jwt = require("jsonwebtoken");

const issuer = "MyAuthenticationSystem";
const userID = "User ID of my foreign authentication system";
const secret = "Shared secret with the Auth gear";
const nowUnix = Math.floor(Date.now() / 1000);

const token = jwt.sign({
  sub: userID,
  iss: issuer,
  iat: nowUnix,
  exp: nowUnix + 60 * 60,
  email: "user@example.com",
}, secret, { algorithm: "HS256" });
```

# Tenant Configuration

```YAML
custom_token:
  # By default Custom Token is disabled.
  enabled: false
  # The "iss" in JWT claims.
  issuer: ''
  # The share secret with the foreign authentication system.
  secret: ''
  # Whether merge is allowed. Default to false.
  on_user_duplicate_allow_merge: false
  # Whether create is allowed. Default to false.
  on_user_duplicate_allow_create: false
oauth:
  url_prefix: ''
  js_sdk_cdn_url: ''
  # The secret used to sign the JWT token, which itself is used as state.
  # See https://tools.ietf.org/html/rfc6749#section-4.1.1
  state_jwt_secret: ''
  # Whether external access token flow is enabled. Default to false.
  external_access_token_flow_enabled: false
  # Whether merge is allowed. Default to false.
  on_user_duplicate_allow_merge: false
  # Whether create is allowed. Default to false.
  on_user_duplicate_allow_create: false
  providers:
    # "type" chooses the implementation. Required.
    # Valid values are "google", "facebook", "instagram", "linkedin" and "azureadv2"
  - type: google
    # id is providerID in the client API. It must be unique. It is used by the client to reference a registered
    # provider. It is optional and default to "type", given that no two providers share the same type.
    id: google
    # See https://tools.ietf.org/html/rfc6749#section-2.2
    # Typically, the developer obtain it from the provider. Required.
    client_id: ''
    # See https://tools.ietf.org/html/rfc6749#section-2.3.1
    # Typically, the developer obtain it from the provider. Required.
    client_secret: ''
    # See https://tools.ietf.org/html/rfc6749#section-3.3
    # Space-delimited scopes. Required.
    # Note that the scope must be large enough to fetch user info.
    scope: 'profile email'
  - type: azureadv2
    id: azure-ad-1
    # When "type" is "azureadv2"
    # The developer must specify "tenant".
    #
    # The value typically should be the tenant ID of the Azure AD.
    #
    # When the OAuth client is configured to be "Any Azure AD directory - Multitenant",
    # then the value must be the special value "organizations".
    #
    # When the OAuth client is configured to be "Any Azure AD directory - Multitenant and personal Microsoft accounts (e.g. Skype, Xbox)",
    # then the value must be the special value "common".
    #
    # If the developer wants to disallow some AD directories or disallow some kinds of Microsoft accounts,
    # they must make use of `before_user_create` and `before_identity_create` hook.
    # The hook payload includes the original ID token.
    # See https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens
    tenant: '53ed053f-c7ca-4b17-9ffc-917def96673c'
    client_id: ''
    client_secret: ''
  - type: azureadv2
    id: azure-ad-2
    tenant: '7026db0d-7b1d-4141-b3d0-3e8db2f7991e'
    client_id: ''
    client_secret: ''
```

> Should we make scope optional? We should be able to provide default scope by type.

## Changes from v1

The OAuth 2.0 changes from v1 is that `name` is splitted into `type` and `id` to support
providers that can have many instances. Providers like Facebook have only
single instance because there is only one Facebook in the Earth. However,
providers such as Microsoft identify platform (`azureadv2`) has many instances.

The Custom Token changes from v1 is that Custom Token is disabled by default because it is not a common feature and the ways that user can sign up as a new user should not be surprising. By default, the user can sign up with `email`, `username` and `phone`. If the developer configure any OAuth 2.0 providers, the user can login with such providers. If the developer further configure custom token as a final resort to SSO, the user can use that as well.

## Managing providers dynamically

Applications that have specific needs to add or remove providers as part of their application logic should make use of skycli (or the corresponding the controller endpoint) to update tenant configuration.

# Appendix

## Summary of Client API

```typescript
interface LoginOptions {
  onUserDuplicate?: "abort" | "merge" | "create";
  mergeRealm?: string;
}

interface RedirectOptions {
  callbackURL?: string;
}

function loginOAuthProviderWithPopup(providerID: string, options?: LoginOptions): Promise<User>;
function linkOAuthProviderWithPopup(providerID: string): Promise<User>;
function loginOAuthProviderWithRedirect(providerID: string, options?: RedirectOptions & LoginOptions): Promise<void>;
function linkOAuthProviderWithRedirect(providerID: string, options?: RedirectOptions): Promise<void>;

function getLoginRedirectResult(): Promise<User>;
function getLinkRedirectResult(): Promise<User>;

function loginOAuthProviderWithAccessToken(providerID: string, accessToken: string, options?: LoginOptions): Promise<User>;
function linkOAuthProviderWithAccessToken(providerID: string, accessToken: string): Promise<User>;

function removeOAuthProvider(providerID: string): Promise<void>;

function loginWithCustomToken(token: string, options?: LoginOptions): Promise<User>;
```
