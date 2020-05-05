# Background

Developers may want to enable user to login without using a password.

- User may login using credentials other than password, for example:
    - One-time-password
    - WebAuthn (TBC)
    - Biometric authentication protected key (TBC)
- User may login anonymously, without explicit credentials.
- For OTP passwordless authentication, user may receive OTP through:
    - Email
    - SMS

# Use cases

1. User login using email, and request an OTP to be sent to email
   for authentication.
2. User login using username, and use WebAuthn with security key for
   authentication.
3. User login with email and authenticated using password, and use
   WebAuthn for multi-factor authentication (e.g. GitHub)
4. User login with SSO, and use OTP for multi-factor authentication.
5. User login with key-pair protected by biometric-authentication.
6. User login anonymously, using implicit credentials.

# Design

## Refactor design of identity model

Currently, the identity model has a flaw: password identity is consists of
password and login ID. Under this model:
1. Each user can have multiple passwords, for each login ID.
2. Login ID is always associated with a password.

(2) means we cannot have login ID without password, as in passwordless
authentication. The team has discussed and suggested that (1) is not needed
at the moment.

To support different forms of authentication, the following model is
proposed:
- Each User can have multiple Identities and Authenticators.
    - Identity represents unique identifier referring to a user.
    - Authenticator represents authentication method of a user.
        - Authenticator type can be designated as either primary or secondary
          by developer.
        - Primary authenticators are main methods to authenticate identity.
            - Some primary authenticators are applicable to specific identity
              types only.
        - Secondary authenticators are additional authentication methods to
            ensure higher degree of confidence in user identity.
- There are types of Identity:
    - Login ID: consists of a login ID key (`email`, `username`, etc.) and 
                login ID (e.g. `user@example.com`).
    - OAuth: consists of provider ID (`{kind: google}`,
             `{kind: azureadv2, tenant: my-app}`, etc.) and external subject ID
             (e.g. `D71441BA-3628-412C-A1B3-95DFFFFB0120`).
    - WebAuthn: consists of user key ID, for resident key (TBD).
    - Anonymous: consists of key ID and public key.
- There are types of Authenticator:
    - Password: can be primary authenticator.
    - OAuth: can be primary authenticator.
        - Created implicitly for each OAuth identity.
        - Applicable to OAuth identity only.
    - WebAuthn: can be primary/secondary authenticator.
    - Anonymous: can be primary authenticator.
    - One-time password: can be primary/secondary authenticator.
        - For out-of-band OTP: must match `email` or `phone` claim of
          identity if used as primary authenticator.
    - Device token: can be secondary authenticator
        - Used as MFA bearer token.
        - Generated after secondary authentication, if user requested,
          according to configuration.
    - Recovery Code: can be secondary authenticator
        - Used for recovery for secondary authentication (i.e. MFA).
        - Always enabled.
        - Generated when the first secondary authenticator is setup for the
          user, according to configuration.
- Some authenticators require activation when setting up:
    - OTP:
        - Time-based: TOTP parameters are generated and given to client,
                      and a valid TOTP must be entered to activate it.
        - Out-of-band: A OTP is sent to the OOB channel, and the received
                       OTP must be entered to activate it.
    - WebAuthn: TBD.
- Developer can configure multiple authenticators:
    - At least one primary authenticators must be configured, and secondary
      authenticator is optional.
    - Authenticator types can be configured as either primary or secondary.
    - Authenticators has priorities, which determine the default authenticator
      in the UI.
    - During authentication, one of the configured primary authenticators is
      needed, and one of the configured secondary authenticators is needed.
    - For examples:
        - Simple password/SSO login:
            - primary: password/SSO.
            - no secondary.
        - Password/SSO with email/TOTP MFA:
            - primary: password/SSO.
            - secondary: OOB-OTP/TOTP/Recovery Code.
        - WebAuthn password-less with resident key:
            - primary: WebAuthn.
            - no secondary.
        - Email OTP passwordless/SSO:
            - primary: OOB-OTP/SSO.
            - no secondary.
        - GitHub:
            - primary: password.
            - secondary: OOB-OTP/TOTP/Recovery Code/WebAuthn.
- Developer can require authenticators to be set up.
    - A primary authenticator must be set up in the sign-up process.
    - Secondary authenticator is set up after authentication.
        - If secondary authentication is configured as 'required',
          and no secondary authenticator is set up, user must setup secondary
          authenticators before a session is created.
        - If secondary authentication is configured as 'if-requested'/'if-exists',
          user can setup secondary authenticators in Auth UI settings page.

## Authentication session

The current authentication session goes like this:
1. Authenticate Identity
2. Perform MFA/Setup MFA

Since selecting and authenticating the identity is separated under the new
model, there will be extra steps in the authentication session:
1. Select Identity
2. Perform Primary Authentication
    - If multiple primary authenticators is applicable for the selected
      identity, user is prompted to select one.
    - The first configured primary authenticator is default.
