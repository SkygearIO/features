# API Design Overview

Have official plugins for common SSO support; And also make it easy to enable
and config them from Skygear Portal.

Portal needs to have an interface for on/off and configuration of ID / Secret.

## Scenario

* Sign up and login with web popup
* Sign up and login with web redirect
* Sign up and login with limited capability devices (TV/Command line)
* Sign up and login with Mobile
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

## Duplicate email handling

To handle case when user login by `AuthProvider A`, but the email already
got another account from `AuthProvider B`

* Scenario A: Return error, client can show error in application code
* Scenario B: Logged in user to `AuthProvider B` account
* Scenario C: Create new account for `AuthProvider A`

**Suggested Implementation:**

Provide option `SSO_AUTO_LINK_PROVIDER_KEYS`, same format as `AUTH_RECORD_KEYS`
default is `email`. Can only set `email` or empty in portal.

* `SSO_AUTO_LINK_PROVIDER_KEYS` is `email` => Scenario B
* `SSO_AUTO_LINK_PROVIDER_KEYS` is empty, default behavior => Scenario A
* `SSO_AUTO_LINK_PROVIDER_KEYS` is empty, remove email from `AUTH_RECORD_KEYS` or
  remove email by `sso_process_userinfo` => Scenario C

As Scenario C is not a normal flow, so need adding code for customization

# Changes on SDK

## JS
All function are under `skygear.auth`

- `loginOAuthProviderWithPopup(providerID, options)` and `loginOAuthProviderWithRedirect(providerID, options)`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
  - `options`
    - scope - Override scope if set in portal
    - callbackURL - The URL that skygear will redirect after authorization flow.
  - This function returns a skygear user, and an access token of the service.

```js
  skygear.auth.loginOAuthProviderWithPopup('facebook', {
    scope: []
  }).then(function(skygearUser) {

  }).catch(function(error) {

  });

  skygear.auth.loginOAuthProviderWithRedirect('facebook', {
    scope: [],
    callbackURL: 'https://app.example.com/signup'
  });

  skygear.auth.getLoginRedirectResult().then(function(skygearUser) {

  }).catch(function(error) {

  });
```

- `loginOAuthProviderWithAcessToken(providerID, accessToken)`
  - `accessToken` - Client calls this API if it already has an access token,
    skygear will try to login directly instead of going through the OAuth
    flow.

```js
skygear.auth.loginOAuthProviderWithAcessToken('com.facebook', {
  scope: []
}).then(function(skygearUser) {

}).catch(function(error) {

});
```

- `linkOAuthProviderWithPopup(providerID, options)` and `linkOAuthProviderWithRedirect(providerID, options)`
  - Add a new auth provider to the user by going through the auth flow
  - This API requires user to be logged in already, return error otherwise
  - `providerID` - A string that identify the login provider
  - `options`
    - scope
    - callbackURL - The URL that skygear will redirect after authorization flow.
  - This function returns a skygear user, and an access token of the new
    service.

```js
  skygear.auth.linkOAuthProviderWithPopup('facebook', {
    scope: []
  }).then(function(skygearUser) {

  }).catch(function(error) {

  });

  skygear.auth.linkOAuthProviderWithRedirect('facebook', {
    scope: [],
    callbackURL: 'https://app.example.com/signup'
  });

  skygear.auth.getLinkRedirectResult().then(function(skygearUser) {

  }).catch(function(error) {

  });
```

- `unlinkOAuthProvider(providerID)`

```js
  skygear.auth.unlinkOAuthProvider.then(function() {

  }).catch(function(error) {

  });
```

- `linkOAuthProviderWithAcessToken(providerID, accessToken)`
  - `accessToken` - Client calls this API if it already has an access token,
    skygear will try to login directly instead of going through the OAuth
    flow.

```js
skygear.auth.linkOAuthProviderWithAcessToken('facebook', {
  scope: []
}).then(function(skygearUser) {

}).catch(function(error) {

});
```

