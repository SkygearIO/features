# Static Asset Hosting

## Background
Developer would want to host static content (e.g. single-page-application files) on Skygear and serve them through
high performance CDN.

## Objectives
- Developers should be able to upload static content to be hosted at specific path.
- Hosted static content should be served & cached with CDN if possible.
- SPA style routing should be supported.

## Design

### Static Deployment

A new type of deployment, `static`, would be supported. This deployment type
supports configurating a deployment context (`context`) and fallback absolute
path (`fallback`).

When `static` deployment type is used:
- The deployment context would be persisted to object storage.
- A request with matching path would be routing using static deployment routing
  algorithm (described below).
- If a file is matched, the gateway would proxy the request to the backing
  object storage file.
- If no file is matched, a generic 404 page would be returned.
- The response would have appropiate cache control header, allowing maximum
  cache duration of 24 hour.

### Static Deployment Routing

When a request matched a `static` deployment, only its path would be considered
during routing. The request would be routed as followed:

1. Let `U` be the request URI, let `P` be the routing path without trailing slashes.
2. If file `P` exists, return `P`.
3. If file `Q` = `P/index.html` exists, return `Q`.
4. If `fallback` is configured, set `U` = `U` with path `fallback` and route again.
5. Otherwise, no file is matched.

This procedure is similar to nginx directives:
```
index index.html
try_files $uri <fallback>
```

Sometimes routing procedure is restarted (e.g. in step 4). The routing procedure
can be performed at most 5 times to prevent infinite loop. In this case, `500
Internal Server Error` response would be produced.

**Example**:

Suppose developer configured a `static` deployment as follow:
```yaml
  - name: assets
    type: static
    path: /
    context: ./static
    fallback: /index.html
```

- **https://example.com/main.js**:  
    Route to `assets` and serve file at `./static/main.js`. (step 2)  
- **https://example.com/**:  
    Route to `assets` and serve file at `./static`. (step 2)  
    Not a file, so instead serve file at `./static/index.html`. (step 3)  
- **https://example.com/index.html**:  
    Route to `assets` and serve file at `./static/index.html`. (step 2)  
- **https://example.com/login**:  
    Route to `assets` and serve file at `./static/login`. (step 2)  
    File is not found, so instead serve file at `./static/login/index.html`. (step 3)  
    File is not found, so instead rewrite URL with fallback path
    `https://example.com/index.html` and route again. (step 4)  
    Route to `assets` and serve file at `./static/index.html`. (step 1)

### Static Asset CDN

Static asset would be served through CDN if possible. If CDN is enabled, all
traffic through the domain would be proxied through the CDN to the gateway.

Asset gear and static deployment would set appropiate cache headers to enable
CDN caching. If micro-service developers would like to utilize CDN for caching,
they are responsible to set the correct cache headers to reduce impact of stale
cache and cache misses.

At the moment, we would have following limitations:
- Cache duration of static deployment cannot be configured.
- CDN cache cannot be invalidated manually.
- CDN can be enabled for custom domains only.

## Appendix

- [Configuration](./config.md)
- [CDN Architecture](./cdn.md)