3. Perform Secondary Authentication (if configured)
    - If multiple secondary authenticators is set up for the user, user is
      prompted to select one.
    - The first configured secondary authenticator is default.
    - If secondary authentication is 'required', or 'if-exists' and user has
      secondary authenticator, user is required to perform secondary
      authentication.
    - If no secondary authenticators is configured:
        - If secondary authentication is 'required', user is prompted to
          setup a secondary authenticator.
        - If secondary authentication is 'if-exists'/'if-requested', this step is skipped.

For examples:
- Simple password login:
    1. Enter Login ID.
    2. Authenticate with password.
    3. Done.
- Password/SSO with email/TOTP MFA:
    1. Select Login ID or OAuth identity.
        - Login ID: enter email.
        - OAuth: redirect to OAuth provider and wait for return.
    2. Authenticate selected identity:
        - Login ID: authenticate with password.
        - OAuth: aftering returning, already authenticated by OAuth provider.
    3. Select secondary authentication method (Email OTP/TOTP)
        - Email OTP: send email with OTP and verify entered OTP.
        - TOTP: verify entered TOTP.
    4. Done.
- WebAuthn password-less:
    1. Enter Login ID.
    2. Authenticate with security key through WebAuthn.
    3. Done.
- WebAuthn resident key authentication with email/password fallback:
    1. Select Login ID or WebAuthn identity.
        - Login ID: enter email.
        - WebAuthn: request WebAuthn with resident key.
    2. Authenticate selected identity.
        - Login ID: select authenticator.
            - Password: authenticate with password.
            - WebAuthn: authenticate with security key.
        - WebAuthn: already authenticated using resident key.
    3. Done.
- Email OTP passwordless/SSO:
    1. Select Login ID or OAuth identity.
        - Login ID: enter email.
        - OAuth: redirect to OAuth provider and wait for return.
    2. Authenticate selected identity:
        - Login ID: send email with OTP and verify entered OTP.
        - OAuth: aftering returning, already authenticated by OAuth provider.
    3. Done.
- GitHub:
    1. Enter Login ID.
    2. Authenticate with password.
    3. Select secondary authentication method (WebAuthn/Recovery Code/Email OTP/TOTP)
        - Omitted for brevity.
    4. Done.

## OIDC

### `amr` claim

To indicate authenticator used in authentication, `amr` claim is used in OIDC
ID token.

`amr` claim is an array of string. It includes authentication method used:
- If secondary authentication is performed: `mfa` is included.
- If password authenticator is used: `pwd` is included.
- If any OTP (TOTP/OOB-OTP) is used: `otp` is included.
- If WebAuthn is used: `hwk` is included.

If no authentication method is to be included in `amr` claim, `amr` claim would
be omitted from the ID token.

### `acr` claim

If any secondary authenticator is performed, `acr` claim would be included in
ID token with value `http://schemas.openid.net/pape/policies/2007/06/multi-factor`.

To perform step-up authentication, developer can pass a `acr_values` of 
`http://schemas.openid.net/pape/policies/2007/06/multi-factor` to the
authorize endpoint.

### `login_hint` parameter

Developer can optionally pre-select the identity to use using `login_hint`
parameter. `login_hint` should be a URL of form
`https://auth.skygear.io/login_hint?<query params>`.

The following are recognized query parameters:
- `type`: Identity type
- `user_id`: User ID
- `email`: Email claim of the user
- `oauth_provider`: OAuth provider ID
- `oauth_sub`: Subject ID of OAuth provider
- `jwt`: JWT object

For examples:
- To login with email `user@example.com`:
    `https://auth.skygear.io/login_hint?type=login_id&email=user%40example.com`
- To login with Google OAuth provider:
    `https://auth.skygear.io/login_hint?oauth_provider=google`
- To signup/login as anonymous user:
    `https://auth.skygear.io/login_hint?type=anonymous&jwt=...`

Auth UI will try to select appropiate identities according to the provided
parameters. If exactly one identity is selected, Auth UI would proceed using
the selected identity. Otherwise, `login_hint` is ignored.

Unknown parameters are ignored, and invalid parameters are rejected.
However, if user is already logged in and the provided hint is not valid for
the current user, it will be ignored instead.

## Feature compatibility

### Auth API

Auth API will emulate old behavior according to configuration. However, some
configuration may be incompatibile with Auth API:
- Password is not configured as usable primary authenticator
- OTP is not configured as usable secondary authenticator

In these cases, Auth API will return a HTTP Forbidden error, explaining that
these API is disabled by configuration (`API is not usable as configured`).

### User verification

Activating OOB-OTP (e.g. email/SMS) requires verification of email/SMS. If
the OOB-OTP channel matches a login ID, the login ID could be considered
verified. However, for simplicity, this integration would not be implemented
at the moment. e.g. Activating a email OOB-OTP authenticator would not verify
the corresponding login ID.

