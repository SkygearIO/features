# Client configuration

## Sample configuration

```yaml
clients:
- redirect_uris:
  - "https://example.com"
  client_name: Web App
  logo_uri: "https://example.com/logo.png"
  disabled: false
  api_key: XXX
  access_token_lifetime: 1800
  session_idle_timeout_enabled: true
  session_idle_timeout: 300
  same_site: lax
- redirect_uris:
  - "myapp://host/path"
  client_name: iOS App
  logo_uri: "https://example.com/logo.png"
  disabled: false
  api_key: YYY
  access_token_lifetime: 1800
  session_lifetime: 86400
  session_idle_timeout_enabled: false
  session_idle_timeout: 300
```

## Parameters

### Client Metadata

Some parameters are defined in OIDC. See [ClientMetadata](https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata)

They are

- `redirect_uris`
- `client_name`
- `logo_uri`

### Skygear-specific

- `disabled`: Indicate whether the client is disabled.
- `api_key`: API key. It is going to be used as `client_id`.
- `access_token_lifetime`: The lifetime of access token in seconds, default to 1800.
- `session_lifetime`: The maximum lifetime of session in seconds,
                            default to max(`access_token_lifetime`, 86400).
                            Must greater than or equal to `access_token_lifetime`.
- `session_idle_timeout_enabled`: Indicate whether session idle timeout is
                                  enabled, default to `false`.
- `session_idle_timeout`: The session idle timeout in seconds,
                          default to min(`access_token_lifetime`, 300).
                          Must less than or equal to `access_token_lifetime`.
- `same_site`: The `SameSite` property of cookie. Can be `lax`, `strict`, or
               `none`. Default to `lax`.

## Auth Gear environment variable
- `INSECURE_COOKIE`: Indicate whether session cookie should not set the `Secure`
                     flag. Default to `false`.