- `getOAuthTokens(providerID)`
  - Calls skygear-server `user:oauth_tokens`, `user:set_oauth_token`
  - Return a promise of authResult

```js
  skygear.auth.getOAuthTokens('com.example').then(function(authResult) {
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
```

## iOS

- `-[SKYContainer.auth loginOAuthProvider:(NSString*)providerID,
  options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Create or login a new skygear user, associated with the provider
  - `providerID` - A string that identify the login provider
    - We will provide `com.facebook`, `com.google`
  - `options`
    - scope
    - scheme - For redirect after authorization flow
  - This function returns a skygear user, and an access token of the service,
    via a delegate.
- `-[SKYContainer.auth loginOAuthProvider:(NSString*)providerID,
  accessToken:(NSString*)accessToken completion:(void(^)(NSError*,
  SKYUser*))]`
  - `accessToken` - Client calls this API if it already has an access token,
    skygear will try to login directly instead of going through the OAuth
    flow.
- `-[SKYContainer.auth linkOAuthProvider:(NSString*)providerID
  options:(NSDictionary*)options completion:(void(^)(NSError*, SKYUser*))]`
  - Add a new auth provider to the user by going through the auth flow
  - `providerID` - A string that identify the login provider
  - `options`
    - scope
    - scheme - For redirect after authorization flow
  - This function returns a skygear user, and an access token of the new
    service, via delegate.
- `-[SKYContainer.auth linkOAuthProvider:(NSString*)providerID,
  accessToken:(NSString*)accessToken completion:(void(^)(NSError*,
  SKYUser*))]`
  - `accessToken` - Client calls this API if it already has an access token,
    skygear will try to login directly instead of going through the OAuth
    flow.
- `-[SKYContainer.auth unlinkOAuthProvider:(NSString*)providerID completion:(void(^)(NSError*, SKYUser*))]`
- `-[SKYContainer.auth getOAuthTokensWithCompletion:(void(^)(NSError*,
  NSDictionary*))]`
  - Return all AuthResult

        [container.auth getOAuthTokensWithCompletion:^(NSDictionary *authResult){
        //tokens['com.facebook'] is FB's access token }];

- `-[SKYContainer.auth getOAuthTokenWithOAuthProvider:(NSString*)providerID,
  completion:(void(^)(NSError*, NSDictionary*))]`

## Android

- `container.auth().loginOAuthProvider(providerID, options, new
  OAuthResponseHandler())`
- `container.auth().loginOAuthProviderWithAccessToken(providerID, accessToken, new
  OAuthResponseHandler())`
- `container.auth().linkOAuthProvider(providerID, options, new
  OAuthResponseHandler())`
- `container.auth().linkOAuthProviderWithAccessToken(providerID, accessToken, new
  OAuthResponseHandler())`
- `container.auth().unlinkOAuthProvider(providerID, new
  OAuthResponseHandler())`
- `container.auth().getOAuthToken(providerID, new
  OAuthResponseHandler())`

OAuthResponseHandler Interface

```
OAuthResponseHandler.onAuthFails(Error error);
OAuthResponseHandler.onAuthSuccess(SKYUser user);
```

# Changes on API at skygear-server

- New handler `sso:oauth:login` for plugin, master key required
    - login user only if user exists
- New handler `sso:oauth:signup` for plugin, master key required
    - create new user with provided auth data and profile
- New handler `sso:oauth:link` for plugin, master key required
    - link user with provided auth data and user id
- New handler `sso:oauth:unlink` for plugin, master key required
    - unlink user with provider name and user id

# Changes on Portal

Add SSO section, for each predefined provider:
- checkbox for `SSO_{PROVIDER}_ENABLED`
- input field for `SSO_{PROVIDER}_CLIENT_ID`
- input field for `SSO_{PROVIDER}_CLIENT_SECRET`
- input field for `SSO_{PROVIDER}_SCOPE`
    - comma separated
    - Could be checkbox list based on provider, for example:
        - facebook: email, public_profile, user_likes ...
        - google: https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile ...

# Changes on Plugin

- New lambda `/sso/{provider}/login_auth_url`
    - auth url for login flow
- New lambda `/sso/{provider}/link_auth_url`
    - auth url for link flow (user_required)
- New handler `/sso/{provider}/auth_handler`
    - called by 3rd provider, determine login or link by state which generate in login_auth_url or link_auth_url
- New lambda `/sso/{provider}/login`
    - handle access token api for login
- New lambda `/sso/{provider}/link`
    - handle access token api for link (user_required)
- New lambda `/sso/{provider}/unlink`
    - unlink provider (user_required)
- New lambda `sso/config`
    - return `{"authorized_urls": {array of authorized urls}}`
    - used by js sdk to post message among different window
- New lambda `sso/provider_profiles`
    - return object which key is provider name, value is `profile` object
    - use case: Allow user to determine connected provider and get the profile object


## Environment variables

- `SSO_STATE_JWT_SECRET`
    - JWT secret for encoding the state data in auth_url, use master key if empty
- `SSO_AUTO_LINK_PROVIDER_KEYS`
    - same format as `AUTH_RECORD_KEYS`, if it is set will auto link user with the provided auth records key
- `SSO_ALLOWED_CALLBACK_URLS`
    - if set, only whitelist callback urls could be used after authorization flow
- `SSO_{PROVIDER}_ENABLED`
    - boolean to determine if provider is enabled
- `SSO_{PROVIDER}_CLIENT_ID`
    - provider client id
- `SSO_{PROVIDER}_CLIENT_SECRET`
    - provider client secret
- `SSO_{PROVIDER}_SCOPE`
    - default scope if sdk has not provided

## Implementation

### Pseudo code of AuthProvider

``` python
class GoogleOAuthProvider(BaseOAuthProvider):
    name = 'google'

    @property
    def auth_base_url(self):
        return "https://accounts.google.com/o/oauth2/v2/auth"

    def auth_url(self, scope, state, options):
        options['access_type'] = 'offline'
        options['prompt'] = 'select_account'
        return super().auth_url(scope, state, options)

    @property
    def access_token_base_url(self):
        return "https://www.googleapis.com/oauth2/v4/token"

    def userinfo_url(self):
        return "https://www.googleapis.com/oauth2/v1/userinfo"



