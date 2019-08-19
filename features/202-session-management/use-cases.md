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


# Custom session attributes
Developer can assign a custom attributes (e.g. device ID) using update
session API. If developer would like to allow client-side to update, a wrapper
API can be provided to allow updating specific attribute.

```typescript
// cloud function / microservice:
async function updateDeviceID(sessionID: string, deviceID: string): Promise<void> {
    // using master key:
    await skygear.auth.updateSession(sessionID, { deviceID });
}
```

# Session information display
To display a session information in session management UI, it is recommended to
determine displayed name as:
1. If extra information is present and device name is not empty: use device name
2. If user-defined session name is not empty: use session name
3. Otherwise: combine device model & OS version to form the display name

Developer may also want to display additional information:
- IP Address
- Country (derived from IP using geo IP database)
