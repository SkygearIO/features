# API Design Overview

Have official plugins for common SSO support; And also make it easy to enable
and config them from Skygear Portal.

Portal needs to have an interface for on/off and configuration of ID / Secret.

## Scenario

* Sign in with web popup
* Sign in with web redirect
* Sign in with limited capability devices (TV/Command line)
* Sign in with Mobile
* Sign in, and then interact with 3rd party service using the auth information
* Login by `AuthProvider A`, but the email already got another account from
  `AuthProvider B`, show an error and tell users to login with another
  `AuthProvide B`
* Login by `AuthProvider A`, but the email already got another account from
  `AuthProvider B`, tell users to login and link with new AuthProvider
* Login by `AuthProvider A`, but the email already got another account from
  `AuthProvider B`, assume it is two different accounts (will break the
  assumption of Skygear, which each users got unique email address)
* At User Setting page, add another `AuthProvider`
* Integrate with any service that supports OAuth by writing cloud code.

# Sample Codes for Use Cases

User wants to integrate with a website supporting OAuth

``` js
skygear.loginWithOAuthProvider('com.example', {
  uxMode: 'popup',
  scope: 'email'
}).then((skygearUser) => {
  // At this point, the user is logged in
  skygear.getOAuthTokens('com.example').then(function(authResult) {
    /*
    {
      "access_token": "...",
      "token_type": "bearer",
      "expires_at": 1495052619,
      "scope": ["email", "friends"],
      "refresh_token": "...."
    }
    */
  });
})
```

User wants to login with 3rd sdk

**[TBD]: Login with 3rd party SDK flow, should we wrap the 3rd party sdk call inside skygear SDK**

``` js
skygear.auth.loginWithFacebook({
  use3rdPartyClient: true
}).then((skygearUser) => {
  // They can call this because we are using FB.login internally
  FB.post('hi'); // post to timeline

  skygear.auth.getFacebookToken().then(function(authResult) {
    // authResult['access_token'] is FB's access token
    /*
    {
      "access_token": "...",
      "token_type": "bearer",
      "expires_at": 1495052619,
      "scope": ["email", "friends"],
      "refresh_token": "...."
    }
    */
  });
})
```

Cloud code to add an OAuth provider

``` python
@skygear.provides("oauth", "com.google")
class GoogleOAuthProvider(BaseOAuthProvider)
    name = 'google' # use to parse envvar and route

    def auth_base_url(self):
        return "https://accounts.google.com/o/oauth2/v2/auth"

    def auth_url(self, request): # Implement for customization
        return self.auth_base_url() + "?" +
            "response_type=code&" +
            "client_id=" + self.client_id + "&"
            "redirect_uri=" + generate_redirect_url(redirect_uri) + "&" +
            "access_type=offline&prompt=select_account"

    def access_token_base_url(self):
        return "https://www.googleapis.com/oauth2/v4/token"

    def refresh_token_base_url(self):
        return "https://www.googleapis.com/oauth2/v4/token"

    """
    we need this for creating skygear user
    """
    def user_info_url(self):
        return "https://www.googleapis.com/oauth2/v1/userinfo"

    """
    limited capability devices support
    """
    def device_code_url(self):
        return "https://accounts.google.com/o/oauth2/device/code"

    """
    limited capability devices support
    """
    def poll_access_token_url(self):
        return "https://www.googleapis.com/oauth2/v4/token"
```

Access OAuth tokens in Cloud code:

``` python
container = SkygearContainer(user_id='1', api_key='master')
# Getting all tokens
tokens = container.getOAuthTokens()
token = tokens['com.example'] //

# It's an object with detail of token
token.access_token
token.expire_date
```

# Changes on SDK

## JS
All function are under `skygear.auth`

- `loginWithOAuthProvider(providerID, options, [accessToken])`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user
      to this url after auth. If it is null, back to the current URL
  - `accessToken` - Optional. Pass in access token if client already has it,
    skygear will try to login directly instead of going through the OAuth
    flow.
  - This function returns a skygear user, and an access token of the service.
- `associateAccountWithProvider(providerID, options)`
  - Add a new auth provider to the user by going through the auth flow
  - This API requires user to be logged in already, return error otherwise
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - clientID
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user
      to this url after auth. If it is null, back to the current URL
  - This function returns a skygear user, and an access token of the new
    service.