class BaseOAuthProvider:
    name = 'sso' # use to parse envvar and route
    client_id = None
    client_secret = None
    default_scope = ''


    def __init__(self, settings=None, profile_response_customizer=None,
                 duplicate_user_handler=None, auto_link_keys=[],
                 allowed_redirect_urls=[],
                 process_userinfo_hook=None):
        env_name = self.name.upper()
        """
        init property from environment variables
        """

    @property
    def auth_base_url(self):
        raise NotImplementedError('Missing auth base url')

    def auth_url(self, scope, state, options):
        if not self.client_id:
            raise SkygearException('Missing client id',
                                   skyerror.InvalidArgument)
        query = urlencode({
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.generate_redirect_uri(),
            'state': encode_state(state),
            'scope': ','.join(scope) if scope else self.default_scope,
            **options
        })
        return self.auth_base_url + "?" + query

    @property
    def access_token_base_url(self):
        raise NotImplementedError('Missing access token base url')

    def access_token_url(self):
        return self.access_token_base_url

    def userinfo_url(self):
        raise NotImplementedError('Missing userinfo url')

    """
    hock for customizations
    """
    def process_access_token_response(self, response_data):
        return response_data

    def process_refresh_token_response(self, response_data):
        return response_data

    def process_protected_request(self, url, headers, data):
        return url, headers, data

