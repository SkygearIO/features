# Session Info in HTTP header

## Overview

The gateway resolve the access token into a session.
If the session is valid, multiple HTTP headers are added to the request.

If there is no access token or the session is invalid, the headers are absent.

The gateway must remove the headers from the original request before adding the headers.

## The HTTP headers

### x-skygear-user-id

The user id.

Example

```
x-skygear-user-id: 87dfaacf-a872-444a-948a-1497c6bb2a03
```

### x-skygear-user-verified

Whether the user is considered verified or not.

The value is either `true` or `false`.

Example

```
x-skygear-user-verified: true
```

### x-skygear-user-disabled

Whether the user is disabled or not.

The value is either `true` of `false`.

Example

```
x-skygear-user-disabled: false
```

### x-skygear-session-identity-type

What kind of identity the user authenticated as.

The value is `password`, `oauth` or `custom_token`.

Example

```
x-skygear-session-identity-type: password
```

### x-skygear-session-authenticator-type

What kind of authenticator the user used.
If the session did not involve MFA, this header is absent.

The value is `totp`, `oob`, `bearer_token` or `recovery_code`.

Example

```
x-skygear-session-authenticator-type: oob
```
