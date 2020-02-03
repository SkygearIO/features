# Configuration

## Example
```yaml
# skygear.yaml

deployments:
  - name: assets
    type: static
    path: /
    context: ./frontend/build
    error_page: /index.html
    expires: 3600
```

## Updated Fields

- **type**: A new type `static` is added.
- **context**: If type is `static`: The static content directory.
- **error_page**: Valid only if type is `static`. Optional.
                 The 4xx error page absolute path.
- **expires**: Valid only if type is `static`. Required.
               The cache duration in seconds. Valid values are 0 to 604800 (7 days).
