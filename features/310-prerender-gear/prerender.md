# Prerender

Prerender is a gear that caches and serves pre-rendered html.

## Use case

Prerender's main use case is to optimize response time for single-page-application (SPA) when search engine asks skygear to provide an html, aka search-engine-optimization (SEO).

## Terminology

- **Prerendered html** - An html document that is the result of running some or all of an html's javascript and without any script tag. By definition, an html without any javascript is a prerendered html.

- **Prerendered html cache** - A volatile or persistent cache that stores prerendered html.

## Overview

### Making a prerender request

When skygear's gateway receives a request, before redirecting the traffic to a specific handler (e.g. cloud function), it would inspect `user-agent` to see if the request comes from search engines by matching `user-agent` against a configurable list of search engine. If it is, it asks prerender for a prerendered html by forwarding the url, otherwise it redirects the request to a specific handler as-is.

Prerender handles any incoming request by first checking whether there is any cached DOM for the forwarded url. It there is a cache hit, prerender "hits the fast path" and returns the cached DOM as-is. Otherwise it proceeds to the slow path.
    
The slow path begins by first navigating to the forwarded url using a headless browser, aloowing the browser to proceed according to redirect transparently, then inspect the final response once it settles down to check if the url locates an html document (i.e. `content-type` is `text/html`). If not, prerender returns the response body and headers directly, otherwise it proceeds to capture the response body (the html DOM) and the response header.

To allow scripts to run to its completion or to allow DOM to transform to a specific state, prerender waits for a configurable period of time before capturing the resultant DOM. The resultant DOM will have all of its script tags removed, and a `<base>` tag is inserted to the DOM appropriately to fix relative links in case the domain of the forwarded url is not skygear's domain.

Response headers are then modified. Specifically, `content-length` and `content-encoding` will be removed.

Finally, the modified DOM and headers are put into prerendered html cache using the forwarded url as keys before being sent back to gateway. A configurable expiry time is also applied to the cache such that they expire automatically.

#### Redirect

Note that since the forwarded url is used directly as the cache key, even if the forwarded url in a future request is the same as any of the redirected urls prerender has encountered during navigation, the request is a cache miss. For example:

1. gateway requests url `http://a.com`
2. prerender sees a caches miss, proceed to navigates to `http://a.com`
3. prerender is redirected to `http://b.com`
4. prerender captures the DOM of `http://b.com`, then stores it with key `http://a.com` and serves it
5. gateway requests url `http://b.com`
6. prerender sees a cache miss (it only has cache for `http://a.com`), proceeds to navigates to `http://b.com`
7. prerender captures the DOM of `http://b.com` (again), then stores it with key `http://b.com` and serves it

Notice how in (6) prerender consider `http://b.com` a cache miss even though it has been redirected to it.

### Invalidating cache

Since prerender supports some configuration about cache, when a configuration is changed such that according to the new configuration old cache is no longer valid, it is necessary to manually reset prerendered html cache. Prerender supports invalidation via a `origin` and `path` protocol.

## API

### Configuration

`seo-prerender`: Boolean. `true` to enable prerender, `false` to disable.

`seo-prerender-expiry`: Time. The amount of time, specified in seconds, a prerendrered html is kept in cache.

`seo-prerender-capture-wait`: Time. The amount of time, specified in seconds, prerender waits before capturing DOM such that javascript, etc can have time to run.

### Endpoint

#### Prerender

Path:

`/`

Query parameters:

- `u`: The url to render. A url with slash at the end and a url without slash at the end are cached separately.
- `expiry`: Corresponds to `seo-prerender-expiry` in configuration, with the time specified in seconds. i.e. To have an expiry of one hour one should pass `3600`. Optional. Default value is 3600.
- `captureWait`: Corresponds to `seo-prerender-capture-wait` in configuration, with the time specified in seconds. i.e. To wait 30 seconds one should pass `30`. Optional. Default value is 0.

Response:

- `200`: If `content-type` of the original response of the url is not `text/html`, the original response and headers, modified DOM and headers otherwise.
- `400` If `u` is missing.

---
#### Invalidate

Path:

`/invalidate`

Request body:
```
{
    "origins": // Arrays of objects, cannot be empty, required
    [
        {
            "origin":"string", // String, required
            "paths": // Arrays of strings, can be empty, required
            [
                "string",
                "string"
            ]
        }
    ]
}
```
Response:
- `200`: The request is processed. Please note that it does not mean the cache had been cleared - even though prerender fails to reset a cach because e.g. there is no cache for the given origins, `200` is still returned.
- `400`: If request body's json is malformed.

## Appendix

Search engine list:
```
[
                    "googlebot", "yahoo", "bingbot", "yandex", "baiduspider", "facebookexternalhit", "twitterbot", "rogerbot", "linkedinbot", 
                    "embedly", "quora link preview", "showyoubot", "outbrain", "pinterest/0.", 
                    "developers.google.com/+/web/snippet", "slackbot", "vkShare", "W3C_Validator", 
                    "redditbot", "Applebot", "WhatsApp", "flipboard", "tumblr", "bitlybot", 
                    "SkypeUriPreview", "nuzzel", "Discordbot", "Google Page Speed", "x-bufferbot"
]
```
[Source](https://github.com/greengerong/Prerender_asp_mvc/blob/master/Prerender.io/PrerenderModule.cs)