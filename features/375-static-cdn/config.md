# Configuration

## Example
```yaml
# skygear.yaml

deployments:
  - name: assets
    type: static
    path: /
    context: ./frontend/build
    fallback: /index.html
    expires: 3600
```

## Updated Fields

- **type**: A new type `static` is added.
- **context**: If type is `static`: The static content directory.
- **fallback**: Valid only if type is `static`. The fallback absolute path.
- **expires**: Valid only if type is `static`. The cache duration in seconds.
               Default to 3600 (1 hour). Valid values are 0 to 604800 (7 days).