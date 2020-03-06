# Session

## Design

### Session Creation

Sessions can be created through Auth UI or Auth API.

When user is logged in using Auth UI, a new session would be created. A cookie
would be returned to client browser representing the newly created session.

User can also log in using Auth API. All APIs that authenticate the user (e.g.
login, signup, SSO login) requires a valid Client ID, and developer can
configure whether the Auth API returns a session cookie or OIDC tokens to the
client:

- If the client is configured to receive a session cookie:
    1. A new session is created.
    2. A cookie representing the created session is returned to client.
- If the client is configured to receive OIDC tokens:
    1. If there is no authorization from the user to the OIDC client,
       a new authorization granting full access would be implicitly created.
    2. A new offline grant is created from the authorization.
       This grant contains the OIDC refresh token.
    3. A new access token is created from the new grant.
    4. The refresh token, access token, and expiry time of access token is
       returned to client.

### Session Behaviors

#### Attributes

A session would have following attributes:
- session ID
- tenant ID
- user ID
- identity ID
- expiration time
- creation time
- last access time
- creation IP
- last access IP
- last access user agent
- extra information

Extra information are custom data sent by client every request in
`X-Skygear-Extra-Info` header:
- It is an JSON object containing following fields:
    - `device_name`: Device name
- It put in header as base-64 encoded JSON.
- Session would be updated with the provided value every session resolution.
- It can be set in client SDK and would be persisted locally across
  client restart.

These attributes would also exists in offline grants.

#### Persistence

Session and its attributes are persisted in in-memory storage (e.g. Redis) for
fast access.

#### Cookie

Session cookie stores an opaque token, referring to the session in server-side
storage.

- `Secure` flag is set, to ensure HTTPS is used. (can be disabled for
  development purpose).
- `HttpOnly` flag is set, to ensure the token cannot be read in JS.
- `SameSite` attribute is set to `Lax` by default. This can be configured by
  developer:
    - Setting to `None` is possible, but not recommended since it is not secure
      and vulnerable to CSRF.
    - Setting to `Strict` is possible, but not recommended since it may cause
      misbehavior to due missing session cookie in initial requests.
- `Domain` attribute is not set by default. This can be configured by developer:
    - If not set, the session cookie is only accessible by the auth domain.
      Sharing session across services is not possible. For example,
      `accounts.example.com` cannot share session with `forum.example.com`.
    - To share sessions across services, this attribute should be set to a
      common suffix of the service domains. For the previous example, a
      suitable suffix would be `example.com`.
- Developer can configured whether the cookie is a HTTP session cookie:
    - If it is configured as a HTTP session cookie, the cookie would be deleted
      from client side when browser session ends.
    - If it is configured as a HTTP permanent cookie, the cookie would be
      persisted until the maximum lifetime of session is reached.

#### Configuration

Sample configuration:
```yaml
session:
    lifetime: 86400
    idle_timeout_enabled: true
    idle_timeout: 300
    cookie_same_site: None
    cookie_domain: example.com
    cookie_expiration: false
clients:
    - auth_api_use_cookie: false
```

- **session**: Configuration for the session mechanism.
    - **lifetime**: The maximum session lifetime in seconds,
                    default to 2592000 (30 days).
    - **idle_timeout_enabled**: Whether session idle timeout is enabled,
                                default to false.
    - **idle_timeout**: The session idle timeout period in seconds,
                        default to 300 (5 minutes).
    - **cookie_same_site**: The `SameSite` attribute of cookie,
                            default to `Lax`, and other possible values are
                            `None` and `Strict`.
    - **cookie_domain**: The `Domain` attribute of cookie, optional.
    - **cookie_expiration**: Whether the session cookie would expire
                             (i.e. HTTP permanent cookie), default to false.
- **clients**: Configuration of OIDC clients. Details are in other specs.
    - **auth_api_use_cookie**: Whether the Auth API would set session cookie,
                               instead of returning OIDC access/refresh tokens,
                               default to false.

### Session Management

#### List

Skygear Auth provides an API to list all valid sessions and offline grants of
the user. The list includes the session attributes.

### Session Resolution

Skygear Auth provides an API to resolve user info from cookie / OIDC access
token.

For cookies, a session can be directly resolved from the session cookie.

For OIDC access token, its parent grant would be resolved:
- if it is a access grant: the associated session would be resolved.
- if it is a offline grant: the offline grant itself would be resolved.

After resolving a valid session/offline grant, some attributes of it would be
updated according to the request:
- last access time
- last IP
- last access user agent
- extra information

### Session Invalidation

#### Implicit Invalidation

A session can be implicitly invalidated if some states of the
user changed:
- The identity of session is deleted.
- The user is disabled.

#### Revocation

Sessions can be revoked and invalidated using API.

#### Logout

User can log out from the session, so that the session is invalidated.

#### Expiry

Sessions have maximum lifetime: session would be invalidated once the lifetime
is expired.

Optionally, developer can configured a session idle timeout: session would be
invalidated if the session is not used (i.e. resolved) within the specified
timeout period.
