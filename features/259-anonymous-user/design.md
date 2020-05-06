# Anonymous User

## Objective
- Allow users to signup without using a real identity (e.g. login ID, OAuth).
- Allow anonymous users to authenticate securely.
- Allow promoting anonymous users to normal users.

## Design

### Anonymous identity

A new identity type `anonymous` would be added. It is expected that users would
either have no anonymous identity, or have exactly one anonymous identity
without other types of identity.

Anonymous identity has fields:
- public key: the public key represented as a JWK.
- key ID: a random string (`^[-\w]{8,64}$`), used for efficient lookup.

### Authentication

> Note: following examples are using the same JWK:
> ```json
> {
>     "p": "1nhvE3YSzjw8x-xZjYRCSRMjEPIbeBzg9F9ESK7jlwc",
>     "kty": "RSA",
>     "q": "1FTtgLRv5cXPQ1CAjVx3aXP6Fdci1Keq59xEkAHWmss",
>     "d": "sGjh0qAHf2n8NhN8pSvNl7Ydy6vHqEiHXOpIfBAWQgU4Bq2sL6YvJOoB1xQcSLpEamukXZ5kSJ9x1XsM6Qt3PQ",
>     "e": "AQAB",
>     "use": "sig",
>     "kid": "08D7D576-85FD-4365-86A4-DBAD04690B59",
>     "qi": "LtPJ5n5A9ekQvKyr9C88elRI75LNxSXbdr0P29cG0H8",
>     "dp": "Wxp3nJ24aVDfRNGaTOoUujPd3nHpx0EFMelR-UoJNXs",
>     "alg": "RS256",
>     "dq": "lkMf7MREp_vLyJxwzRlR3EvaAJjGKm4ZkYoc7ziN0e8",
>     "n": "seLieeJhS9FMkXhAyhUVfBXn-NJZf-Z5gSqezS3GaffmIRjjdAH3vdB3n9YCjfi4WSW1ubESHCRjNsSe3iz4jQ"
> }
> ```

To signup as anonymous user:
- Client SDK generates an asymmetric key-pair with a random unique key ID
  (e.g. UUID) and store it securely.
- Client SDK self-signs a JWT using the key-pair, for example:
    ```
    eyJhbGciOiJSUzI1NiIsInR5cCI6InZuZC5za3lnZWFyLmF1dGguYW5vbnltb3VzLXJlcXVlc3QiLCJqd2siOnsia3R5IjoiUlNBIiwiZSI6IkFRQUIiLCJ1c2UiOiJzaWciLCJraWQiOiIwOEQ3RDU3Ni04NUZELTQzNjUtODZBNC1EQkFEMDQ2OTBCNTkiLCJhbGciOiJSUzI1NiIsIm4iOiJzZUxpZWVKaFM5Rk1rWGhBeWhVVmZCWG4tTkpaZi1aNWdTcWV6UzNHYWZmbUlSampkQUgzdmRCM245WUNqZmk0V1NXMXViRVNIQ1JqTnNTZTNpejRqUSJ9fQ.eyJpYXQiOjE1ODg3NTQ0MjEsImV4cCI6MTU4ODg1NDcyMSwiYWN0aW9uIjoiYXV0aCJ9.FT_SXGKxoErqU2SN8cRMbU9As7bd2TSlJVt_OZxDeBx4nIqAWPAjQtT_sjMCxzxA1hCd9lVIqZHvbbpQ0VHU1Q
    ```
- Client SDK creates an authorization request using the JWT, for example:
    ```
    https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=app://on_authorized&login_hint=https%3A%2F%2Fauth.skygear.io%2Flogin_hint%3Ftype%3Danonymous%26jwt%3DeyJhbGciOiJSUzI1Nxxx
    ```
- Client SDK redirects users to the authorization endpoint.
- Server validates the JWT, and the action in payload (auth).
- Since no anonymous identity with specified key ID exists, server creates a
  new user with anonymous identity, using the specified public key.
- Server redirects to the redirect URI with an authorization code.

To authenticate as anonymous user:
- Client SDK retrieves the key-pair from local secure storage.
- Client SDK requests a challenge from server, which can be used once and has
  limited validity period.
- Client SDK self-signs a JWT with the challenge, for example:
    ```
    eyJhbGciOiJSUzI1NiIsInR5cCI6InZuZC5za3lnZWFyLmF1dGguYW5vbnltb3VzLXJlcXVlc3QiLCJraWQiOiIwOEQ3RDU3Ni04NUZELTQzNjUtODZBNC1EQkFEMDQ2OTBCNTkifQ.eyJpYXQiOjE1ODg3NTQ0MjEsImV4cCI6MTU4ODg1NDcyMSwiY2hhbGxlbmdlIjoiRlg3SDZTNlM1VzY1VlpGRVE4VEhDM1dRREZOUUpRWEgiLCJhY3Rpb24iOiJhdXRoIn0.cgMwTDdZGYDVxD4cyKvos7tXqn-Fio-8M95qxjf5Bc-sK3uA6q_ZnCRLtPAoQJ3Ax0zZK4sBZ_ihXssw1J80lw
    ```
- Client SDK creates an authorization request using the JWT, for example:
    ```
    https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=app://on_authorized&login_hint=https%3A%2F%2Fauth.skygear.io%2Flogin_hint%3Ftype%3Danonymous%26jwt%3DeyJhbGciOiJSUzI1Nxxx
    ```
- Client SDK redirects users to the authorization endpoint.
- Server lookup identity using the provided key ID, and discover an existing
  anonymous identity.
- Server validates the challenge for logging in.
- Server validates the JWT, and the action in payload (auth).
- Server redirects to the redirect URI with an authorization code.

### Browser-less flow

Since anonymous user signup & authentication does not require user
interaction, native applications may want to avoid flashing a browser for
authentication purpose.

To acheive this, OAuth token endpoint would support a custom grant type
`urn:skygear-auth:params:oauth:grant-type:anonymous-request` using the
self-signed JWT as value. This endpoint would perform anonymous user
signup/login as specified, and return OAuth tokens directly.

Example token request URL:
```
https://accounts.skygear.test/oauth2/token?client_id=xxx&grant_type=urn%3Askygear-auth%3Aparams%3Aoauth%3Agrant-type%3Aanonymous&scope=openid%20offline_access&jwt=eyJhbGciOiJSUzI1NiIsInR5cxxxx
```

### Promotion

Anonymous users can be promoted to normal user by adding a new identity. When
an anonymous user is promoted:
1. A new non-anonymous identity is added.
2. The anonymous identity is deleted.
3. All existing session is deleted.
4. A new session is created using the new identity.

For example:
1. Client SDK creates authorization request with action = `promote`
2. Client SDK redirects to authorization endpoint.
3. Server redirects user to promotion endpoint, with same UI as signing up.
4. After promotion, server performs the actions described above, and redirect
   user to redirect URI with authorization code.
5. Client SDK continues the OAuth flow and uses the new session.

### Restrictions

Anonymous users have restrictions on actions they can perform:
- Cannot setup secondary authenticators (i.e. MFA)
- Cannot have other identities (only single anonymous identity is allowed)

### Settings Page

It is quite meaningless to allow access to settings page for anonymous users,
since most if not all pages cannot be used.

Therefore, for anonymous users, settings page would be disabled. Instead, user
would be prompt to 'signup' (i.e. promote), and have a link redirecting into
the promotion flow.
