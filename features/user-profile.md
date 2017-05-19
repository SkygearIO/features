# API Design Overview

This document introduces the new Skygear User Record (Profile), which is
re-designed from user record and user object, utilizing user profile discovery.
The design depends on [the field-based ACL](field-based-acl.md) feature.

## New User Record

The newly designed user record contains different information of user.By
setting field-based ACL, user record can serve as both public profile and
private profile.

The following table gives an example of the field-based ACL of user record
fulfilling: 1) both username and email are readable and discoverable; 2) status
and profile photo are readable, but not queryable; 3) game score is queryable;
and 4) birthday is private:

| Class | UserRole |    Field    | AccessLevel | DiscoveryLevel |
|-------|----------|-------------|-------------|----------------|
| *     | Public   | *           | ReadWrite   | Queryable      |
| User  | Public   | *           | NoAccess    | NotQueryable   |
| User  | Owner    | *           | ReadWrite   | Queryable      |
| User  | AnyUser  | username    | ReadOnly    | Discoverable   |
| User  | AnyUser  | email       | ReadOnly    | Discoverable   |
| User  | AnyUser  | status      | ReadOnly    | NotQueryable   |
| User  | AnyUser  | profile_pic | ReadOnly    | NotQueryable   |
| User  | AnyUser  | game_score  | ReadOnly    | Queryable      |
| User  | AnyUser  | birthday    | NoAccess    | NotQueryable   |

## Authentication Object

The new authentication object (i.e. `_auth` object) is to replace the old
 `_user` object, to avoid ambiguity with the user record.

The authentication object contains the following fields:

- `id (text)`: should be the same as `user._id` as a convention
- `password (text)`: the password for authentication
- `provider_info (jsonb)`: the authentication information from Authentication
  Provider
- `token_valid_since`: the timestamp limit the validity of the authentication
  token
- `last_login_at`: the timestamp when the user last login
- `last_seen_at`: the timestamp when user last perform an action

## New Sign Up Method

<!-- TODO: New sign up method to help setting up public / private profile -->

# Sample Codes for Use Cases

<!--
  TODO: Give some sample code demonstrate how field-based ACL is set on
        user record
-->

<!--
  TODO: Give some sample code demonstrate how information in user record can
        be discovered.
-->

# Changes on SDK

The SDKs would be expected to have the following changes:

- All log in / sign up method would returns **a user record**, instead of
  a `_user` object.
- remove `getUserByEmails()`, `getUserByUsernames()`, `discoverUserByEmails()`
  and `discoverUserByUsernames()` in Skygear Container. These operations can be
  replaced by record query operation on user record
- remove `saveUser()` method. It can be replaced by record save operation on
  user record.

# Database Scheme

<!-- TODO: Provide migration SQL -->

1. Rename `_user` table to `_auth`
1. Move `username` and `email` from `_auth` to `user`
1. Insert correct field-based ACL on `user` record
