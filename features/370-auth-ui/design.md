# Auth UI

## Background

Auth UI is a web application in Auth Gear. It aims to become a OpenID Provider.

## Auth Gear acting as OP

After the introduction of Auth UI, Auth Gear acts as an OpenID Provider (OP). API Client is now treated as Relying Party (RP).

Authorization in the context of OpenID Connect is the authorized scopes the user has granted to the RP. Only the value `openid` is officially defined. In the context of Skygear Auth, possible values of scope include `email` and `phone_number`. They correspond to the value of the login ID. If the `email` scope is granted and the identity the user is using does have the `email` claim, then the value is included in the UserInfo Response.

Auth Gear does not support Authorization at the moment. To be backward compatible, existing access tokens can access Data without any restriction. That means the user can change password, list sessions of **ALL** API clients, etc, via Auth Gear. The new access tokens issued by Auth Gear are intended to be consumed in the same fashion so the new and the old behave the same.

In the future Auth Gear can act as an OP for another Skygear App. At that moment Authorization must be introduced. Existing API clients are considered as first party and have the largest scopes. The RP Skygear App must register itself as a new kind of API client with the OP Skygear App. This is analogous to using access token issued by Google cannot access Google API to change Google account password unless the user authorize the corresponding scope.

## Domain

Auth Gear is served in its own domain. It also also be served in a designated custom domain.

### Default domain

If the app is using default domain, then Auth Gear is served at `https://accounts.<appname>.skygearapp.com`. Note that this domain format may conflict with deployment version. Reserved label has higher precedence than deployment version. The choice of `accounts` is borrowed from some other internet services.

### Custom domain

If the app is using custom domain, then Auth Gear is served at the developer's wish.

### Within the same domain of the app

Auth Gear is never be served in the app domain.

## Logout

