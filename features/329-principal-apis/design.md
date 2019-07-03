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

## Current Principal
We need to provide a way for developer to get the principal is associated with
the current session:
- Which login ID is used to login?
- Which OAuth provider is used to login?

When logging in using a principal, the ID of the principal (i.e. the current
principal) would be embedded in the access token along with the user ID.
Information about the current principal would be returned in user object.

## Principal List
We need to provide a way for developer to get a list of principals belonged to
the user:
- What login IDs the user has?
- Which OAuth providers had the user linked?

A list of principals belonged to current user would be returned through an API.

# Creating Principal
We need to provide a way for developer to create new principal for the user:
- Add new login ID
- Link OAuth account

Each identity provider should have their specific API to create principal. APIs
that create principals should have common behaviors:
- Should respect re-authentication configuration

# Deleting Principal
We need to provide a way for developer to delete new principal for the user:
- Remove login ID
- Unlink OAuth account

Each identity provider should have their specific API to delete principal. APIs
that delete principals should have common behaviors:
- Should respect re-authentication configuration
- Should not allow a verified user to become unverified through the operation
- Should not allow deleting the current principal

## Updating Principal
We do not allow changing the identity of a principal, e.g. changing the
login ID, changing the OAuth provider. Instead, developer should:
1. Create new principal
2. Ensure the new principal is in desired state (e.g. verification)
3. Delete old principal

## Principal Metadata
We need to ensure the attributes of the principals can be understood easily:
- Send welcome email/SMS to login ID/OAuth account
- Listing principals with avatar of OAuth provider in user management portal
- Populating user metadata from external provider profile

Each identity provider should provide a function to get metadata from a
principal. Some of the keys in metadata may be standard keys (defined in #323),
which indicates the meaning of the value.