- `getOAuthTokens(providerID)`
  - Calls skygear-server `user:oauth_tokens`, `user:set_oauth_token`
  - Return a promise of authResult

        getOAuthTokens('com.example').then(function(authResult) {
          /*
          {
            "access_token": "...",
            "token_type": "bearer",
            "expires_at": 1495052619,
            "scope": ["email", "friends"],
            "refresh_token": "...."
          }
          */
        });

### Platform specific API
- `loginWithFacebook(options)` and `loginWithGoogle(options)`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`
    - clientID
    - scope
    - redirectUrl - when uxMode is `redirect`, skygear will redirect the user
      to this url after auth. If it is null, back to the current URL
    - use3rdPartyClient - whether to use 3rd party client, e.g. Facebook JS
      SDK. Default `false`

## iOS

- `-[SKYContainer.auth loginWithOAuthProvider:(NSString*)providerID,
  options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
    - We will provide `com.facebook`, `com.google`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means
      in-app-browser (SFSafariViewController/WKWebView) and redirect means
      Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
  - This function returns a skygear user, and an access token of the service,
    via a delegate.
- `-[SKYContainer.auth loginWithOAuthProvider:(NSString*)providerID,
  accessToken:(NSString*)accessToken completion:(void(^)(NSError*,
  SKYUser*))]`
  - `accessToken` - Client calls this API if it already has an access token,
    skygear will try to login directly instead of going through the OAuth
    flow.
- `-[SKYContainer associateAccountWithProvider:(NSString*)providerID
  options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Add a new auth provider to the user by going through the auth flow
  - `providerID` - A string that identify the login provider
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means
      in-app-browser (SFSafariViewController/WKWebView) and redirect means
      Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
  - This function returns a skygear user, and an access token of the new
    service, via delegate.
- `-[SKYContainer.auth getOAuthTokensWithCompletion:(void(^)(NSError*,
  NSDictionary*))]`
  - Return all AuthResult

        [container.auth getOAuthTokensWithCompletion:^(NSDictionary *authResult){
        //tokens['com.facebook'] is FB's access token }];

- `-[SKYContainer.auth getOAuthTokenWithOAuthProvider:(NSString*)providerID,
  completion:(void(^)(NSError*, NSDictionary*))]`


### Platform specific APIs

- `-[SKYContainer.auth loginWithFacebook:(NSDictionary*)options]` and `-[SKYContainer loginWithGoogle:(NSDictionary*)options]`
  - `options`
    - uxMode - Either `popup`(default), or `redirect`, popup means in-app-browser (SFSafariViewController/WKWebView) and redirect means Safari.app
    - clientID
    - scope
    - version - FB Client SDK only
    - cookiePolicy - Google Client SDK only
    - use3rdPartyClient - whether to use 3rd party client, e.g. Facebook iOS SDK. Default `false`
  - Returns the user logged in via delegate.

## Android

- `container.auth().loginWithOAuthProvider(providerID, new
  AuthResponseHandler())`
- `container.auth().getOAuthToken(providerID, new
  OAuthResponseHandler())`

OAuthResponseHandler Interface

```
OAuthResponseHandler.onAuthFails(Error error);
OAuthResponseHandler.onAuthSuccess(AuthResult result);
```

# Changes on API at skygear-server

- New lambda `user:oauth_tokens`
  - Return OAuth data from database, the `_user.auth` column

- New lambda `user:set_oauth_token`
  - Take a provider id, and OAuth data
  - Save data into `_user.auth`, with "oauth." prefix in OAuth data

# Changes on Plugin

## Environment variables

- `UNIQUE_EMAIL_FOR_ACCOUNTS`, boolean
- `FACEBOOK_CLIENT_SECRET`
- `GOOGLE_API_KEY`
- `SSO_ENABLED` e.g `FACEBOOK,GOOGLE`.

## Implementation

The plugin internally has a `"Map<ProviderID, (info -> URL)>"` map, something
like this. It will be used to generate URLs when user auth.

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


### Pseudo code of AuthProvider

``` python
@skygear.provides("oauth", "com.google")
class GoogleOAuthProvider(BaseOAuthProvider)
  name = 'google' # use to parse envvar and route

  def auth_base_url(self):
    return "https://accounts.google.com/o/oauth2/v2/auth"

  def auth_url(self): # Implement for customization
    return self.auth_base_url() + "?" +
        "response_type=code&" +
        "client_id=" + self.client_id + "&"
        "redirect_uri=<redirect_uri>&" +
        "access_type=offline&prompt=select_account"

  def access_token_base_url(self):
    return "https://www.googleapis.com/oauth2/v4/token"

  def refresh_token_base_url(self):
    return "https://www.googleapis.com/oauth2/v4/token"

  """
  we need this for creating skygear user
  """
  def user_info_url(self):
    return "https://www.googleapis.com/oauth2/v1/userinfo"

  """
  limited capability devices support
  """
  def device_code_url(self):
    return "https://accounts.google.com/o/oauth2/device/code"

  """
  limited capability devices support
  """
  def poll_access_token_url(self):
    return "https://www.googleapis.com/oauth2/v4/token"


class BaseOAuthProvider:
    name = 'SSO' # use to parse envvar and route
    client_id = None
    client_secret = None
    scope = []

    def __init__(self):
        env_name = self.name.upper()
        self.client_id = os.environ.get(env_name + '_CLIENT_ID', None)
        self.client_secret = os.environ.get(env_name + '_CLIENT_SECRET', None)
        self.scope = os.environ.get(env_name + '_SCOPE', '').split(',')

    def auth_base_url(self):
        return "http://example.com/auth"

    def auth_url(self, request):
        return self.auth_base_url() + "?" +
            "response_type=code&" +
            "client_id=" + self.client_id + "&"
            "redirect_uri=" + generate_redirect_url(redirect_uri) + "&" +
            "access_type=offline&prompt=select_account"

    def access_token_base_url(self):
        return "http://example.com/access_token"

    def access_token_url(self, code, redirect_uri):
        return self.access_token_base_url() + "?" +
            "client_id=your_client_id&" +
            "client_secret=your_client_secret&" +
            "code=" + code + "&" +
            "grant_type=authorization_code"

    def refresh_token_base_url(self):
        return "http://example.com/token"

    def refresh_token_url(self, refresh_token):
        return self.refresh_token_base_url() + "?" +
            "grant_type=refresh_token&refresh_token=" + refresh_token

    def user_info_url(self):
        return "https://www.googleapis.com/oauth2/v1/userinfo"

    def device_code_url(self):
        return "https://accounts.google.com/o/oauth2/device/code"

    def poll_access_token_url(self):
        return "https://www.googleapis.com/oauth2/v4/token"

    def generate_redirect_url(self, redirect_uri):

    def handle_code(self, request):
        access_token_url = self.access_token_url(request.get('code'))

        """
          call access_token_url to request access_token
        """
        response = requests.POST(access_token_url)
        ....

        access_token_data = self.process_access_token_response(
            response.json_body)

        user = self.handle_access_token(access_token_data['access_token'])
        # redirect to uri from generate_redirect_url
        return

    def handle_access_token(self, request):
        user = self.handle_access_token(access_token_data['access_token'])
        # redirect to uri from generate_redirect_url
        return

    def signup_user_with_access_token(self, token):
        existing_user = get_user_by_access_token(token)
        if existing_user:
          return existing_user

        # get user profile from 3rd party
        user_info_url = self.user_info_url()
        url, headers, data = self.process_protected_request(
          user_info_url, auth_header, data
        )
        user_info_response = requests.get(
          user_info_url, headers=auth_header, data=data)
        user_info_data = self.process_user_info_response(response.json_body)

        email = user_info_data.get('email')
        if email:
            user = getUserByEmail(email)

            if user !== null && UNIQUE_EMAIL_FOR_ACCOUNTS:
                raise Error("The email is associated with another account")

            add_auth_to_user(user, token)
            return user

        # create or login skygear user
        return create_new_user()

    def register(self, name):
        skygear.handler('sso/'+ self.name +'/auth_url', self.auth_url)
        skygear.handler('sso/'+ self.name +'/handle_code', self.handle_code) # auth dialog callback
        skygear.handler('sso/'+ self.name +'/handle_access_token', self.handle_access_token) # login with 3rd party SDK

    """
    hock for customizations
    """
    def process_access_token_response(self, response_data):
        return response_data

    def process_refresh_token_response(self, response_data):
        return response_data

    def process_protected_request(self, url, headers, data):
        return url, headers, data

    def process_user_info_response(self, response_data):
        return response_data
```

**Sign in with limited capability devices flow**

Refs: [
OAuth 2.0 for TV and Limited-Input Device Applications](https://accounts.google.com/o/oauth2/device/code)

**Need providing hook to allow customizations for non compliant providers**

Refs: [requests-oauthlib](https://github.com/requests/requests-oauthlib)

- access_token_response
- refresh_token_response
- protected_request
- user_info_response

## APIs

### APIs for auth flow

- New lambda `oauth:auth_url`
  - Accepts a provider id and options
  - Return an url for auth
  - Example pseudo return value

        https://www.facebook.com/v2.9/dialog/oauth?
        client_id={app-id}
        &redirect_uri=http%3A%2F%2Fskygear.dev%2Foauth%2Fhandle_code%3Fprovider%3Dcom.facebook%26user_id%3D123

- New handler `oauth:handle_code`
  - A handler that accepts code from 3rd party service
  - Exchange code with access token
  - Create user if needed
  - Add access token to user `user:set_oauth_token`
  - Pass the user back to client
  - An pseudo example of the url that is expect to be called

        http://skygear.dev/oauth/handle_code?provider=com.facebook&user_id=123&code=223344

- New lambda `oauth:handle_access_token`
  - Accepts a provider id, and access token
  - If this handler is called with a user logged in
    - Associate the user with auth provider and access token
  - Otherwise,
    - Login or create new users according to the provider and access token
    - Add access token to user `user:set_oauth_token`
  - Return the user

### API for integrating other services

- New decorator `@skygear.provides("oauth", <provider id>)`
  - Register a new class that returns URLs for OAuth flow
  - Example in the above session
  - The goal is to let users to integrate any website that support OAuth

### Functions for working with 3rd party services after auth

- New method `container.getOAuthTokens()`
  - Return a dictionary of OAuth tokens of the current user
  - Call `skygear-server` `user:oauth_tokens` `user:set_oauth_token`
  - Pseudo code

        container.getOAuthTokens('com.facebook').access_token

- New method `container.refreshToken(providerID)`
  - A convenient method that refreshs access_token if needed, and if possible.
  - Updates database after refresh
  - Returns the new token

# Database Scheme

No changes.
Since we are going to use the existing auth provider to handle auth data, I
expect those related data to be saved in `_user` table's `auth` column. There
is no specific format for the data.

I am proposing the following format for data in the auth column.

- Data from OAuth providers will be saved with a "oauth." prefix in id
- The data inside will be almost the same as the [OAuth Access Token Response](https://tools.ietf.org/html/rfc6749#section-4.2.2), e.g.
  - `access_token`
  - `token_type`
  - `expires_at`, calculated from `expires_in`, an absolute timestamp
  - `refresh_token`

```
      {
        "oauth.com.facebook": {
          "access_token": "...",
          "token_type": "bearer",
          "expires_at": 1495052619,
          "refresh_token": "...."
        }
      }
```

# Others Supplement Information

## Login flow

JS, iOS and Android should follow this flow:

### When using 3rd party client

1. Call 3rd party client
2. When user is authed, get the access_token
3. Pass access_token to `oauth:handle_access_token`, to receive skygear user
  - Plugin behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
4. Return user and access_token

![OAuth flow](./3rd_party_sdk_flow.png)

#### When using OAuth flow

1. Ask for a url to display via `oauth:auth_url`
2. Show the url to user, either popup or redirect
3. After user login, the webpage should be redirected to plugin with a code
4. Plugin exchanges access token with code (`oauth:handle_code`)
  - Behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
5. Plugin creates or logins a user
6. Pass the user back to client side

![OAuth flow](./oauth_flow.png)

### For devices with limited capability

1. Fetch code and URL from Google / Facebook
2. Return the above data to the developer, expect the URL and should to be shown to user
3. Constantly poll Google / Facebook for auth result
  - With timeout
4. When access_token is received via polling, send it to skygear-server `oauth:handle_access_token`
  - Plugin behaviour depends on `UNIQUE_EMAIL_FOR_ACCOUNTS`
5. Pass the user from skygear user and `access_token` back to user
