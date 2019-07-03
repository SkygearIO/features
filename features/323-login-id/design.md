**NOTE: this specification deprecates #294: Login without specifiying login ID key**

# Background

## Current Design

Under current design of authentication:

1. Each **User** is associated with some **Principal**.
3. Each **Principal** is associated with one **Identity Provider** (e.g. password authentication, OAuth).
4. Password authentication principals is represented by tuple (**Login ID Key**, **Login ID**, password hash).
5. App developer can specify a list of white-listed login ID key, and all login ID key is allowed by default.
6. To signup using password authentication, user can provide a list of tuple (login ID key, login ID). e.g. `{ "username": "test", "email": "a@example.com" }`
7. For password authentication principals, user can login using login ID. e.g. `{ "login_id": "a@example.com" }`
8. Login IDs are globally unique in app, without considering associated login ID keys.
9. Auth gear does not know the semantics of login IDs.


## Problem
1. Some features requires semantics of login IDs to function.
2. Some authentication system designs may not be implemented easily in current design.


# Use cases

Considering some practical scenarios of authentication system:

## GitHub
1. Supports multiple emails per user, with email verification.
2. User can add/delete any amount of emails.
3. Only verified emails would be associated with the user in public.
4. User can allow recovery email/security alert to be sent to all verified emails or a specific verified email.


## Facebook
5. User can login with email/phone number/username, without indicating what type of value it is.
6. User can add/delete any amount of emails, which can be used to login after verification.
7. Disposable email address is blocked.
8. All emails/phones of user is verified.
9. Email communications are personalized with user language & name.

## Other systems
10. User may choose to login as different roles (e.g. teacher/student, admin/member).


# Design Objectives
1. Allow auth related features to understand semantics of some login IDs
2. Support multiple login ID with same login ID key
3. Support compound login IDs
4. Support creating/deleting login IDs


# Proposed Design Overview

## Use Implicit Login ID Key for Logging in
In a deprecated design (#294), user would login using just login ID. i.e:
```json
{
    "login_id": "a@example.com",
    "password": "12345678"
}
```

This feature would be kept to support implicit login ID key.

This addresses use case 5.


## Login ID Realm
If developer would like user to login with compound login ID, current suggested
approach is to use serialized compound login ID as login ID value.
i.e.:
```json
{ "login_id": "student:a@example.com" }
{ "login_id": "teacher:a@example.com" }
```

This approach would not allow auth features to understand semantics of the 
login ID component, since the format of serialization is left unspecified.

To support compound login ID better, a Realm would be associated with each
password authenticated principal.
- Realm is a user specified value, auth gear does not concern its semantics.
- Default realm is 'default' if unspecified, for application without need of compound login ID.
- Possible realm values are whitelisted.
- Realm would be considered when matching login ID with principal.
  i.e. password authenticated principals has unique (realm, login ID).
- API consumer could specify realm along with login ID when realm is required.

This solution should support majority of use case for compound login ID.

For example, when logging in with realms:
```json
{ "realm": "teacher", "login_id": "a@example.com", "password": "12345678" }
{ "realm": "student", "login_id": "a@example.com", "password": "12345678" }
```
If authentication succeed, both request would result in same user, with
different principals.

This addresses use case 10.

## Create/Delete Login ID
In a deprecated design (#294), user can create/update/delete login IDs.

Updating login ID would be problematic, since it would change the identity of
underlying principal. Therefore updating login ID is disallowed, allowing only 
create/delete login IDs. Instead, API consumer should:
- Create new login ID
- Ensure new login ID is usable (e.g. verification)
- Delete old login ID


## Allow Multiple Login ID per Login ID Key
In some website, user can associate multiple emails (potentially unlimited) with
same user. These email may be used in auth features:
- Login with multiple emails
- Backup email
- Welcome email

A login ID key should allow having multiple associated login ID.
When signing up, user should provide a list of login ID. e.g.
```json
{
    "login_ids": [
        { "username": "test" },
        { "email": "test+1@example.com" },
        { "email": "test+2@example.com" }
    ],
    "password": "12345678"
}
```

This addresses use case 6.


## Standard Keys
With reference to OpenID Connect standard claims, a list of standard keys
would be specified:
- `username`
- `email`
- `phone`
- etc.

These keys would be used in user metadata.


## Configurable Login ID Keys
The login ID keys are whitelisted by developer. In additional, developer can
configure each login ID key:
- The corresponding standard key (normalization may be applied)
- The minimum/maximum amount of login ID

The auth gear would use configured keys in password recovery and welcome message.


## Email/SMS Interpretation in Auth Features
Different auth features will interpret the email/SMS according to login ID keys
config:
- Signup will set initial value of user metadata with provided login IDs.
- Welcome message will be sent to email/phone login IDs when signup up.
- In future, CMS/Auth UI kit may use standard keys in user metadata.


# Design Detail
This specification would be implemented in stages:
1. [Implicit login ID key, Login ID realm](stage-1.md)
2. [Multiple login IDs per key, Configurable login ID keys, Standard keys](stage-2.md)
3. [Email/SMS Interpretation in Auth Features, Create/delete login ID](stage-3.md)

Design detail of each stage can be found in corresponding documents.

# Appendix

**OpenID Connect: Standard Claims**: https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims

