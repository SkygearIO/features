# Web User Interface

## Overview

Skygear Auth is an OpenID Connect Provider (OP). The Relying Party redirects the user to the authorization endpoint, where the user can sign up, sign in, perform multi-factor authentication, reset forgotten password and authorize access. At the settings endpoint the user can manage their account.

## Page Templates

All page templates are rendered with Go standard library package [html/template](https://golang.org/pkg/html/template/). This is also the package being used to render HTML email template. The developer need not to learn anything new.

## Traditional form submission and JavaScript

The interaction between Skygear Auth and the user is traditional form submission. JavaScript is only required to add extra functionalities such as dynamically checking password requirements and toggling of password visibility.

## Customization of page templates

The developer can customize the pages at 2 levels. The can keep using the default templates and only customize the theme. Or the developer can replace the default templates with their own templates.

### Customizing the theme with CSS

The developer can specify a snippet of CSS to be inlined into every pages. The developer is strongly recommended to write CSS covering only documented CSS classes, CSS pseudo classes and CSS properties.

CSS classes:

- `.primary-txt`: The primary text.
- `.secondary-txt`: The secondary text.
- `.primary-btn`: The primary button.
- `.secondary-btn`: The secondary button.
- `.anchor`: The anchor.
- `.text-input`: The text input.

CSS pseudo classes:

- `:link`: Unvisited links.
- `:visited`: Visited links.
- `:hover`: Mouse hover state.
- `:active`: Button being clicked.

CSS properties:

- `color`
- `background-color`
- `border*`

### Customizing with own templates

The developer can also provide their own templates via [the existing template mechanism](../251-templates/index.md).

## The authorization endpoint

The authorization endpoint `/oauth2/authorize` is the entry point of OIDC. The user can sign up, sign in, perform multi-factor authentication, reset forgotten password and authorize access.

## The root endpoint

The root endpoint `/` is unrelated to OIDC. If the request is authenticated, the user is redirected to the settings endpoint. Otherwise the user is prompted to authenticate.

### The sign in page

The sign in page is the landing page of the authorization endpoint. It lists out the configured IdPs. It shows a text field for login ID. The login ID field is either a plain text input or a phone number input, depending on the type of the first login ID key.

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

If the user choose to sign in with an IdP, the user is redirected to the authorization endpoint of that IdP. If the user continues with a login ID, the user is directed to the password page.

Separating the login ID and the password into two pages allow future improvements, such as [Open ID Provider Issuer Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery). For example, the user can type in their Google account name and then be redirected to the authorization endpoint of Google.

### The sign in password page

The sign in password page displays a visibility toggleable password field *WITHOUT* password requirements.

```
|------------------------|  |----------|
| Create a password here |  | Continue |
|------------------------|  |----------|
```

### The sign up page

The sign up page displays the first login ID key default. Other login ID keys are available to choose.

```
Sign up with email
|--------------------------|  |----------|
| Enter in your email here |  | Continue |
|--------------------------|  |----------|

Sign up with phone instead.
Sign up with username instead.
```

### The sign up password page

The sign up password page displays a visibility toggleable password field with password requirements.

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

### The settings endpoint

The settings endpoint `/settings` allows the user to manage their account. Features include but not limited to:

- Manage sessions at Skygear Auth
- Manage OAuth authorizations
- Manage OAuth grants
- Update metadata
- Change password
- Configure multi-factor authentication
- Manage identities (e.g. login IDs and connections with external IdPs)

### The verification endpoint

The verification endpoint `/verify` allows the user to verify their login ID. This page requires authenticated user. Unauthenticated access is redirected to the root endpoint. Verification is not a strict requirement. For example, if auto send verification email is enabled, the email is sent behind the scene and the user is redirected to the application immediately after performing the Authorization Code Flow successfully.

## Future improvements

### Customizing the authentication experience

Some customizations the developer may want to make

- Add inline extra fields in the sign up page to fill in metadata
- Add custom pages before the sign up page to fill in metadata
- Redirect to an external form page before the sign up page and continue to the sign up page with metadata
- Add custom pages after authentication, and finally redirect the user back to the application
- Redirect to an external page after authentication, the external page redirects back to Skygear Auth, and finally redirect the user back to the application

An introduction of workflow may be required to support some of the above use cases.

## Security considerations

### The session cookie is SameSite=Lax by default

To make cookie visible in third-party context, the developer must set it to None.

### Derived frame-ancestors from redirect_uris

Skygear Auth derives frame-ancestors by looking at the redirect_uris of all registered clients. If the redirect_uri is `https`, then the domain is added to frame-ancestors. If the redirect_uri is `http` and the domain is loopback address or the domain ends with `localhost`, then the domain is also added to frame-ancestors.

## Configuration

```yaml
auth_ui:
  css: |
    .primary-btn {
      background-color: purple;
    }
```

- `css`: A snippet of CSS to be included in all pages. See [Customizing the theme with CSS](customizing-the-theme-with-css)
