# Background
Auth gear supports various identity providers, such as password credentials and
OAuth. Auth gear should support all identity providers equally well, and
provide a consistent API for manipulating identities.


# Use Cases
- Get which method is used to log in the current session
- List all methods to authenticated as a user
- Add/remove user authentication method
- Send welcome email to OAuth accounts
- Populate user metadata according to external profile
- Create password credentials for users signed up with OAuth


# Glossary

**Identity Provider**:
A method to assert the identity of user. For example, providing a password or
perform OAuth flow.

**Identity**:
An identity associated with user. A user can have multiple identities.
Internally, this is known as 'Principal'.


# Proposed Design

## Re-authentication for Security
Many identity manipulation operations are critical for security:
- Add/remove/update login ID
- Link/unlink SSO provider
- Change password

By default, user are required to re-authenticate before performing these
operations. This is achieved by checking the issue time of the access token is
recent.

For change password, we support the common case of providing old password to
implicitly authenticate the user.

Both the re-auth requirement and time to considered 'recent' can be configured.
Developer can turn off the re-auth requirement in configuration. However,
developer should understand the potential security risk.

> Related config: `reauthentication`

## Current Identity
We need to provide a way for developer to get the identity is associated with
the current session:
- Which login ID is used to login?
- Which OAuth provider is used to login?

When logging in using a identity, the ID of the identity (i.e. the current
identity) would be embedded in the access token along with the user ID.
Information about the current identity would be returned in user object.

> Related API: `identity` field in auth container

## Listing Identity
We need to provide a way for developer to get a list of identitys belonged to
the user:
- What login IDs the user has?
- Which OAuth providers had the user linked?

A list of identities of the user would be returned through an API.

> Related API: `listIdentities` function

## Creating Identity
We need to provide a way for developer to create new identity for the user:
- Add new login ID
- Link OAuth account

Each identity provider should have their specific API to create identity. APIs
that create identitys should have common behaviors:
- Should respect re-authentication configuration

When signup as with multiple login IDs, the first login ID will be used as
current identity in the newly created session.

> Related API: `addLoginID` function, `linkOAuthProviderWithPopup/Redirect` function (#332)

## Deleting Identity
We need to provide a way for developer to delete existing identity for the user:
- Remove login ID
- Unlink OAuth account

Each identity provider should have their specific API to delete identity. APIs
that delete identitys should have common behaviors:
- Should respect re-authentication configuration
- Should not allow deleting the current identity

> Related API: `removeLoginID` function for password identity provider, `removeOAuthProvider` function (#332)

## Updating Identity
To change OAuth provider, link the new provider then unlink the old provider.

To change login ID, use `updateLoginID` API. It performs
recommended update identity procedure atomically with nessessary checks.
In addition, if current identity of the user is the login ID to update, a new
access token with new login ID as current identity would be issued. Note that
the ID of the relevant identities would be changed.

> Related config: `updateLoginIDEnabled`
> Related API: `updateLoginID` function, `linkOAuthProviderWithPopup/Redirect` & `removeOAuthProvider` function (#332)

## Identity Claims
We need to ensure the attributes of the identities can be understood easily:
- Send welcome email/SMS to login ID/OAuth account
- Listing identities with avatar of OAuth provider in user management portal
- Populating user metadata from external provider profile

Each identity provider should provide a function to derive claims from 
provider-specific internal data of a identity:
- Password identity provider: the login ID keyed by the type of login ID key
                              specified in config.
- OAuth identity provider: the parsed profile obtained from origin identity
                           provider, mapped to keyed by standard keys.
- Custom token identity provider: the email embedded in the token.

Some of the keys in claims may be standard keys (defined in #323), which
indicates the meaning of the value.

> Related API: `claims` field in identity objects


# Design Considerations

## Immutable Identity
Conceptually, identities are immutable. Developer should instead:
1. Create new identity
2. Ensure the new identity is in desired state (e.g. verification)
3. Delete old identity
