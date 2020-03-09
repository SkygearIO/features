# OpenID Connect (OIDC) Identity Provider

## Overview

Skygear Auth offers authentication flow which conforms OIDC specification. You can integrate Skygear Auth as OpenID Provider (OP) in your application or use Skygear Platform with Skygear Microservices directly.

## Integrate Skygear Auth OIDC (Skygear App as OP + External Application)

### Example Scenarios

- Independent backend connect with Skygear App as OP
- Developer has microservices in Skygear App A which connect with Skygear App B as OP
- Independent gateway connect with Skygear App as OP

### Generic OIDC RP

[![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IENsaWVudEFwcFxuICBwYXJ0aWNpcGFudCBBcHBCYWNrZW5kXG4gIHBhcnRpY2lwYW50IFNreWdlYXJBdXRoXG4gIENsaWVudEFwcC0-PkFwcEJhY2tlbmQ6IFVzZXIgY2xpY2sgbG9naW5cbiAgQXBwQmFja2VuZC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGNvZGUgcmVxdWVzdFxuICBTa3lnZWFyQXV0aC0-PkNsaWVudEFwcDogUmVkaXJlY3QgdG8gYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICBDbGllbnRBcHAtPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBhbmQgY29uc2VudFxuICBTa3lnZWFyQXV0aC0-PkFwcEJhY2tlbmQ6IEF1dGhvcml6YXRpb24gY29kZVxuICBBcHBCYWNrZW5kLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gY29kZSArIGNsaWVudCBpZCArIGNsaWVudCBzZWNyZXRcbiAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogVmFsaWRhdGUgYXV0aG9yaXphdGlvbiBjb2RlICsgY2xpZW50IGlkICsgY2xpZW50IHNlY3JldFxuICBTa3lnZWFyQXV0aC0-PkFwcEJhY2tlbmQ6IFRva2VuIHJlc3BvbnNlIChJRCB0b2tlbiArIGFjY2VzcyB0b2tlbiArIHJlZnJlc2ggdG9rZW4pXG4gIEFwcEJhY2tlbmQtPj5Ta3lnZWFyQXV0aDogUmVxdWVzdCB1c2VyIGRhdGEgd2l0aCBhY2Nlc3MgdG9rZW5cbiAgU2t5Z2VhckF1dGgtPj5BcHBCYWNrZW5kOiBSZXNwb25zZSB1c2VyIGRhdGFcbiAgQXBwQmFja2VuZC0-PkFwcEJhY2tlbmQ6IENyZWF0ZSBBcHBCYWNrZW5kIG1hbmFnZWQgc2Vzc2lvblxuICBBcHBCYWNrZW5kLT4-Q2xpZW50QXBwOiBSZXR1cm4gQXBwQmFja2VuZCBtYW5hZ2VkIHNlc3Npb24iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCIsInNlcXVlbmNlIjp7InNob3dTZXF1ZW5jZU51bWJlcnMiOnRydWV9fSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IENsaWVudEFwcFxuICBwYXJ0aWNpcGFudCBBcHBCYWNrZW5kXG4gIHBhcnRpY2lwYW50IFNreWdlYXJBdXRoXG4gIENsaWVudEFwcC0-PkFwcEJhY2tlbmQ6IFVzZXIgY2xpY2sgbG9naW5cbiAgQXBwQmFja2VuZC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGNvZGUgcmVxdWVzdFxuICBTa3lnZWFyQXV0aC0-PkNsaWVudEFwcDogUmVkaXJlY3QgdG8gYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICBDbGllbnRBcHAtPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBhbmQgY29uc2VudFxuICBTa3lnZWFyQXV0aC0-PkFwcEJhY2tlbmQ6IEF1dGhvcml6YXRpb24gY29kZVxuICBBcHBCYWNrZW5kLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gY29kZSArIGNsaWVudCBpZCArIGNsaWVudCBzZWNyZXRcbiAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogVmFsaWRhdGUgYXV0aG9yaXphdGlvbiBjb2RlICsgY2xpZW50IGlkICsgY2xpZW50IHNlY3JldFxuICBTa3lnZWFyQXV0aC0-PkFwcEJhY2tlbmQ6IFRva2VuIHJlc3BvbnNlIChJRCB0b2tlbiArIGFjY2VzcyB0b2tlbiArIHJlZnJlc2ggdG9rZW4pXG4gIEFwcEJhY2tlbmQtPj5Ta3lnZWFyQXV0aDogUmVxdWVzdCB1c2VyIGRhdGEgd2l0aCBhY2Nlc3MgdG9rZW5cbiAgU2t5Z2VhckF1dGgtPj5BcHBCYWNrZW5kOiBSZXNwb25zZSB1c2VyIGRhdGFcbiAgQXBwQmFja2VuZC0-PkFwcEJhY2tlbmQ6IENyZWF0ZSBBcHBCYWNrZW5kIG1hbmFnZWQgc2Vzc2lvblxuICBBcHBCYWNrZW5kLT4-Q2xpZW50QXBwOiBSZXR1cm4gQXBwQmFja2VuZCBtYW5hZ2VkIHNlc3Npb24iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCIsInNlcXVlbmNlIjp7InNob3dTZXF1ZW5jZU51bWJlcnMiOnRydWV9fSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)

1. User click login and call App Backend
1. App Backend generate authorization code request to Auth Gear
1. Auth Gear redirect user to authorization page
1. User authorize and consent
1. Auth Gear set Idp session and redirect authorization code result back to App Backend
1. App Backend send the token request to Auth Gear with authorization code + client id + client secret
1. Auth Gear validate authorization code + client id + client secret
1. Auth Gear return token response to App Backend
1. App Backend request user data by using the access token
1. Auth Gear return the user data
1. App Backend create self managed session based on user data
1. App Backend return self managed session to Client App

## Using Skygear Platform (Auth UI + Skygear Microservice)

### Example Scenarios

- Use Skygear Microservice and use Skygear Auth UI for authentication

### Case 1: Native app (Mobile app or single app web that cannot iframe Skygear Auth)

[![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IENsaWVudEFwcFxuICBwYXJ0aWNpcGFudCBTa3lnZWFyQXV0aFxuICBwYXJ0aWNpcGFudCBTa3lnZWFyTWlyb3NlcnZpY2VzXG4gIENsaWVudEFwcC0-PkNsaWVudEFwcDogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gIENsaWVudEFwcC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGNvZGUgcmVxdWVzdCArIGNvZGUgY2hhbGxlbmdlXG4gIFNreWdlYXJBdXRoLT4-Q2xpZW50QXBwOiBSZWRpcmVjdCB0byBhdXRob3JpemF0aW9uIGVuZHBvaW50XG4gIENsaWVudEFwcC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGFuZCBjb25zZW50XG4gIFNreWdlYXJBdXRoLT4-Q2xpZW50QXBwOiBBdXRob3JpemF0aW9uIGNvZGVcbiAgQ2xpZW50QXBwLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gY29kZSArIGNvZGUgdmVyaWZpZXJcbiAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogVmFsaWRhdGUgYXV0aG9yaXphdGlvbiBjb2RlICsgY29kZSB2ZXJpZmllclxuICBTa3lnZWFyQXV0aC0-PkNsaWVudEFwcDogVG9rZW4gcmVzcG9uc2UgKGlkIHRva2VuICsgYWNjZXNzIHRva2VuICsgcmVmcmVzaCB0b2tlbilcbiAgQ2xpZW50QXBwLT4-U2t5Z2Vhck1pcm9zZXJ2aWNlczogU2VuZCBhcGkgcmVxdWVzdCB3aXRoIGFjY2VzcyB0b2tlbiwgZ2F0ZXdheSByZXNvbHZlIGFjY2VzcyB0b2tlblxuICBsb29wIFdoZW4gYXBwIGxhdW5jaCBvciBjbG9zZSB0byBleHBpcmVkX2luXG4gICAgTm90ZSBvdmVyIENsaWVudEFwcCxTa3lnZWFyTWlyb3NlcnZpY2VzOiBSZW5ldyBhY2Nlc3MgdG9rZW5cbiAgICBDbGllbnRBcHAtLT4-U2t5Z2VhckF1dGg6IFRva2VuIHJlcXVlc3Qgd2l0aCByZWZyZXNoIHRva2VuXG4gICAgU2t5Z2VhckF1dGgtLT4-Q2xpZW50QXBwOiBUb2tlbiByZXNwb25zZSB3aXRoIG5ldyBhY2Nlc3MgdG9rZW5cbiAgZW5kIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJzZXF1ZW5jZSI6eyJzaG93U2VxdWVuY2VOdW1iZXJzIjp0cnVlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IENsaWVudEFwcFxuICBwYXJ0aWNpcGFudCBTa3lnZWFyQXV0aFxuICBwYXJ0aWNpcGFudCBTa3lnZWFyTWlyb3NlcnZpY2VzXG4gIENsaWVudEFwcC0-PkNsaWVudEFwcDogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gIENsaWVudEFwcC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGNvZGUgcmVxdWVzdCArIGNvZGUgY2hhbGxlbmdlXG4gIFNreWdlYXJBdXRoLT4-Q2xpZW50QXBwOiBSZWRpcmVjdCB0byBhdXRob3JpemF0aW9uIGVuZHBvaW50XG4gIENsaWVudEFwcC0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGFuZCBjb25zZW50XG4gIFNreWdlYXJBdXRoLT4-Q2xpZW50QXBwOiBBdXRob3JpemF0aW9uIGNvZGVcbiAgQ2xpZW50QXBwLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gY29kZSArIGNvZGUgdmVyaWZpZXJcbiAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogVmFsaWRhdGUgYXV0aG9yaXphdGlvbiBjb2RlICsgY29kZSB2ZXJpZmllclxuICBTa3lnZWFyQXV0aC0-PkNsaWVudEFwcDogVG9rZW4gcmVzcG9uc2UgKGlkIHRva2VuICsgYWNjZXNzIHRva2VuICsgcmVmcmVzaCB0b2tlbilcbiAgQ2xpZW50QXBwLT4-U2t5Z2Vhck1pcm9zZXJ2aWNlczogU2VuZCBhcGkgcmVxdWVzdCB3aXRoIGFjY2VzcyB0b2tlbiwgZ2F0ZXdheSByZXNvbHZlIGFjY2VzcyB0b2tlblxuICBsb29wIFdoZW4gYXBwIGxhdW5jaCBvciBjbG9zZSB0byBleHBpcmVkX2luXG4gICAgTm90ZSBvdmVyIENsaWVudEFwcCxTa3lnZWFyTWlyb3NlcnZpY2VzOiBSZW5ldyBhY2Nlc3MgdG9rZW5cbiAgICBDbGllbnRBcHAtLT4-U2t5Z2VhckF1dGg6IFRva2VuIHJlcXVlc3Qgd2l0aCByZWZyZXNoIHRva2VuXG4gICAgU2t5Z2VhckF1dGgtLT4-Q2xpZW50QXBwOiBUb2tlbiByZXNwb25zZSB3aXRoIG5ldyBhY2Nlc3MgdG9rZW5cbiAgZW5kIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJzZXF1ZW5jZSI6eyJzaG93U2VxdWVuY2VOdW1iZXJzIjp0cnVlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)

1. SDK generate code verifier + code challenge
1. SDK send authorization code request with code challenge
1. Auth Gear direct user to authorization page
1. User authorize and consent in authorization page
1. Auth Gear set Idp session and redirect the result (authorization code) back to client SDK
1. SDK send token request with authorization code + code verifier
1. Auth Gear validate authorization code + code verifier
1. Auth Gear return token response to SDK with id token + access token + refresh token
1. SDK inject authorization header for later on requests to Microservices, gateway resolve the access token and update request headers with auth result.
1. When app launch or access token expiry, send token request with refresh token
1. Auth Gear return token response with new access token

### Case 2: First party web app (Traditional web app / Server side rendering app / Single Page app)

[![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IEJyb3dzZXJcbiAgcGFydGljaXBhbnQgU2t5Z2VhckF1dGggYXMgU2t5Z2VhckF1dGg8YnIvPihhY2NvdW50cy5leGFtcGxlLmNvbSlcbiAgcGFydGljaXBhbnQgU2t5Z2Vhck1pcm9zZXJ2aWNlcyBhcyBTa3lnZWFyTWlyb3NlcnZpY2VzPGJyLz4oZXhhbXBsZS5jb20pXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiByZXF1ZXN0IHdpdGggcmVzcG9uc2VfdHlwZT1ub25lICsgY2xpZW50X2lkXG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogUmVkaXJlY3QgdG8gYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICBCcm93c2VyLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gYW5kIGNvbnNlbnRcbiAgU2t5Z2VhckF1dGgtPj5Ccm93c2VyOiBTZXQgSWRwIHNlc3Npb24gaW4gZVRMRCsxIGFuZCByZWRpcmVjdCBiYWNrIHRvIFNreWdlYXJNaXJvc2VydmljZXNcbiAgQnJvd3Nlci0-PlNreWdlYXJNaXJvc2VydmljZXM6IFNlbmQgYXBpIHJlcXVlc3Qgd2l0aCBJZHAgc2Vzc2lvbiwgZ2F0ZXdheSByZXNvbHZlIElkcCBzZXNzaW9uIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJzZXF1ZW5jZSI6eyJzaG93U2VxdWVuY2VOdW1iZXJzIjp0cnVlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IEJyb3dzZXJcbiAgcGFydGljaXBhbnQgU2t5Z2VhckF1dGggYXMgU2t5Z2VhckF1dGg8YnIvPihhY2NvdW50cy5leGFtcGxlLmNvbSlcbiAgcGFydGljaXBhbnQgU2t5Z2Vhck1pcm9zZXJ2aWNlcyBhcyBTa3lnZWFyTWlyb3NlcnZpY2VzPGJyLz4oZXhhbXBsZS5jb20pXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiByZXF1ZXN0IHdpdGggcmVzcG9uc2VfdHlwZT1ub25lICsgY2xpZW50X2lkXG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogUmVkaXJlY3QgdG8gYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICBCcm93c2VyLT4-U2t5Z2VhckF1dGg6IEF1dGhvcml6YXRpb24gYW5kIGNvbnNlbnRcbiAgU2t5Z2VhckF1dGgtPj5Ccm93c2VyOiBTZXQgSWRwIHNlc3Npb24gaW4gZVRMRCsxIGFuZCByZWRpcmVjdCBiYWNrIHRvIFNreWdlYXJNaXJvc2VydmljZXNcbiAgQnJvd3Nlci0-PlNreWdlYXJNaXJvc2VydmljZXM6IFNlbmQgYXBpIHJlcXVlc3Qgd2l0aCBJZHAgc2Vzc2lvbiwgZ2F0ZXdheSByZXNvbHZlIElkcCBzZXNzaW9uIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQiLCJzZXF1ZW5jZSI6eyJzaG93U2VxdWVuY2VOdW1iZXJzIjp0cnVlfX0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)

**Requirement: Microservices and Auth gear need to be the same root domain**

1. SDK send authorization request with response_type=none + client id
1. Auth Gear redirect user to authorization page
1. User authorize and consent
1. Auth Gear set Idp session in eTLD+1, redirect empty result back to client SDK
1. Since Idp session is set in eTLD+1, cookies header will be included when user send request to Microsevices too. Gateway will resolve the Idp Session and update request headers with auth result.

## OpenID Provider conformance

Some of the terms used in this session are defined in [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html#Terminology).

Skygear Auth implements [Authorization Code Flow](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth) with [PKCE](https://tools.ietf.org/html/rfc7636).

### Authentication Request

The following sessions list out the request parameters that Skygear Auth supports.

#### scope

The value must be `openid`.

#### response_type

- `code`: Using Authorization Code Flow
- `none`: Use in [First party web app](#case-2-first-party-web-app-traditional-web-app--server-side-rendering-app--single-page-app), Idp session is used when requesting api

#### client_id

The value must be a client id which configured in App Config.

#### redirect_uri

No difference from the spec.

#### state

No difference from the spec.

#### nonce

No difference from the spec.

#### display

It is not supported. The only supported display mode is `page`.

#### prompt

- not specified: Prompt user for authentication or authorization, depends on Idp session state.
- `none`: No difference from the spec. For requesting new access token when token expire in SPA.

#### max_age

It is not supported.

#### ui_locales

No difference from the spec.

#### id_token_hint

No difference from the spec, for `prompt=none` case.

#### login_hint

It is not supported.

#### acr_values

It is not supported.

#### code_challenge_method

Only `S256` is supported. `plain` is not supported. The reason is the existing implementation of SSO is using `S256` already. Since it defaults to plain, it is required and the value must be `S256`.

#### code_challenge

No difference from the spec.

#### Example of valid Authentication Request

`response_type=code&scope=openid&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&code_challenge_method=S256&code_challenge=CODE_CHALLENGE&ui_locales=en`

### Token Request

The following sessions list out the request parameters and their difference from the spec.

#### grant_type

Either `authorization_code` or `refresh_token`

#### code

No difference from the spec.

#### redirect_uri

No difference from the spec.

#### client_id

It is always required.

#### code_verifier

No difference from the spec.

#### Example of valid Token Request

`grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=REDIRECT_URI&client_id=API_KEY&code_verifier=CODE_VERIFIER`

### Token Response

#### id_token

No difference from the spec.

#### token_type

It is always the value `bearer`.

#### access_token

No difference from the spec.

#### expires_in

No difference from the spec.

#### refresh_token

No difference from the spec. Absent in [SPA](#case-2-single-page-web-app-spa) flow.

#### scope

It is always absent.

#### Example of Token Response

```json
{
  "token_type": "bearer",
  "access_token": "access.token",
  "refresh_token": "refresh.token"
}
```

## Authorization Server Metadata Document

Skygear supports OpenID Connect and OAuth metadata document which contains most of the information required for an app to do sign-in. The document includes information about endpoints and location of public keys. It is in JSON format, for values definition see [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) and [Authorization Server Metadata](https://tools.ietf.org/html/rfc8414#section-2).

The OpenID Connect discovery document can be retrieved from:

```
https://{auth_gear_endpoint}/.well-known/openid-configuration
```

The OAuth Authorization Server Metadata can be retrieved from:

```
https://{auth_gear_endpoint}/.well-known/oauth-authorization-server
```

The following sessions list out the metadata values that Skygear Auth supports.

#### issuer

No difference from the spec.

#### authorization_endpoint

No difference from the spec.

#### token_endpoint

No difference from the spec.

#### userinfo_endpoint

No difference from the spec.

#### jwks_uri

No difference from the spec.

### scopes_supported

The values will be `["openid"]`.

#### response_types_supported`

The values will be `["code", "none"]`.

#### grant_types_supported

The values will be `["authorization_code", "refresh_token"]`.

#### subject_types_supported

The values will be `["public"]`.

#### id_token_signing_alg_values_supported

`RS256` is supported.

#### claims_supported

The values will be `["sub", "iss", "aud", "exp", "iat"]`.

### code_challenge_methods_supported

The values will be `["plain", "S256"]`

### revocation_endpoint

No difference from the spec. See [Revocation Request](https://tools.ietf.org/html/rfc7009#section-2.1) for detail.

## Signing ID token

ID token signing key will be generated per app during app creation and store in App Config. For config compatibility, keys is an array, but Auth Gear only supports one key in this stage. Keys length will be checked by JSON schema.

```yaml
app_config:
  oidc:
    keys:
    - kid: key_1
      public_key: ""
      private_key: ""
```

## Configurations

### Sample configuration

```yaml
app_config:
  clients:
  - client_id: XXX
    client_secret: XXX
    refresh_token_lifetime: 86400
    access_token_lifetime: 1800
    session_idle_timeout_enabled: true
    session_idle_timeout: 300
    client_name: Mobile App
    redirect_uris:
    - "https://example.com"
    logo_uri: "https://example.com/logo.png"
    grant_types:
    - "authorization_code"
    - "refresh_token"
    response_types:
    - "code"
```

### Parameters

#### OIDC client Metadata

Some parameters are defined in OIDC, see [ClientMetadata](https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata).

They are

- `client_name`
- `redirect_uris`
- `login_uri`
- `grant_types`
- `response_types`

#### Skygear-specific

- `client_id`: OIDC client id.
- `client_secret`: OIDC client secret, used in RP integration.
- `access_token_lifetime`: OIDC access token lifetime in seconds, default to 1800.
- `refresh_token_lifetime`: OIDC refresh token lifetime in seconds, default to max(access_token_lifetime, 86400). Must greater than or equal to `access_token_lifetime`.
- `session_idle_timeout_enabled`: Indicate whether OIDC session idle timeout is enabled, default to `false`.
- `session_idle_timeout`: The OIDC session idle timeout in seconds, default to min(`access_token_lifetime`, 300). Must less than or equal to `access_token_lifetime`.

### Configuration in different cases

#### Generic OIDC RP

```yaml
app_config:
  clients:
  - redirect_uris:
    - "https://app-backend-endpoint.com"
    grant_types:
    - "authorization_code"
    - "refresh_token"
    response_types:
    - "code"
```

- Should include app backend endpoint in `redirect_uris` which handle code to access token exchange
- Generic OIDC RP run authentication code flow, and token endpoint will return refresh token. So `grant_types` should be [`authorization_code`, `refresh_token`] and `response_types` should be [`code`].

#### Skygear Microservice case 1: Native app

```yaml
app_config:
  clients:
  - redirect_uris:
    - "https://client-app-endpoint.com"
    grant_types:
    - "authorization_code"
    - "refresh_token"
    response_types:
    - "code"
```

- Should include client app endpoint in `redirect_uris` which handle code to access token exchange
- Native app run authentication code flow, and token endpoint will return refresh token. So `grant_types` should be [`authorization_code`, `refresh_token`] and `response_types` should be [`code`].


#### Skygear Microservice case 3: First party web app

```yaml
app_config:
  clients:
  - redirect_uris:
    - "https://client-app-endpoint.com"
    grant_types: []
    response_types:
    - "none"
```

- Should include client app endpoint in `redirect_uris`. When Auth Gear set the Idp Session, it will redirect back to client app with empty result. Only authorized uris can be redirected.
- First party web app use Idp session for authentication, no OIDC grants would be returned. So `grant_types` should be [] and `response_types` should be ["none"].
- `refresh_token_lifetime`, `session_idle_timeout_enabled`, `session_idle_timeout`, `access_token_lifetime` will be ignored. Since Idp session will be used, so the session lifetime will be the same as Idp session. See [Idp session config]().

## Future Enhancement

### Support Silent Authentication

In OIDC protocol, there is a flow that supports calling authorization endpoint with promote=none + id_token_hint to retrieve access token. In this way, user can all the api with access token in web app and don't need to store refresh token in insecure local storage.

Comparison between [**First party web app auth flow**](#case-2-first-party-web-app-traditional-web-app--server-side-rendering-app--single-page-app) vs **Silent Authentication**:

**First party web app auth flow**

- Pros:
  - Use Idp session cookie, so can support both Server Side Rendering (SSR) App and Single Page App (SPA).
- Cons:
  - Not fully OIDC compliance. As first party app, we can use thd Idp session without creating OIDC grant.
  - App must be the first party app (with same eTLD+1 domain, e.g. `accounts.example.com` and `example.com`).

**Silent Authentication**

- Pros:
  - OIDC compliance.
  - App is not necessarily needed to be the first party app.
- Cons:
  - Only support SPA. Access token is used, not the session cookie.

Since **First party web app auth flow** supports all basic use case, so we may consider implement **Silent Authentication** later for OIDC compliance.

#### Authorization flow

[![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IEJyb3dzZXJcbiAgcGFydGljaXBhbnQgU2t5Z2VhckF1dGhcbiAgcGFydGljaXBhbnQgU2t5Z2Vhck1pcm9zZXJ2aWNlc1xuICBCcm93c2VyLT4-QnJvd3NlcjogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBjb2RlIHJlcXVlc3QgKyBjb2RlIGNoYWxsZW5nZVxuICBTa3lnZWFyQXV0aC0-PkJyb3dzZXI6IFJlZGlyZWN0IHRvIGF1dGhvcml6YXRpb24gZW5kcG9pbnRcbiAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGFuZCBjb25zZW50XG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogQXV0aG9yaXphdGlvbiBjb2RlXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBjb2RlICsgY29kZSB2ZXJpZmllclxuICBTa3lnZWFyQXV0aC0-PlNreWdlYXJBdXRoOiBWYWxpZGF0ZSBhdXRob3JpemF0aW9uIGNvZGUgKyBjb2RlIHZlcmlmaWVyXG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogVG9rZW4gcmVzcG9uc2UgKElEIHRva2VuICsgYWNjZXNzIHRva2VuKVxuICBCcm93c2VyLT4-U2t5Z2Vhck1pcm9zZXJ2aWNlczogUmVxdWVzdCBNaWNyb3NlcnZpY2VzIHdpdGggYWNjZXNzIHRva2VuXG4gIGxvb3AgV2hlbiBhcHAgbGF1bmNoIG9yIGNsb3NlIHRvIGV4cGlyZWRfaW5cbiAgICBOb3RlIG92ZXIgQnJvd3NlcixTa3lnZWFyTWlyb3NlcnZpY2VzOiBSZW5ldyBhY2Nlc3MgdG9rZW5cbiAgICBCcm93c2VyLT4-QnJvd3NlcjogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gICAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBJbmplY3QgaWZyYW1lIHRvIHNlbmQgYXV0aG9yaXphdGlvbiByZXF1ZXN0XG4gICAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogUmVkaXJlY3QgYXV0aG9yaXphdGlvbiBjb2RlIHJlc3VsdCB0byBTa3lnZWFyQXV0aCBlbmRwb2ludFxuICAgIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogUG9zdCBtZXNzYWdlIHdpdGggYXV0aG9yaXphdGlvbiBjb2RlIHJlc3VsdFxuICAgIEJyb3dzZXItLT4-QnJvd3NlcjogSWYgSWRwIFNlc3Npb24gaXMgaW52YWxpZCwgbG9nb3V0XG4gICAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBTZW5kIHRva2VuIHJlcXVlc3Qgd2l0aCBjb2RlICsgY29kZSB2ZXJpZmllclxuICAgIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogVG9rZW4gcmVzcG9uc2UgKGlkIHRva2VuICsgYWNjZXNzIHRva2VuKVxuICBlbmRcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0Iiwic2VxdWVuY2UiOnsic2hvd1NlcXVlbmNlTnVtYmVycyI6dHJ1ZX19LCJ1cGRhdGVFZGl0b3IiOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gIHBhcnRpY2lwYW50IEJyb3dzZXJcbiAgcGFydGljaXBhbnQgU2t5Z2VhckF1dGhcbiAgcGFydGljaXBhbnQgU2t5Z2Vhck1pcm9zZXJ2aWNlc1xuICBCcm93c2VyLT4-QnJvd3NlcjogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBjb2RlIHJlcXVlc3QgKyBjb2RlIGNoYWxsZW5nZVxuICBTa3lnZWFyQXV0aC0-PkJyb3dzZXI6IFJlZGlyZWN0IHRvIGF1dGhvcml6YXRpb24gZW5kcG9pbnRcbiAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBBdXRob3JpemF0aW9uIGFuZCBjb25zZW50XG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogQXV0aG9yaXphdGlvbiBjb2RlXG4gIEJyb3dzZXItPj5Ta3lnZWFyQXV0aDogQXV0aG9yaXphdGlvbiBjb2RlICsgY29kZSB2ZXJpZmllclxuICBTa3lnZWFyQXV0aC0-PlNreWdlYXJBdXRoOiBWYWxpZGF0ZSBhdXRob3JpemF0aW9uIGNvZGUgKyBjb2RlIHZlcmlmaWVyXG4gIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogVG9rZW4gcmVzcG9uc2UgKElEIHRva2VuICsgYWNjZXNzIHRva2VuKVxuICBCcm93c2VyLT4-U2t5Z2Vhck1pcm9zZXJ2aWNlczogUmVxdWVzdCBNaWNyb3NlcnZpY2VzIHdpdGggYWNjZXNzIHRva2VuXG4gIGxvb3AgV2hlbiBhcHAgbGF1bmNoIG9yIGNsb3NlIHRvIGV4cGlyZWRfaW5cbiAgICBOb3RlIG92ZXIgQnJvd3NlcixTa3lnZWFyTWlyb3NlcnZpY2VzOiBSZW5ldyBhY2Nlc3MgdG9rZW5cbiAgICBCcm93c2VyLT4-QnJvd3NlcjogR2VuZXJhdGUgY29kZSB2ZXJpZmllciArIGNvZGUgY2hhbGxlbmdlXG4gICAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBJbmplY3QgaWZyYW1lIHRvIHNlbmQgYXV0aG9yaXphdGlvbiByZXF1ZXN0XG4gICAgU2t5Z2VhckF1dGgtPj5Ta3lnZWFyQXV0aDogUmVkaXJlY3QgYXV0aG9yaXphdGlvbiBjb2RlIHJlc3VsdCB0byBTa3lnZWFyQXV0aCBlbmRwb2ludFxuICAgIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogUG9zdCBtZXNzYWdlIHdpdGggYXV0aG9yaXphdGlvbiBjb2RlIHJlc3VsdFxuICAgIEJyb3dzZXItLT4-QnJvd3NlcjogSWYgSWRwIFNlc3Npb24gaXMgaW52YWxpZCwgbG9nb3V0XG4gICAgQnJvd3Nlci0-PlNreWdlYXJBdXRoOiBTZW5kIHRva2VuIHJlcXVlc3Qgd2l0aCBjb2RlICsgY29kZSB2ZXJpZmllclxuICAgIFNreWdlYXJBdXRoLT4-QnJvd3NlcjogVG9rZW4gcmVzcG9uc2UgKGlkIHRva2VuICsgYWNjZXNzIHRva2VuKVxuICBlbmRcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0Iiwic2VxdWVuY2UiOnsic2hvd1NlcXVlbmNlTnVtYmVycyI6dHJ1ZX19LCJ1cGRhdGVFZGl0b3IiOmZhbHNlfQ)

1. SDK generate code verifier + code challenge
1. SDK send authorization code request with code challenge
1. Auth Gear direct user to authorization page
1. User authorize and consent in authorization page
1. Auth Gear set Idp session and redirect the result (authorization code) back to client SDK
1. SDK send token request with authorization code + code verifier
1. Auth Gear validate authorization code + code verifier
1. Auth Gear return token response to SDK with id token + access token
1. SDK inject authorization header for later on requests to Microservices, gateway resolve the access token and update request headers with auth result.
1. Trigger silent authentication to obtain new access token when app launch or access token expiry, generate code verifier + code challenge for new authorization flow
1. Inject iframe with Auth Gear authorization endpoint, the authorization request includes code request + code challenge + id_token_hint + prompt=none
1. Auth Gear redirect the result (authorization code) back to an Auth Gear specific endpoint
1. Auth Gear specific endpoint post the result back to parent window (SDK)
1. SDK read the result message, logout if the result indicate Idp Session is invalid
1. If authorization code request result is success, send the token request to Auth Gear with code + code verifier
1. Auth Gear return token response to SDK with id token + new access token

#### App Config

```yaml
app_config:
  clients:
  - redirect_uris:
    - "https://client-app-endpoint.com"
    grant_types:
    - "authorization_code"
    response_types:
    - "code"
```

- Should include client app endpoint in `redirect_uris` which handle code to access token exchange
- SPA run authentication code flow and use Idp session for access token renew, refresh token should not be issued in this case. So `grant_types` should be [`authorization_code`] and `response_types` should be [`code`].
- `refresh_token_lifetime`, `session_idle_timeout_enabled`, `session_idle_timeout` will be ignored in this case. Since Idp session will be used for renewing access token, so the session lifetime will be the same as the Idp session. See [Idp session config](./session.md).

