# Use Cases

This document describes non-obvious solution to use cases.


## Session expiry after inactivity
Developer can set session idle timeout to same as access token lifetime.

```yaml
session:
    access_token_lifetime: 1800
    session_idle_timeout_enabled: true
    session_idle_timeout: 1800
```


# Mobile app session management
Developer can set a idle timeout with a long refresh token lifetime,
so users would stay logged in if they keep using the app.

```yaml
session:
    access_token_lifetime: 1800
    refresh_token_disabled: false
    refresh_token_lifetime: 31536000    # 1 year
    session_idle_timeout_enabled: true
    session_idle_timeout: 1209600       # 2 weeks
```


# Session information display
To display a session information in session management UI, developer may want to
display following information:
- Device name (if present)
- Device Model
- OS & OS Version
- IP Address
- Country (derived from IP using geo IP database)
