# API Design Overview

Have official plugins for common SSO support; And also make it easy to enable and config them from Skygear Portal.

Portal needs to have an interface for on/off and configuration of ID / Secret.

## Scenario

* Sign in with web popup
* Sign in with web redirect
* Sign in with limited capability devices (TV/Command line)
* Sign in with Mobile
* Sign in, and then interact with 3rd party service using the auth information
* Login by `AuthProvider A`, but the email already got another account from `AuthProvider B`, show an error and tell users to login with another `AuthProvide B`
* Login by `AuthProvider A`, but the email already got another account from `AuthProvider B`, tell users to login and link with new AuthProvider
* Login by `AuthProvider A`, but the email already got another account from `AuthProvider B`, assume it is two different accounts (will break the assumption of Skygear, which each users got unique email address)
* At User Setting page, add another `AuthProvider`
* Integrate with any service that supports OAuth by writing cloud code.

# Sample Codes for Use Cases

User wants to post things to Facebook, they want to write code like this

```
skygear.loginWithFacebook({use3rdPartyClient: true}).then(skygearUser=> {
  // They can call this because we are using FB.login internally
  FB.post('hi'); // post to timeline

  skygear.getOAuthTokens().then(function(tokens){
    //tokens['com.facebook'] is FB's access token
  });
})
```

User wants to integrate with a website supporting OAuth

```
skygear.loginWithOAuthProvider('com.example', {
  clientID: 'xxxxxxx',
  uxMode: 'popup',
  scope: 'email'
}).then(skygearUser => {
  // At this point, the user is logged in
  skygear.getOAuthTokens().then(function(tokens){
    //tokens['com.example'] is FB's access token
  });
})
```

Cloud code to add an OAuth provider

```
@skygear.provides("oauth", "com.facebook")
class FacebookOAuthProvider
  def auth_url(self):
    return "http://example.com/auth"

  def access_token_url(self, code):
    return "http://example.com/access_token?code="+code
```

Access OAuth tokens in Cloud code:

```
container = SkygearContainer(user_id='1', api_key='master')
tokens = container.getOAuthTokens()
token = tokens['com.facebook']

# It's an object with detail of token
token.access_token
token.expire_date
```

# Changes on SDK

## JS

- `loginWithOAuthProvider(providerID, options, [accessToken])`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - clientID
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user to this url after auth. If it is null, back to the current URL
  - `accessToken` - Optional. Pass in access token if client already has it, skygear will try to login directly instead of going through the OAuth flow.
  - This function returns a skygear user, and an access token of the service.
- `associateAccountWithProvider(providerID, options)`
  - Add a new auth provider to the user by going through the auth flow
  - This API requires user to be logged in already, return error otherwise
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - clientID
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user to this url after auth. If it is null, back to the current URL
  - This function returns a skygear user, and an access token of the new service.
- `getOAuthTokens()`
  - Return a promise of tokens

        getOAuthTokens().then(function(tokens){
          //tokens['com.facebook'] is FB's access token
        });

### Platform specific API
- `loginWithFacebook(options)` and `loginWithGoogle(options)`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - clientID
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user to this url after auth. If it is null, back to the current URL
    - use3rdPartyClient - whether to use 3rd party client, e.g. Facebook JS SDK. Default `false`

## iOS

