# Implementation Guide

## Schema

The provider tables (i.e. identities) will be kept, but password hash in
password identity will be split out as a new type of authenticator (password
authenticator).

Existings authenticators for MFA would be kept and compatible with the new
design. Each authenticator would be associated with a user (i.e. 1 user to
many authenticators).

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
