# Configuration

## Example
```yaml
# skygear.yaml

deployments:
  - name: root
    type: static
    path: /
    context: ./build
    fallback_page: /index.html
    expires: 3600
  - name: assets
    type: static
    path: /assets
    context: ./build/assets
    error_page: /404.html
    expires: 604800
```

## Updated Fields

- **type**: A new type `static` is added.
- **context**: If type is `static`: The static content directory.
- **fallback_page**: Valid only if type is `static`. Optional.
                  The fallback page absolute path.
- **error_page**: Valid only if type is `static`. Optional.
                  The 4xx error page absolute path.
- **index_file**: Valid only if type is `static`. Optional. Default to `index.html`.
                  File name of the index page.
- **expires**: Valid only if type is `static`. Required.
               The cache duration in seconds. Valid values are 0 to 604800 (7 days).
