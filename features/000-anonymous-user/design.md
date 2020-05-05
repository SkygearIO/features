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

To signup as anonymous user:
- Client SDK generates an asymmetric key-pair and store it securely.
- Client SDK self-signs a JWT using the key-pair, for example:
    ```
    eyJhbGciOiJSUzI1NiIsInR5cCI6InZuZC5za3lnZWFyLmF1dGguYW5vbnltb3VzLXRva2VuIiwiaWF0IjoxNTg4NjY1MDUzLCJleHAiOjE1ODg2NjUzNTMsImp3ayI6eyJrdHkiOiJSU0EiLCJraWQiOiIzMTUyREM5MC0wM0UzLTRCODYtQTIyNi1BNjFCOUIwNEYyMTIiLCJlIjoiQVFBQiIsInVzZSI6InNpZyIsImFsZyI6IlJTMjU2IiwibiI6Im5pWXp0c0NzT2UyV1BQSmZwWE15NTJqYWhwYzRqZlR2YkU2SnQ3UFd5aTdMUUFqUDd6cnB1MGxHYjNycE01eUNmb21aY2ZwQ2ZJV0dNOHB2QS10OUpRIn19.eyJhY3Rpb24iOiJzaWdudXAifQ.e1K-SDPi0Exd49z3j7Lm9EhORZogLm2LOP0N8RfWff9k3xa1QNetmZppOT3OvjYKsPMYxyJ_XC1GJm68ZjgRDw
    ```
- Client SDK creates an authorization request using the JWT, for example:
    ```
    https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=app://on_authorized&login_hint=https%3A%2F%2Fauth.skygear.io%2Flogin_hint%3Ftype%3Danonymous%26jwt%3DeyJhbGciOiJSUzI1Nxxx
    ```
- Client SDK redirects users to the authorization endpoint.
- Server validates the self-signed JWT in login hint parameter, and validate
  the action in JWT payload (signup).
- Server creates a new user with anonymous identity, using the specified
  public key.
- Server rediercts to the redirect URI with an authorization code.

To authenticate as anonymous user:
- Client SDK retrieves the key-pair from local secure storage.
- Client SDK requests a challenge from server, which can be used once and has
  limited validity period.
- Client SDK self-signs a JWT with the challenge, for example:
    ```
    eyJhbGciOiJSUzI1NiIsInR5cCI6InZuZC5za3lnZWFyLmF1dGguYW5vbnltb3VzLXRva2VuIiwiaWF0IjoxNTg4NjY1MDUzLCJleHAiOjE1ODg2NjUzNTMsImtpZCI6IjMxNTJEQzkwLTAzRTMtNEI4Ni1BMjI2LUE2MUI5QjA0RjIxMiJ9.eyJjaGFsbGVuZ2UiOiJiRlpPNGxPY0kvRHpuS2xPUU1zNXkrbnl6dCs3R1B1dyIsImFjdGlvbiI6ImxvZ2luIn0.gJfOJ6IPy-LeDEDqnYWjwfmdCUb_q2URY_E3QAP2D4e4qC_bBsq5PQbk39Wlih4eY6EOM6k-1TQ4G8T8CYZt0Q
    ```
- Client SDK creates an authorization request using the JWT, for example:
    ```
    https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=app://on_authorized&login_hint=https%3A%2F%2Fauth.skygear.io%2Flogin_hint%3Ftype%3Danonymous%26jwt%3DeyJhbGciOiJSUzI1Nxxx
    ```
- Client SDK redirects users to the authorization endpoint.
- Server validates the challenge.
- Server lookup identity using the provided key ID.
- Server validates the self-signed JWT in login hint parameter, and validate
  the action in JWT payload (login).
- Server has authenticated anonymous user.
- Server rediercts to the redirect URI with an authorization code.

### Browser-less flow

Since anonymous user signup & authentication does not requires user
interaction, some applications may want to avoid flashing a browser for
authentication purpose.

To acheive this, application may specifies a special endpoint as the redirect
URI in authorization request, which would intercept the authorization code to
perform post-authentication actions.

For example:
1. Client fetches `https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=https%3A%2F%2Fapp.test%2Fauth_callback&login_hint=xxx`
2. Server redirects to `https://app.test/auth_callback?code=xxx`
3. Auth callback endpoint exchanges the code, creates session in cookie, and
   writes a indicator response.
4. Client recieves the indicator response from the fetch in step 1, and
   know that user has been authenticated.

For convenience, such an endpoint would be provided and integrated with client
SDK. For example:
1. Suppose client SDK knows key ID is `E01D13A3-2A80-4B3D-8184-DD190D5D80FE`
2. Client SDK fetches `https://accounts.skygear.test/oauth2/authorize?xxx&redirect_uri=https%3A%2F%2Faccounts.skygear.test%2Futils%2Fauth-callback%2FE01D13A3-2A80-4B3D-8184-DD190D5D80FE&login_hint=xxx`
3. Server redirects to `https://accounts.skygear.test/utils/auth-callback/E01D13A3-2A80-4B3D-8184-DD190D5D80FE`
4. Auth callback endpoints would load the public using the key ID, encrypt the
   authorization code using the key, and write the encrypted JWE in the
   response.
5. Client SDK received the encrypted JWE from the fetch in step 2, decrypts
   using the private key, and continue OAuth flow using the authorization code.

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

### Settings Page

It is quite meaningless to allow access to settings page for anonymous users,
since most if not all pages cannot be used.

Therefore, for anonymous users, settings page would be disabled. Instead, user
would be prompt to 'signup' (i.e. promote), and have a link redirecting into
the promotion flow.
