# Static Asset Hosting

## Background
Developer would want to host static content (e.g. single-page-application files) on Skygear.

## Objectives
- Developers should be able to upload static content to be hosted at specific path.
- SPA style routing should be supported.

## Design

### Static Deployment

A new type of deployment, `static`, would be supported. This deployment type
supports configurations:
- deployment context (`context`)
- error page absolute path (`error_page`)
- fallback page absolute path (`fallback_page`)
- index page file name (`index_file`)

When `static` deployment type is used:
- The deployment context would be persisted to object storage
    - symlinks are resolved at upload time
    - `.skyignore` can be used to exclude files
- A request with matching path would be routing using static deployment routing
  algorithm (described below).
- If a file is matched, the gateway would proxy the request to the backing
  object storage file.
- If no file is matched, a generic 404 page would be returned.
- The response would have appropiate cache control headers, as configured by
  developer.

### Static Deployment Routing

When a request matched a `static` deployment, only its path would be considered
during routing. The request would be routed as followed:

1. Let `U` be the request URI,
   let `P` be the routing path without trailing slashes,
   let `I` be the index page file name (default to `index.html`).
2. If file `P` exists: return `P`.
3. If file `Q` = `P/I` exists: return `Q`.
4. If `fallback_page` is configured, and `U` is not refering to it:
   set `U` = `U` with path `fallback_page` and route again.
5. If `error_page` is configured, and `U` is not refering to it:
   set `U` = `U` with path `error_page` and route again.
6. Otherwise, no file is matched.

This procedure is similar to nginx directives:
```
index index.html
try_files $uri <fallback_page>
error_page 404 <error_page>
```

After the routing procedure, if `error_page` is used by step 5, the response
HTTP status code would be 404. Otherwise, the status code would be 200.

Sometimes routing procedure is restarted (e.g. in step 4 & 5). The routing
procedure can be performed at most 5 times to prevent infinite loop. In this
case, `500 Internal Server Error` response would be produced.

**Example**:

Suppose developer configured a `static` deployment as follow:
```yaml
  - name: assets
    type: static
    path: /
    context: ./static
    fallback_page: /index.html
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
    File is not found, so instead rewrite URL with error page path
    `https://example.com/index.html` and route again. (step 4)  
    Route to `assets` and serve file at `./static/index.html`. (step 1)

### Caching

Developer must configure cache duration per `static` deployment. The gateway
would attach appropiate headers to response according to configuration. Caching
can be disabled by using zero as duration, but the maximum cache duration is
7 days.

The gateway would attach `Cache-Control` header according to cache duration:
- `Cache-Control: public, no-cache, max-age=0` if duration is zero.
- `Cache-Control: public, must-revalidate, max-age=<duration>` otherwise.

Additional cache-related headers (e.g. `ETag`) may also exist, depending on
support of backing object storage.

**Example**

For common SPA deployment, application has an `index.html` with a short cache
duration, and content-hash named assets with a long cache duration:
```
- build
| - index.html
| - favicon.ico
| - assets
| | - main.809f60b0.js
| | - app.19bbb809.css
| | - ...
```

Developer can configure two `static` deployments to achieve this:
```yaml
deployments:
  - name: root
    type: static
    path: /
    context: ./build
    fallback_page: /index.html
    expires: 3600 # 1 hour
  - name: assets
    type: static
    path: /assets
    context: ./build/assets
    expires: 604800 # 7 days
```

## Appendix

- [Configuration](./config.md)
