# Auth UI, OIDC, and Sessions

## Introduction

This document describes how Auth UI, OIDC, and session mechanism integrate
with each other. For design details, please refer to other documents.

## System Overview

Traditionally, authentication mechanism is implemented as part of the app
services:
[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBBcHAgQVxuICAgICAgc3ViZ3JhcGggXCJBcHAgU2VydmljZXMgKGFwcGEuY29tKVwiXG4gICAgICAgIEFVSVtBdXRoIFVJXVxuICAgICAgICBBQVBJW0F1dGggQVBJXVxuICAgICAgICBTQVBJW0FQSSBTZXJ2ZXJdXG4gICAgICAgIFdFQltXZWJdXG4gICAgICBlbmRcblxuICAgICAgQUFQSSAtLS0gR1dbR2F0ZXdheV1cbiAgICAgIFNBUEkgLS0tIEdXXG4gICAgICBBVUkgLS0tIEdXXG4gICAgICBXRUIgLS0tIEdXXG4gICAgZW5kXG4gICAgR1cgLS0tIE1BUFBbTW9iaWxlIEFwcF1cbiAgICBHVyAtLS0gQ0xJW1dlYiBDbGllbnRdIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBBcHAgQVxuICAgICAgc3ViZ3JhcGggXCJBcHAgU2VydmljZXMgKGFwcGEuY29tKVwiXG4gICAgICAgIEFVSVtBdXRoIFVJXVxuICAgICAgICBBQVBJW0F1dGggQVBJXVxuICAgICAgICBTQVBJW0FQSSBTZXJ2ZXJdXG4gICAgICAgIFdFQltXZWJdXG4gICAgICBlbmRcblxuICAgICAgQUFQSSAtLS0gR1dbR2F0ZXdheV1cbiAgICAgIFNBUEkgLS0tIEdXXG4gICAgICBBVUkgLS0tIEdXXG4gICAgICBXRUIgLS0tIEdXXG4gICAgZW5kXG4gICAgR1cgLS0tIE1BUFBbTW9iaWxlIEFwcF1cbiAgICBHVyAtLS0gQ0xJW1dlYiBDbGllbnRdIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)

- User authenticates to the app using **Auth UI** on **Web Client**
  (i.e. web browser). Then, users can use **Web** service using a
  session cookie.
- User authenticates to the app using **Auth API** on **Mobile App**.
  Then, users can use **API Server** through the app using access/refresh
  tokens.

However, modern applications often have additional requirements:
- Developers want to have a uniform UX on authentication across multiple
  first-party services.
