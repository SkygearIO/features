# Background
Auth gear supports various identity providers, such as password credentials and
OAuth. Auth gear should support all identity providers equally well, and
provide a consistent API for manipulating principals.


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

**Principal**:
An identity associated with user. A user can have multiple principals. Since
the term 'Principal' is defined differently across many frameworks and
standards, we will instead use a simpler term 'Identity' for public interfaces.


# Proposed Design

## Re-authentication for Security
Many principal manipulation operations are critical for security:
- Add/remove login ID
- Link/unlink SSO provider
- Change password

By default, user are required to re-authenticate before performing these
operations. This is achieve by checking the issue time of the access token is
recent.

For change password, we support the common case of providing old password to
implicitly authenticate the user.

Both the re-auth requirement and time to considered 'recent' can be configured.
Developer can turn off the re-auth requirement in configuration. However,
developer should understand the potential security risk.

> Related config: `reauthForSecurity` and `reauthIntervalSeconds`
> Related API: `changePassword` function

## Current Principal
We need to provide a way for developer to get the principal is associated with
the current session:
- Which login ID is used to login?
- Which OAuth provider is used to login?

When logging in using a principal, the ID of the principal (i.e. the current
principal) would be embedded in the access token along with the user ID.
Information about the current principal would be returned in user object.

> Related API: `identity` field in `User` object

## Principal List
We need to provide a way for developer to get a list of principals belonged to
the user:
- What login IDs the user has?
- Which OAuth providers had the user linked?

A list of principals belonged to current user would be returned through an API.

> Related API: `listIdentities` function

# Creating Principal
We need to provide a way for developer to create new principal for the user:
- Add new login ID
- Link OAuth account

Each identity provider should have their specific API to create principal. APIs
that create principals should have common behaviors:
- Should respect re-authentication configuration

> Related API: `addLoginID` function for password identity provider

# Deleting Principal
We need to provide a way for developer to delete new principal for the user:
- Remove login ID
- Unlink OAuth account

Each identity provider should have their specific API to delete principal. APIs
that delete principals should have common behaviors:
- Should respect re-authentication configuration
- Should not allow deleting the current principal

> Related API: `removeLoginID` function for password identity provider

## Updating Principal
We do not allow changing the identity of a principal, e.g. changing the
login ID, changing the OAuth provider. Instead, developer should:
1. Create new principal
2. Ensure the new principal is in desired state (e.g. verification)
3. Delete old principal

## Replacing login ID
We cannot support changing username securely under the above design:
- User cannot remove/add login ID due to validation on login ID amount
- User cannot remove current login ID
- User cannot change login ID of existing login ID

To support this use case, we provide a replace login ID API that performs
recommended update principal procedure atomically with nessessary checks.
In addition, if current principal of the user is the login ID to replace, a new
access token with new login ID as current principal would be issued.

> Related API: `replaceLoginID` function

## Principal Metadata
We need to ensure the attributes of the principals can be understood easily:
- Send welcome email/SMS to login ID/OAuth account
- Listing principals with avatar of OAuth provider in user management portal
- Populating user metadata from external provider profile

Each identity provider should provide a function to derive metadata from 
provider-specific internal data of a principal:
- Password identity provider: the login ID keyed by the type of login ID key
                              specified in config.
- OAuth identity provider: the parsed profile obtained from origin identity
                           provider, mapped to keyed by standard keys.
- Custom token identity provider: the email embedded in the token.

Some of the keys in metadata may be standard keys (defined in #323), which
indicates the meaning of the value.

> Related API: `metadata` field in identity objects
