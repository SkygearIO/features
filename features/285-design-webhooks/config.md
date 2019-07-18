# Web-hook Configuration

## Sample configuration
In `skygear.yaml`:
```yaml
hooks:
    - event: before_signup
      url: "https://www.mydomain.com/api/hooks/before_signup"
    - event: before_signup
      url: /profile/before_signup
    - event: after_signup
      url: /profile/after_signup
```

In user configuration:
```yaml
api_key: XXX
hook_secret: 7pWyqCcfsNnDr5trKt7bJhLZL
```

## skygear.yaml
The top-level key `hooks` is a list of web-hook handler definition.
Each web-hook handler definition describe the handler:
- `event`: the event that the handler handles
- `url`: the handler HTTP endpoint

If the web-hook handler endpoint is a full URL, it must use HTTPS scheme.
Otherwise, the configuration will be failed to validate.

If the web-hook handler endpoint is a absolute path, it will be resolved to full
URL with app domain by auth gear at runtime.

To update hooks configuration, a new deployment would be created.

## User Configuration
The top-level key `hook_secret` is a string. This is the value of web-hook
signature secret key shared among all web-hooks. If omitted, master key is used
by default.

## App Configuration
The top-level key `sync_hook_timeout_second` is a integer. This is the timeout
for synchronous web-hook handlers. If omitted, 5 seconds is used by default.
