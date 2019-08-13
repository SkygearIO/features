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
