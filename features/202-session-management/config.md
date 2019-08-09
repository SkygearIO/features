# Session Configuration

## Sample configuration

In user configuration:
```yaml
clients:
    - name: Web App
      disabled: false
      api_key: XXX
      session_transport: cookie
    - name: iOS App
      disabled: false
      api_key: YYY
      session_transport: header
    - name: Android App
      disabled: false
      api_key: ZZZ
      session_transport: header
session:
    access_token_lifetime: 1800
    refresh_token_disabled: false
    refresh_token_lifetime: 86400
    session_idle_timeout_enabled: true
    session_idle_timeout: 300
```

## User Configuration

The value of key `clients` is a list of client configuration:
- `name`: Name of client. Show in UI (e.g. portal)
- `disabled`: Indicate whether the client is disabled.
- `api_key`: API key.
- `session_transport`: The transport method of session tokens.
                       Can be `cookie` or `header`.

The value of key `session` is a map of session configuration:
- `access_token_lifetime`: The lifetime of access token in seconds, default
                           to 1800.
- `refresh_token_disabled`: Indicate whether refresh token is disabled, default
                            to `false`. If `session_transport` is `cookie`,
                            refresh token is disabled and this configuration
                            has no effect.
- `refresh_token_lifetime`: The maximum lifetime of refresh token in seconds,
                            default to max(`access_token_lifetime`, 86400).
                            Must greater than or equal to `access_token_lifetime`.
- `session_idle_timeout_enabled`: Indicate whether session idle timeout is
                                  enabled, default to `false`.
- `session_idle_timeout`: The session idle timeout in seconds,
                          default to min(`access_token_lifetime`, 300).
                          Must less than or equal to `access_token_lifetime`.
