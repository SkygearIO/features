# Implementation Guide

## Schema

The provider tables (i.e. identities) will be kept, but password hash in
password identity will be split out as a new type of authenticator (password
authenticator).

Existings authenticators for MFA would be kept and compatible with the new
design. Each authenticator would be associated with a user (i.e. 1 user to
many authenticators).

## Authentication Session

Authentication sessions would have four kind of steps:
- Select identity: `identity:select`
    - A list of usable identities type would be available for selection.
    - User must provide sufficient information to determine the identity
      (e.g. login ID), to proceed.
- Perform primary authentication: `identity:authn`
    - A list of usable primary authenticator types would be available for
      selection.
    - Some of the available authenticator may have not been set up for the
      identity. These authenticators should always fail the authentication.
- Perform secondary authentication: `mfa:authn`
    - A list of usable secondary authenticators (set up for the user) would be
      available for selection.
    - At this step, we have sufficient confidence about user's identity to list
      usable authenticators of the user.
- Setup secondary authentication: `mfa:setup`
    - User must setup one secondary authenticator to proceed.

For Auth API, if client recieved authentication session, it will always be
one of the steps after `identity:authn` step. i.e. `mfa:authn` or `mfa:setup`.

## API models

Previously, we have two types of identities: `password` and `oauth`. Under the
new design, `password` type should be renamed to `login_id`.

Also, identity ID is removed from identity model, so that identity information
represent a snapshot of the identity at the time of authentication.

## Session Headers

The authenticator headers would be removed and replaced with the following
headers:
- `X-Skygear-Session-Acr`: `acr` claim, URI value.
- `X-Skygear-Session-Amr`: `amr` claim, space separated values.

Also, `X-Skygear-Session-Identity-Id` and `X-Skygear-Session-Identity-Updated-At`
headers would be removed.

## Authentication Session
OAuth API should pass parameters to Auth UI through query parameters. e.g.
for step up, prompt, re-authentication.
