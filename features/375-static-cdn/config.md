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
```

## Updated Fields

- **type**: A new type `static` is added.
- **context**: If type is `static`: The static content directory.
- **fallback**: Valid only if type is `static`. The fallback absolute path.
