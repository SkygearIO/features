# Delete RefreshTokenDisabled

## Old SDK and old gateway behavior

When the SDK receives a response with `x-skygear-try-refresh-token: true`, it tries to refresh the access token.

The gateway uses this flag to determine whether it should terminate the request with 401.
If RefreshTokenDisabled is true, then the request is not terminated and continue to the upstream server.
If RefreshTokenDisabled is false, then the request is terminated with 401 and the header `x-skygear-try-refresh-token: true` is added.

## Old SDK and new gateway behavior

When the SDK receives a response with `x-skygear-try-refresh-token: true`, it tries to refresh the access token.

The gateway never terminate request and write `x-skygear-auth-request-result` instead. It is up to the upstream server to return 401.
The gateway writes `x-skygear-try-refresh-token: true` if `x-skygear-auth-request-result: invalid`.

The refresh access token flow is _NOT_ broken.

## New SDK and new gateway behavior

When the SDK receives a response with `x-skygear-try-refresh-token: true` and it is configured to use `Authorization:`, it tries to refresh the access token.

The gateway never terminate request and write `x-skygear-auth-request-result` instead. It is up to the upstream server to return 401.
The gateway writes `x-skygear-try-refresh-token: true` if `x-skygear-auth-request-result: invalid`.

The refresh access token flow is only triggered when the SDK is using `Authorization:`.

# Delete SessionTransport

## Old SDK and old server behavior

The SDK expects the server to include the access token either in cookie or the response body. If the access token is returned in body, subsequent requests have `Authorization:` set.

The server either writes the access token in cookie or includes it in the response body, according to the setting of SessionTransport.

## Old SDK and new server behavior

The SDK expects the server to include the access token either in cookie or the response body. If the access token is returned in body, subsequent requests have `Authorization:` set.

Skygear Gateway has special routing rules that proxy `https://{app_domain}/_{gear}/` to `https://{gear_domain}/`.
Skygear Gateway add a special header `x-skygear-legacy-sdk: true` to include such case.
Auth Gear in this case always include the access token in cookie and in the response body.

The request made by the SDK has session specified in cookie and `Authorization:`.
Cookie has higher precedence.
In case the session is invalid, the cookie is cleared by the gateway. The SDK triggers the refresh access token flow but it never succeed.

## New SDK and new server behavior

The SDK uses `Authorization:` for requests to gears and uses the configured transport for requests to the app domain.

Auth Gear in this case always include the access token in the response body.
A special endpoint is mounted in the app domain to accept the access token and the refresh token, and write the session token in cookie.