```

**Sign in with limited capability devices flow**

Refs: [
OAuth 2.0 for TV and Limited-Input Device Applications](https://accounts.google.com/o/oauth2/device/code)

**Need providing hook to allow customizations for non compliant providers**

Refs: [requests-oauthlib](https://github.com/requests/requests-oauthlib)

- process_access_token_response
- process_refresh_token_response
- process_protected_request
- process_userinfo

### Customization

```py
@sso_process_userinfo('facebook')
def handle_facebook_profile_response(response):
    return {
      'username': response.get('username'),
      'email': response.get('email'),
      'firstname': response.get('first_name'),
      'lastname': response.get('last_name')
    }

@sso_process_userinfo('google')
def handle_google_profile_response(response):
    return {
      'username': response.get('username'),
      'email': response.get('email'),
      'firstname': response.get('given_name'),
      'lastname': response.get('family_name')
    }
```

## APIs

### APIs for auth flow

- New lambda `sso/{provider}/login_auth_url` and `sso/{provider}/link_auth_url`
  - Accepts a provider id and options
  - Return an url for auth
  - Example pseudo return value

        https://www.facebook.com/v2.9/dialog/oauth?
        client_id={app-id}
        &redirect_uri=http%3A%2F%2Fskygear.dev%2Foauth%2Fhandle_code%3Fprovider%3Dcom.facebook%26user_id%3D123
        &state={jwt encoded state}

- New lambda `sso/{provider}/auth_handler`
  - A handler that accepts code from 3rd party service
  - Exchange code with access token
  - Create or link user if needed
  - Plugin will call skygear-server `sso:oauth:login`, `sso:oauth:signup` or `sso:oauth:link` to login or link user
  - Pass the user back to client
  - Redirect user to provided callback_url with base64 encoded result, example:
        https://app.myapp.com/?results=eyJyZXN1bHQiOiAiT0sifQ%3D%3D#

- New lambda `sso/{provider}/login` and `sso/{provider}/link`
  - Accepts access token
  - login or link user
  - Return the user

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

New `_sso_oauth` table managed by skygear-server

- user_id (text): user reference
- provider (text): provider name, e.g. google, facebook
- principle_id (text): 3rd party provider user id to identify user
- token_response (jsonb):
    - in oauth flow, the token exchange response will store here.
    So it will contain access_token, expires_in, token_type, refresh_token
    (optional) which depends on 3rd response.
    - in login with access token case (get token by 3 party SDK), token_response
    will only contain access_token
- profile (jsonb): raw profile object from 3 party SDK
- _created_at (timestamp)
- _updated_at (timestamp)

# Others Supplement Information

## Login flow

JS, iOS and Android should follow this flow:

### When using 3rd party client

1. Call 3rd party client
2. When user is authed, get the access_token
3. Pass access_token to `sso/{provider}/login` or `sso/{provider}/link`, to receive skygear user
  - Plugin behaviour depends on `SSO_AUTO_LINK_PROVIDER_KEYS`
4. Return user and access_token

![OAuth flow](./3rd_party_sdk_flow.png)

#### When using OAuth flow

1. Ask for a url to display via `sso/{provider}/login_auth_url` or `sso/{provider}/link_auth_url`
2. Show the url to user, either popup or redirect
3. After user login, the webpage should be redirected to plugin with a code
4. Plugin exchanges access token with code (`sso/{provider}/auth_handler`)
  - Determine signup or link from the state data which is generated by `login_auth_url` or `link_auth_url`
  - Behaviour depends on `SSO_AUTO_LINK_PROVIDER_KEYS`
5. Plugin creates or logins a user
6. Pass the user back to client side

![OAuth flow](./oauth_flow.png)

### For devices with limited capability

1. Fetch code and URL from Google / Facebook
2. Return the above data to the developer, expect the URL and should to be shown to user
3. Constantly poll Google / Facebook for auth result
  - With timeout
4. When access_token is received via polling, send it to skygear-server `sso/{provider}/login` or `sso/{provider}/link`
  - Plugin behaviour depends on `SSO_AUTO_LINK_PROVIDER_KEYS`
5. Pass the user from skygear user and `access_token` back to user
