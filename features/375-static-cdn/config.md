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
- **context**: If type is `static`, it represents the local directory containing
               static assets.
- **fallback**: Valid only if type is `static`. If the request path failed to
                match a file in the served asset directory, the URL would be
                rewritten with this path to be routed again.