- Developers want to use proven authentication client library, such as
  [AppAuth](https://github.com/openid/AppAuth-JS).
- Developers want to integrate with other identity provider, or act as one.
- Developers want to restrict access to sensitive authentication data.
  For example, mobile app should not have access to user password credentials.

Therefore, we will have following architecture for these requirements:
[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBBcHAgQVxuICAgICAgc3ViZ3JhcGggXCJBdXRob3JpemF0aW9uIFNlcnZlciAoYWNjb3VudHMuYXBwYS5jb20pXCJcbiAgICAgICAgREIgLS0tIEFSW0F1dGggUmVzb2x2ZXJdXG4gICAgICAgIERCW0F1dGggREJdIC0tLSBBUElbQXV0aCBBUEldXG4gICAgICAgIERCIC0tLSBPSURDW09JREMgQVBJXVxuICAgICAgICBEQiAtLS0gQVVJW0F1dGggVUldXG4gICAgICAgIEFVSSAtLS0gT0lEQ1xuICAgICAgZW5kXG5cbiAgICAgIHN1YmdyYXBoIFwiQXBwIFNlcnZpY2VzIChhcHBhLmNvbSlcIlxuICAgICAgICBTQVBJW0FQSSBTZXJ2ZXJdXG4gICAgICAgIFdFQjFbRm9ydW1dXG4gICAgICAgIFdFQjJbTWFpbiBBcHBdXG4gICAgICBlbmRcblxuICAgICAgQVIgLS4tfHJlcXVlc3QgYXV0aHwgR1dbR2F0ZXdheV1cbiAgICAgIEFVSSAtLS0gR1dcbiAgICAgIE9JREMgLS0tIEdXXG4gICAgICBBUEkgLS0tIEdXXG4gICAgICBTQVBJIC0tLSBHV1xuICAgICAgV0VCMSAtLS0gR1dcbiAgICAgIFdFQjIgLS0tIEdXXG4gICAgZW5kXG4gICAgR1cgLS0tIHxPSURDfCBNQVBQW01vYmlsZSBBcHBdXG4gICAgR1cgLS0tIHxTZXNzaW9uIGNvb2tpZXwgQ0xJW1dlYiBDbGllbnRdXG4gICAgR1cgLS0tIHxPSURDfCBBUFBCW0FwcCBCXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBBcHAgQVxuICAgICAgc3ViZ3JhcGggXCJBdXRob3JpemF0aW9uIFNlcnZlciAoYWNjb3VudHMuYXBwYS5jb20pXCJcbiAgICAgICAgREIgLS0tIEFSW0F1dGggUmVzb2x2ZXJdXG4gICAgICAgIERCW0F1dGggREJdIC0tLSBBUElbQXV0aCBBUEldXG4gICAgICAgIERCIC0tLSBPSURDW09JREMgQVBJXVxuICAgICAgICBEQiAtLS0gQVVJW0F1dGggVUldXG4gICAgICAgIEFVSSAtLS0gT0lEQ1xuICAgICAgZW5kXG5cbiAgICAgIHN1YmdyYXBoIFwiQXBwIFNlcnZpY2VzIChhcHBhLmNvbSlcIlxuICAgICAgICBTQVBJW0FQSSBTZXJ2ZXJdXG4gICAgICAgIFdFQjFbRm9ydW1dXG4gICAgICAgIFdFQjJbTWFpbiBBcHBdXG4gICAgICBlbmRcblxuICAgICAgQVIgLS4tfHJlcXVlc3QgYXV0aHwgR1dbR2F0ZXdheV1cbiAgICAgIEFVSSAtLS0gR1dcbiAgICAgIE9JREMgLS0tIEdXXG4gICAgICBBUEkgLS0tIEdXXG4gICAgICBTQVBJIC0tLSBHV1xuICAgICAgV0VCMSAtLS0gR1dcbiAgICAgIFdFQjIgLS0tIEdXXG4gICAgZW5kXG4gICAgR1cgLS0tIHxPSURDfCBNQVBQW01vYmlsZSBBcHBdXG4gICAgR1cgLS0tIHxTZXNzaW9uIGNvb2tpZXwgQ0xJW1dlYiBDbGllbnRdXG4gICAgR1cgLS0tIHxPSURDfCBBUFBCW0FwcCBCXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)

- User authenticates to the app using **Auth UI** on **Web Client**
  (i.e. web browser). Then, users can use **Web** service using a session
  cookie.
- User authenticates to the app using **Auth UI** using OIDC on **Mobile App**.
  Then, users can use **API Server** through the app using access/refresh
  tokens.
- **Mobile App** and **App Services** no longer has direct access to sensitive
  authentication data.
- **Gateway** resolves the session cookie/OIDC access token in incoming request
  using **Session Resolver** API of Authorization Server, and provides
  needed authentication data to **App Services**.
- First-party **App Services** can achieve SSO using a shared session cookie.
- Third-party app (e.g. **App B**) can use App A as identity provider through
  OIDC specification.
- **Auth API** is provided for backward compatibility.

## Concepts

- **First-party App/Service**: App/Service that users can verify to be under
  control of same owner as authorization server with high confidence.
    - Mobile apps are not first-party apps, since it is hard for user to verify
      origin of app from UI alone.
    - Web apps with same eTLD+1 are first-party apps, since user can easily
      verify the URL of web apps.
- **OpenID Provider**: The identity provider implementing OpenID Connect
  specification. In our case, Skygear Auth.
- **OIDC Client**: The client relying on the identity provided by OpenID
  Provider.
- **Authorization**: After getting consent from user in Authorization Server
  UI, a client obtains Authorization to access resources/sensitive
  authentication data of the user.
- **Grant**: A credential to access resources/sensitive authentication data of
  the user according to Authorization. In our implementation of OIDC, it
  includes Authorization Code, Access Token, and Refresh Token.
- **IdP Session**. A user session shared across first-party apps and
  Authorization Server. Represented as a HTTP cookie.

## Architecture

[![](https://mermaid.ink/img/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG4gICAgQXBwIFwiMVwiIC0tPiBcIk1cIiBDbGllbnRcbiAgICBBcHAgXCIxXCIgLS0-IFwiTVwiIFVzZXJcbiAgICBVc2VyIFwiMVwiIC0tPiBcIk1cIiBJZFBTZXNzaW9uIDogQXV0aCBVSSAvIEF1dGggQVBJIChjb29raWVzKVxuICAgIENsaWVudCBcIjFcIiAtLT4gXCJNXCIgQXV0aG9yaXphdGlvblxuICAgIFVzZXIgXCIxXCIgLS0-IFwiTVwiIEF1dGhvcml6YXRpb25cbiAgICBBdXRob3JpemF0aW9uIFwiMVwiIC0tPiBcIk1cIiBDb2RlR3JhbnQgOiBBdXRob3JpemF0aW9uIENvZGVcbiAgICBJZFBTZXNzaW9uIFwiMVwiIC0tPiBcIk1cIiBDb2RlR3JhbnRcbiAgICBDb2RlR3JhbnQgXCIxXCIgLS0-IFwiMVwiIEFjY2Vzc0dyYW50IDogd2ViIGFwcHNcbiAgICBDb2RlR3JhbnQgXCIxXCIgLS0-IFwiMVwiIE9mZmxpbmVHcmFudCA6IG9mZmxpbmVfYWNjZXNzIHNjb3BlIChpLmUuIG5hdGl2ZSBhcHBzKVxuICAgIFVzZXIgXCIxXCIgLS0-IFwiTVwiIE9mZmxpbmVHcmFudDogQXV0aCBBUEkgKHRva2VucylcbiAgICBPZmZsaW5lR3JhbnQgXCIxXCIgLS0-IFwiTVwiIEFjY2Vzc0dyYW50IDogcmVmcmVzaC9pc3N1ZSBhY2Nlc3MgdG9rZW5cbiAgICBcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG4gICAgQXBwIFwiMVwiIC0tPiBcIk1cIiBDbGllbnRcbiAgICBBcHAgXCIxXCIgLS0-IFwiTVwiIFVzZXJcbiAgICBVc2VyIFwiMVwiIC0tPiBcIk1cIiBJZFBTZXNzaW9uIDogQXV0aCBVSSAvIEF1dGggQVBJIChjb29raWVzKVxuICAgIENsaWVudCBcIjFcIiAtLT4gXCJNXCIgQXV0aG9yaXphdGlvblxuICAgIFVzZXIgXCIxXCIgLS0-IFwiTVwiIEF1dGhvcml6YXRpb25cbiAgICBBdXRob3JpemF0aW9uIFwiMVwiIC0tPiBcIk1cIiBDb2RlR3JhbnQgOiBBdXRob3JpemF0aW9uIENvZGVcbiAgICBJZFBTZXNzaW9uIFwiMVwiIC0tPiBcIk1cIiBDb2RlR3JhbnRcbiAgICBDb2RlR3JhbnQgXCIxXCIgLS0-IFwiMVwiIEFjY2Vzc0dyYW50IDogd2ViIGFwcHNcbiAgICBDb2RlR3JhbnQgXCIxXCIgLS0-IFwiMVwiIE9mZmxpbmVHcmFudCA6IG9mZmxpbmVfYWNjZXNzIHNjb3BlIChpLmUuIG5hdGl2ZSBhcHBzKVxuICAgIFVzZXIgXCIxXCIgLS0-IFwiTVwiIE9mZmxpbmVHcmFudDogQXV0aCBBUEkgKHRva2VucylcbiAgICBPZmZsaW5lR3JhbnQgXCIxXCIgLS0-IFwiTVwiIEFjY2Vzc0dyYW50IDogcmVmcmVzaC9pc3N1ZSBhY2Nlc3MgdG9rZW5cbiAgICBcbiIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6ZmFsc2V9)


- **User** login in Auth UI to creates **IdP Session**.
    - A session cookie is persisted to enable SSO across first-party apps.
- If **User** consents **Client**, **Authorization** is created.
    - Authorization can be revoked anytime by users.
- Refresh tokens (**OfflineGrant**) would be issued only if the client is
  allowed and requested it.
    - i.e. Grant type `refresh_token` is allowed in client metadata and
      `offline_access` scope is requested.
    - Offline grants are associated with Authorizations.
- Access tokens(**AccessGrant**) are issued if Authorization
  code(**CodeGrant**) or Refresh token(i.e. **OfflineGrant**) is used.
    - Access grants are associated with Authorizations.
    - Access grants may be associated with a **OfflineGrant**, or
      **IdP Session** (from **CodeGrant**).
- When **IdP Session** is invalidated, associated grants are also invalidated:
    - i.e. **CodeGrant** and **AccessGrant**.
- When **Authorization** is revoked, associated grants are also invalidated:
    - i.e. **CodeGrant**, **OfflineGrant**, and **AccessGrant**.
- **IdP Session** and **OfflineGrant** has common behaviors as sessions:
    - session attributes
    - last access updates
- Gateway would resolve **IdP Session** cookies and **AccessGrant** tokens
  into authentication data, and pass them to backend services as headers.
