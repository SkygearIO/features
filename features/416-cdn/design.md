# Custom Domain CDN

## Background

Developer would want to enable CDN on custom domains.

## Objectives

- Developers should be able to serve Skygear app through CDN on custom domain.
- CDN should be responsible for caching and TLS termination.

## Design

Asset gear and static deployment would set appropiate cache headers to enable
CDN caching. If micro-service developers would like to utilize CDN for caching,
they are responsible to set the correct cache headers to reduce impact of stale
cache and cache misses.

For now, to enable CDN, developers should forward traffics from CDN provider to
the default Skygear domain. The CDN provider should manage their own TLS
certificate. Also, the domain should be verified so that the gateway can route
the HTTP request correctly.

## Appendix

- [CDN Architecture](./cdn.md)