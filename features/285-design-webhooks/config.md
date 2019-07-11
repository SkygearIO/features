# Web-hook Configuration

## Sample configuration
In `skygear.yaml`:
```yaml
hooks:
    before_signup:
        - "https://www.mydomain.com/api/hooks/before_signup"
        - /profile/before_signup
    after_signup:
        - /profile/after_signup
```

In user configuration:
```yaml
api_key: XXX
hook_secret: 7pWyqCcfsNnDr5trKt7bJhLZL
```

## skygear.yaml
The top-level key `hooks` is a map, where the keys are web-hook event names.
The value of map is a list of strings, where each string describe the web-hook
handler endpoint.

If the web-hook handler endpoint is a full URL, it must use HTTPS scheme.
Otherwise, the configuration will be failed to validate.

If the web-hook handler endpoint is a absolute path, it will be resolved to full
URL with app domain by auth gear at runtime.

To update hooks configuration, a new deployment would be created.

## User Configuration
The top-level key `hook_secret` is a string. This is the value of web-hook
signature secret key shared among all web-hooks. If omitted, master key is used
by default.
