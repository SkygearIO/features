# Configuration

```yaml
auth_ui:
  css: |
    .primary-btn {
      background-color: purple;
    }
  content_secure_policy: "frame-ancestors https://thirdpartyapp.com 'self'"
```

- `css`: A string of CSS to be included in all pages of Auth UI.
- `content_secure_policy`: If present, override the default HTTP Header `Content-Secure-Policy` set by Auth UI.
