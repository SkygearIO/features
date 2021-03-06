# Gateway

Skygear Gateway is responsible for:

- Resolve the app and the upstream server from the request host.
- Delegate request authentication to Skygear Auth.
- Proxy legacy request convention.

## Resolving the app and the upstream server from the request host

### Default domain

The domain label pattern is `https://[<deployment_version_or_gear_name>.]<app_name>.<skygear_cluster_domain>`.

The defined gear name are `accounts` and `assets`.

Examples:

- `https://698d0e9.myapp.skygearapp.com` resolves to the app `myapp` in deployment version `698d0e9`.
- `https://accounts.myapp.skygearapp.com` resolves to Skygear Auth of the app `myapp`.

### Custom domain

The resolution of custom domain is purely table-driven. The developer is free to assign domain to their app and gears.

## Delegating request authentication to Skygear Auth

Skygear Gateway initiate subrequest to the resolve endpoint of Skygear Auth after resolving the app. The subrequest does not contain body. The gateway must remove `x-skygear-*` headers from the original request before initiating the subrequest. The gateway must copy `x-skygear-*` headers from the response of the subrequest to the original request.

## Authenticating the request

The resolve endpoint `/resolve` looks at `Authorization:` and `Cookie:` to authenticate the request. `Cookie:` has higher precedence. Regardless of the result, the status code is always 200. If the request is anonymous, the response does not contain any `x-skygear-*` headers. Otherwise the response contains the following headers.

## HTTP Headers

### x-skygear-session-valid

Tell whether the session of the original request is valid.

If this header is absent, it means that the original request does not contain any session.

If the value is `true`, it indicates the original request has valid session. More headers will be included.

If the value is `false`, it indicates that the original request has an invalid session.

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

### x-skygear-session-identity-id

The ID of the identity the user authenticated as.

Example

```
x-skygear-session-identity-id: 87dfaacf-a872-444a-948a-1497c6bb2a03
```

### x-skygear-session-identity-type

What kind of identity the user authenticated as.

The value is `password` or `oauth`.

Example

```
x-skygear-session-identity-type: password
```

### x-skygear-session-identity-updated-at

The last time the identity was authenticated in this session. The application can use this to trigger reauthentication if it considers the freshness of the identity is stale.

The value is in RFC3339 format.

Example

```
x-skygear-session-identity-updated-at: 2019-09-17T00:00:00.000Z
```

### x-skygear-session-authenticator-id

The ID of the authenticator the user used.
If the session did not involve MFA, this header is absent.
If the application has enabled MFA and enforcement is `off`, the presence of this header could mean the user has performed step-up MFA.

Example

```
x-skygear-session-authenticator-id: 87dfaacf-a872-444a-948a-1497c6bb2a03
```

### x-skygear-session-authenticator-type

What kind of authenticator the user used.
If the session did not involve MFA, this header is absent.

The value is `totp`, `oob`, `bearer_token` or `recovery_code`.

Example

```
x-skygear-session-authenticator-type: oob
```

### x-skygear-session-authenticator-oob-channel

The channel of the OOB authenticator.
If the session did not involve MFA or the authenticator is not OOB, this header is absent.

The value is `sms` or `email`.

Example

```
x-skygear-session-authenticator-oob-channel: sms
```

### x-skygear-session-authenticator-updated-at

The last time MFA was used in this session.
The application can use this to trigger reauthentication if it considers the freshness of the authenticator is stale.

The value is in RFC3339 format.

Example

```
x-skygear-session-identity-updated-at: 2019-09-17T00:00:00.000Z
```

## Example

### No session associated with the original request

No headers are added.

### Valid session associated with the original request

```
x-skygear-session-valid: true
x-skygear-user-id: a
x-skygear-user-verified: true
x-skygear-user-disabled: false
x-skygear-session-identity-id: a
x-skygear-session-identity-type: password
x-skygear-session-identity-updated-at: 2019-09-17T00:00:00.000Z
x-skygear-session-authenticator-id: a
x-skygear-session-authenticator-type: oob
x-skygear-session-authenticator-oob-channel: sms
x-skygear-session-authenticator-updated-at: 2019-09-17T00:00:00.000Z
```

### Invalid session associated with the original request

```
x-skygear-session-valid: false
```

## Proxying legacy request convention

A request is proxied if all of the following hold:

- The request host is the app host.
- The request path starts with `/_<gear_prefix>`.

Suppose the request URL is `https://myapp.skygearapp.com/_auth/login`. It is a request to the app domain and the path starts with `/_auth/` so it is eligible for proxying. The rewritten URL is `https://accounts.myapp.skygearapp.com/_auth/login`. `x-forwarded-host` is `myapp.skygearapp.com`.

Suppose the request URL is `https://myapp.com/_auth/login`. It is a request to the app domain and the path starts with `/_auth/` so it is eligible for proxying. The rewritten URL is `https://accounts.myapp.skygearapp.com/_auth/login`. `x-forwarded-host` is `myapp.com`.

Suppose the request URL is `https://accounts.myapp.skygearapp.com/settings`. It is *NOT* a request to the app domain so it is not proxied.

The same logic applies to Asset Gear as well, with `/_auth/` being substituted with `/_asset/`.

---

By proxying the legacy request convention, the cookie is shared seamlessly. This is proxying is intended for backward compatibility for legacy app, which does not use Auth UI.