See [Revoking sessions](/features/202-session-management/design.md#revoking-sessions).

## Page templates

All pages served by Auth UI are rendered with Go standard library package [html/template](https://golang.org/pkg/html/template/).
This is also the package we use to render HTML email template. So the developer only needs to learn the syntax once.

The content of the template is mainly HTML with some CSS.
It also contains some JavaScript to add some extra functionalities such as dynamically checking password requirements and toggling of password visibility.
All pages must be function properly even without JavaScript.

### Customization of page templates

The developer can customize the pages at 2 levels.
They can keep using the builtin templates and customize the theme.
Or they can replace the builtin ones with their own ones.

#### Customizing the theme with CSS

By studying the UI design of Auth UI, a few class names can generalized:

- `.primary-txt`: The primary text.
- `.secondary-txt`: The secondary text.
- `.primary-btn`: The primary button.
- `.secondary-btn`: The secondary button.
- `.anchor`: The anchor.
- `.text-input`: The text input.

There are a few CSS pseudo classes that are applicable to the UI elements.

- `:link`: Unvisited links.
- `:visited`: Visited links.
- `:hover`: Mouse hover state.
- `:active`: Button being clicked.

Buttons also have two variants.
The primary button has background color while the secondary one has border.

So the following CSS properties should be able to customize.

- `color`
- `background-color`
- `border*`

To customize all combinations, the developer can provide the CSS directly.
The developer is strongly recommended to write CSS covering only
the above mentioned classes, pseudo classes and properties.
There is no validation to enforce this restriction.

#### Customizing with own templates

The developer can also provide their own templates via [the existing template mechanism](../251-templates/index.md).

## The Authorization Endpoint

The Authorization Endpoint `/authorize` allows the user to authenticate with configured authentication methods. It handles MFA challenge during authentication. If the user does not have an account yet, the user can sign up directly.

### The authorization page

The authorization page is the landing page of the authorize endpoint. It lists out the configured IdPs. It shows a text field for login ID. The login ID field is either a plain text input or a phone number input, depending on the type of the first login ID key.

```
|---------------------------|
| Login with Google         |
|---------------------------|
| Login with Facebook       |
|---------------------------|

              Or

|--------------------------------------|  |----------|
| Enter in your email or username here |  | Continue |
|--------------------------------------|  |----------|

Login with a phone number instead.
```

If the user selects an IdP, the user is redirected to the authorization endpoint of that IdP. If the user continues with a login ID, the user is directed to the password page.

Separating the login ID and the password into two pages allow future improvements, such as [Open ID Provider Issuer Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery). For example, the user can type in their Google account name and then be redirected to the authorization endpoint of Google.

### The signup page

The signup page displays the first login ID key default. Other login ID keys are available to choose.

```
Sign up with email
|--------------------------|  |----------|
| Enter in your email here |  | Continue |
|--------------------------|  |----------|

Sign up with phone instead.
Sign up with username instead.
```

### The signup password page

The signup password page displays a visibility toggleable password field with password requirements.

```
|------------------------|  |----------|
| Create a password here |  | Continue |
|------------------------|  |----------|

- [ ] At least one digit
- [ ] At least one uppercase English character
- [ ] At least one lowercase English character
- [ ] At least one symbols ~`!@#$%^&*()-_=+[{]}\|;:'",<.>/?
- [ ] At least 8 characters long
```

## The settings endpoint

The settings endpoint `/settings` allows the user to manage their account. Features include but not limited to:

- Update metadata
- Change password
- Configure MFA
- Add / Update / remove login ID
- Manage identities
- Manage sessions

## The verification endpoint

The verification endpoint `/verify` allows the user to verify their login ID. This page requires authenticated user. Unauthenticated access is redirected to the authorization page. Verification is not enforced by the authentication flow. For example, if auto send verification email is enabled, the email is sent behind the scene and the user is redirected to the application immediately after authentication success.

The verification email sent by Auth Gear includes this verification endpoint. The implication is that if the user has not logged in at Auth UI, they have to authenticate again to verify.

## Omitted features

Auth UI does not support authenticate with Custom Token.

## Future improvements

### Customizing the signup flow or the authentication flow

Some customization the developer may want to make

- Add inline extra fields in the signup page to fill in metadata
- Add custom pages before the signup page to fill in metadata
- Redirect to an external form page before the signup page and continue to the signup page with metadata
- Add custom pages after authentication, and finally redirect the user back to the application.
- Redirect to an external page after authentication, the external page redirects back to Auth UI, and finally redirect the user back to the application.

Introducing the concept of [authentication flow](https://www.keycloak.org/docs/6.0/server_admin/#_authentication-flows) may fulfill some of the above use cases.

## OpenID Provider conformance

Some of the terms used in this session are defined in [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html#Terminology).

Auth UI implements the [Authorization Code Flow](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth) with [PKCE](https://tools.ietf.org/html/rfc7636)

### Authentication Request

The following sessions list out the request parameters and their difference from the spec.

#### scope

The value must be `openid`.

#### response_type

The value must be `code` because the implementation only supports Authorization Code Flow.

#### client_id

The value must be a valid Skygear API Client Key.

#### redirect_uri

No difference from the spec.

#### state

No difference from the spec.

#### nonce

No difference from the spec.

#### display

It is not supported. The only supported display mode is `page`.

#### prompt

It is not supported.

#### max_age

It is not supported.

#### ui_locales

No difference from the spec.

#### id_token_hint

It is not supported.

#### login_hint

It is not supported.

#### acr_values

It is not supported.

#### code_challenge_method

Only `S256` is supported. `plain` is not supported. The reason is the existing implementation of SSO is using `S256` already. Since it defaults to `plain`, it is required and the value must be `S256`.

#### code_challenge

No difference from the spec.

#### Example of valid Authentication Request

`response_type=code&scope=openid&client_id=API_KEY&redirect_uri=REDIRECT_URI&code_challenge_method=S256&code_challenge=CODE_CHALLENGE&ui_locales=en`

### Token Request

The following sessions list out the request parameters and their difference from the spec.

#### grant_type

Either `authorization_code` or `refresh_token`

#### code

No difference from the spec.

#### redirect_uri

No difference from the spec.

#### client_id

It is always required. The value must be a valid Skygear API Key.

#### code_verifier

No difference from the spec.

#### Example of valid Token Request

`grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=REDIRECT_URI&client_id=API_KEY&code_verifier=CODE_VERIFIER`

### Token Response

#### id_token

It is always absent. It is the JWT token that we may want to implement in the future.

#### token_type

It is always the value `bearer`.

#### access_token

No difference from the spec.

#### expires_in

No difference from the spec.

#### refresh_token

No difference from the spec.

#### scope

It is always absent.

#### Example of Token Response

```json
{
  "token_type": "bearer",
  "access_token": "access.token",
  "refresh_token": "refresh.token"
}
```

## Security considerations

### Being embedded in an HTML iframe

The HTTP header `Content-Security-Policy` has a directive `frame-ancestors` to specify which parent may embed a page with `iframe`.

All pages served by Auth UI have `Content-Security-Policy: frame-ancestors 'self'` by default. The developer can configure the value of this header to whitelist additional domains or add any another directives.

## Appendix

- [Implementation Details](./implementation-details.md)
- [SDK](./sdk.md)
- [Configuration](./configuration.md)