- `-[SKYContainer loginWithOAuthProvider:(NSString*)providerID, options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
    - We will provide `com.facebook`, `com.google`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means in-app-browser (SFSafariViewController/WKWebView) and redirect means Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
  - This function returns a skygear user, and an access token of the service, via a delegate.
- `-[SKYContainer loginWithOAuthProvider:(NSString*)providerID, accessToken:(NSString*)accessToken completion:(void(^)(NSError*, SKYUser*))]`
  - `accessToken` - Client calls this API if it already has an access token, skygear will try to login directly instead of going through the OAuth flow.
- `-[SKYContainer associateAccountWithProvider:(NSString*)providerID options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Add a new auth provider to the user by going through the auth flow
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means in-app-browser (SFSafariViewController/WKWebView) and redirect means Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
  - This function returns a skygear user, and an access token of the new service, via delegate.
- `-[SKYContainer getOAuthTokensWithCompletion:(void(^)(NSError*, NSDictionary*))]`
  - Return tokens

        [container getOAuthTokensWithCompletion:^(NSDictionary *tokens){
          //tokens['com.facebook'] is FB's access token
        }];

### Platform specific APIs

- `-[SKYContainer loginWithFacebook:(NSDictionary*)options]` and `-[SKYContainer loginWithGoogle:(NSDictionary*)options]`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means in-app-browser (SFSafariViewController/WKWebView) and redirect means Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
    - use3rdPartyClient - whether to use 3rd party client, e.g. Facebook iOS SDK. Default `false`
  - Returns the user logged in via delegate.

# Changes on API at skygear-server

None.

# Changes on Plugin

## Environment variables

- `UNIQUE_EMAIL_FOR_ACCOUNTS`, boolean
- `FACEBOOK_CLIENT_SECRET`
- `GOOGLE_API_KEY`
- `SSO_ENABLED` e.g `FACEBOOK,GOOGLE`.

## Implementation

The plugin internally has a "Map<ProviderID, (info -> URL)>" map, something like this.
It will be used to generate urls when user auth.

```
{
  'com.facebook': {
    'auth': () =>
        "https://www.facebook.com/v2.9/dialog/oauth" +
        "?client_id=" + clientID +
        "&redirect_uri=" + generateRedirectURL()
    'access_token': (code)=>
        "https://www.facebook.com/v2.9/dialog/access_token" +
        "?client_id=" + clientID +
        "&client_secret=" + FACEBOOK_CLIENT_SECRET
  },
  'com.google': {
    'auth': ...,
    'access_token': ...
  }
}
```

Since the map is in plugin, user should be able to extend it easily.

```
@oauth_auth('com.custom.website')
def auth():
  return "http://example.com/auth"

@oauth_access_token('com.custom.website')
def access_token(code):
  return "http://example.com/access_token?code="+code
```

Pseudo code of `oauth:handle_access_token`:

```
def handleAccessToken(token):
  # Code should be organized in a way to share logic with auto provider
  existingUser = getUserByAccessToken(token)
  if existingUser:
    return existingUser

  emailOfThirdPartyAccount = getEmail(token)
  if emailOfThirdPartyAccount:
    user = getUserByEmail(emailOfThirdPartyAccount)

    if user !== null && UNIQUE_EMAIL_FOR_ACCOUNTS:
      return Error("The email is associated with another account")

    addAuthToUser(user, token)
    return user

  return createNewUser(token)
}
```

## APIs

- `oauth:auth_url`
  - Accepts a provider id and options
  - Return an url for auth
  - Example pseudo return value

        https://www.facebook.com/v2.9/dialog/oauth?
        client_id={app-id}
        &redirect_uri=http%3A%2F%2Fskygear.dev%2Foauth%2Fhandle_code%3Fprovider%3Dcom.facebook%26user_id%3D123

- `oauth:handle_code`
  - A handler that accepts code from 3rd party service
  - Exchange code with access token
  - Create user if needed
  - Pass the user back to client
  - An pseudo example of the url that is expect to be called

        http://skygear.dev/oauth/handle_code?provider=com.facebook&user_id=123&code=223344

- `oauth:handle_access_token`
  - Accepts a provider id, and access token
  - If this handler is called with a user logged in
    - Associate the user with auth provider and access token
  - Otherwise,
    - Login or create new users according to the provider and access token
  - Return the user

# Database Scheme

No changes.

# Others Supplement Information

## Login flow

JS, iOS and Android should follow this flow:

### When using 3rd party client

1. Call 3rd party client
2. When user is authed, get the access_token
3. Pass access_token to `oauth:handle_access_token`, to receive skygear user
  - Server behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
4. Return user and access_token

#### When using OAuth flow

1. Ask for a url to display via `oauth:auth_url`
2. Show the url to user, either popup or redirect
3. After user login, the webpage should be redirected to skygear-server with a code
4. Skygear-server exchange access token with code (`oauth:handle_code`)
  - Behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
5. Skygear-server create or login a user
6. Pass the user back to client side

### For devices with limited capability

1. Fetch code and URL from Google / Facebook
2. Return the above data to the developer, expect the URL and should to be shown to user
3. Constantly poll Google / Facebook for auth result
   - With timeout
4. When access_token is received via polling, send it to skygear-server `oauth:handle_access_token`
  - Server behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
5. Pass the user from skygear user and access_token back to user


