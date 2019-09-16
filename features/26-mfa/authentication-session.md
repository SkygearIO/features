# Authentication Session

## Authentication Session

Before MFA is introduced, the authentication session involves only one step which is
the identity provider including password, OAuth and Custom Token.

Now MFA is introduced, the authentication session may involve multiple steps.

Currently there are 2 defined steps.

- `identity`
- `mfa`

The authentication session is stored in a JWT token.

Such token is called the authentication session token.

The authentication session is structurally similar to the session.

When the authentication session is created, the required steps are derived from the tenant configuration and being stored.

As the authentication session proceeds, it is updated. When the authentication session is finished, it is converted to a session.

## New fields on Session

- `authenticator_id`: The id of the authenticator.
- `authenticator_type`: `totp`, `oob`, `recovery_code` or `bearer_token`
- `authenticator_oob_channel`: `email` or `sms`

## Extra fields on Authentication Session

- `required_steps`: An array of required steps to finish the authentication session, e.g. `["identity", "mfa"]`
- `finished_steps`: An array of finished steps, e.g. `["identity"]`

When required steps are equal to the finished steps, the authentication session is finished and a session must be returned.

Otherwise, the authentication session error must be returned with an updated token and the next required step.

## Authentication Session Error

The authentication session error is an error that includes the authentication session token and the next step.

```json
{
  "name": "AuthenticationSession",
  "info": {
    "token": "xxx",
    "step": "mfa"
  }
}
```

If the authentication session is invalid (expired), the following error is returned.

```json
{
  "name": "InvalidAuthenticationSession"
}
```

## Authentication Session Participating Endpoint

An authentication session participating endpoint is endpoint that may return authentication session error.

- POST /signup
- POST /login
- POST /sso/<provider>/auth_url
- POST /sso/custom_token/login

These endpoints initiate an authentication session.

- POST /mfa/totp/new
- POST /mfa/totp/activate
- POST /mfa/oob/new
- POST /mfa/oob/activate

These endpoints accept authentication session token only when the user has no authenticators. When the user has no authenticators, they must be offered a way to add the very first authenticator. When the user has at least one authenticator, then these endpoints only accept access token. This prevents an attacker who knows the first factor (such as password credentials) to register arbitrary authenticators.

- GET /mfa/authenticators
- POST /mfa/totp/authenticate
- POST /mfa/oob/trigger
- POST /mfa/oob/authenticate
- POST /mfa/recovery_code/authenticate
- POST /mfa/bearer_token/authenticate

By definition, they accept authentication session token.

## Interaction between Client SDK and Authentication Session

The client SDK must ensure the presence of (access token and refresh token) and authentication session are mutually exclusive.

If the client SDK encounters `AuthenticationSession` error, it must decode the authentication session and store it in memory and local storage.

If the client SDK encounters `InvalidAuthenticationSession` error, it must clear the authentication session.

If the client SDK stores the session, it must clear the authentication session.

If the client SDK stores the authentication session, it must clear the session.
